use std::borrow::Cow;
use std::path::Path;

use hg_gamebiz::Uid;
use hg_url_parser::finder::{CreationTimePolicy, DirtyGachaUrl, GachaUrlFindError};
use hg_url_scraper::validate::{GachaUrlValidationError, VerifiedGachaUrl, VerifyOptions};
use serde::{Serialize, Serializer};
use snafu::{ResultExt, Snafu};
use time::OffsetDateTime;
use time::serde::rfc3339;
use tracing::{debug, warn};

use crate::constants;
use crate::database::schemas::AccountBusiness;
use crate::error::DetailedError;

#[derive(Debug, Snafu)]
#[snafu(context(suffix(false)))]
pub enum GachaUrlError {
  #[snafu(display("{source}"))]
  Find { source: GachaUrlFindError },

  #[snafu(display("{source}"))]
  Verify { source: GachaUrlValidationError },
}

impl DetailedError for GachaUrlError {
  fn name(&self) -> &'static str {
    // Source-bearing variants: delegate to the inner error, if it has
    // details of its own.
    match self {
      Self::Find { source } => source.name(),
      Self::Verify { source } => source.name(),
    }
  }

  fn details(&self) -> Option<serde_json::Value> {
    match self {
      // Source-bearing variants: delegate to the inner error, if it has
      // details of its own.
      Self::Find { source } => source.details(),
      Self::Verify { source } => source.details(),
    }
  }
}

/// A verified gacha URL that has been confirmed to belong to a specific uid.
///
/// Obtained by verifying raw URLs collected from the game's disk cache
/// (see [`Self::from_webcaches`]) or a single user-provided URL
/// (see [`Self::from_dirty`]). The stored `value` is a fully normalized
/// URL with correctly encoded query parameters, ready to be requested
/// against the gacha log endpoint.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GachaUrl {
  pub business: AccountBusiness,
  #[serde(serialize_with = "serialize_uid_value")]
  pub owner: Uid,
  #[serde(with = "rfc3339::option")]
  pub creation_time: Option<OffsetDateTime>,
  pub value: String,
}

fn serialize_uid_value<S: Serializer>(uid: &Uid, serializer: S) -> Result<S::Ok, S::Error> {
  serializer.serialize_u32(uid.value())
}

impl GachaUrl {
  /// Collect and verify gacha URLs from the game's `webCaches` directory.
  ///
  /// The directory is expected at `data_folder/webCaches`; if it does not
  /// exist, [`GachaUrlFindError::NotFound`] (wrapped in
  /// [`GachaUrlError::Find`]) is returned.
  ///
  /// Only URLs whose `auth_appid` parameter is `webview_gacha` are
  /// considered, matching how the game itself stores them in the cache.
  ///
  /// # Errors
  ///
  /// - [`GachaUrlError::Find`] — no valid cache entry could be read.
  /// - [`GachaUrlError::Verify`] — no URL matched `uid`, or every candidate
  ///   returned empty data (see [`GachaUrlValidationError`]).
  pub async fn from_webcaches<P: AsRef<Path>>(
    business: AccountBusiness,
    uid: Uid,
    data_folder: P,
  ) -> Result<Self, GachaUrlError> {
    from_webcaches(business, uid, data_folder.as_ref()).await
  }

  /// Verify a single user-provided gacha URL.
  ///
  /// `dirty` may be a raw URL copied from the game's UI; it does not need
  /// to be normalized or percent-encoded. `creation_time` on the resulting
  /// value is always `None` — a raw URL carries no cache timestamp.
  ///
  /// # Errors
  ///
  /// - [`GachaUrlError::Verify`] — the URL is unparseable, its owner does
  ///   not match `uid`, or the endpoint returns no data.
  pub async fn from_dirty(
    business: AccountBusiness,
    uid: Uid,
    dirty: impl Into<String>,
  ) -> Result<Self, GachaUrlError> {
    from_dirty(business, uid, dirty.into()).await
  }
}

/// See [`GachaUrl::from_webcaches`].
#[tracing::instrument(
  skip_all,
  fields(
    business,
    uid = uid.value(),
  ),
)]
pub async fn from_webcaches(
  business: AccountBusiness,
  uid: Uid,
  data_folder: &Path,
) -> Result<GachaUrl, GachaUrlError> {
  const WEBCACHES_FOLDER_NAME: &str = "webCaches";
  const POLICY: CreationTimePolicy = CreationTimePolicy::Valid;

  let webcaches_folder = data_folder.join(WEBCACHES_FOLDER_NAME);
  debug!(
    message = "Scanning webCaches for gacha URLs",
    ?webcaches_folder
  );

  let dirties = DirtyGachaUrl::from_webcaches(webcaches_folder, POLICY).context(Find)?;
  debug!(
    message = "Collected dirty gacha URLs from disk cache",
    count = dirties.len()
  );

  verify(
    business,
    uid,
    &dirties,
    VerifyOptions {
      is_beyond: business == AccountBusiness::MiliastraWonderland,
      is_webview_gacha: true,
      fail_checks: false,
    },
  )
  .await
  .inspect_err(|error| {
    warn!(
      message = "Failed to verify gacha URL from webCaches",
      ?error,
    );
  })
}

/// See [`GachaUrl::from_dirty`].
#[tracing::instrument(
  skip_all,
  fields(
    business,
    uid = uid.value(),
  ),
)]
pub async fn from_dirty(
  business: AccountBusiness,
  uid: Uid,
  dirty: String,
) -> Result<GachaUrl, GachaUrlError> {
  debug!(message = "Verifying manually provided gacha URL");
  verify(
    business,
    uid,
    &[DirtyGachaUrl {
      creation_time: None,
      value: dirty,
    }],
    VerifyOptions {
      is_beyond: business == AccountBusiness::MiliastraWonderland,
      is_webview_gacha: false,
      fail_checks: true,
    },
  )
  .await
}

#[tracing::instrument(
  skip_all,
  fields(
    business,
    uid = uid.value(),
    candidate_count = dirties.len(),
  ),
)]
async fn verify(
  business: AccountBusiness,
  uid: Uid,
  dirties: &[DirtyGachaUrl],
  options: VerifyOptions,
) -> Result<GachaUrl, GachaUrlError> {
  debug!(message = "Starting URL verification");
  VerifiedGachaUrl::verify(uid, dirties, options, tokio::time::sleep)
    .await
    .map(|verified| {
      let value = normalize_url(verified.url, &verified.params);
      let creation_time = verified
        .context
        .creation_time
        .map(|utc| utc.to_offset(*constants::LOCAL_OFFSET));

      let url = GachaUrl {
        business,
        owner: verified.uid,
        creation_time,
        value,
      };

      debug!(
        message = "Normalized verified URL",
        normalized_len = url.value.len(),
        creation_time = ?url.creation_time
      );

      url
    })
    .context(Verify)
    .inspect_err(|error| {
      warn!(message = "Verification rejected candidate URL(s)", ?error);
    })
}

/// Normalize a gacha URL by encoding its query parameters.
///
/// Returns the endpoint unchanged when `params` is empty; otherwise
/// appends `?` followed by the [`form_urlencoded`]-encoded query string.
/// See [`hg_url_parser::encode_params`] for the encoding rules.
fn normalize_url(endpoint: &str, params: &[(&'static str, Cow<'_, str>)]) -> String {
  match hg_url_parser::encode_params(params) {
    None => endpoint.to_owned(),
    Some(query) => format!("{endpoint}?{query}"),
  }
}
