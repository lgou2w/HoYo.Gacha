use std::collections::HashSet;
use std::path::PathBuf;

use hg_game_biz::{GachaLogEndpointType, Uid};
use hg_url_finder::dirty::{CreationTimePolicy, DirtyGachaUrl, DirtyGachaUrlError};
use hg_url_finder::parse::{AsQueriesOptions, ParsedGachaUrl, ParsedGachaUrlError};
use hg_url_scraper::requester::{GachaUrlRequestError, GachaUrlRequester, RetryOptions};
use serde::Serialize;
use snafu::{OptionExt, ResultExt, Snafu};
use time::OffsetDateTime;
use time::serde::rfc3339;
use tracing::{error, info, warn};

use crate::business::prettized::permanent_gacha_type;
use crate::constants;
use crate::database::schemas::AccountBusiness;
use crate::error::{AppError, ErrorDetails};

#[derive(Debug, Snafu)]
pub enum GachaUrlError {
  #[snafu(display("Invalid {business:?} account uid: {value}"))]
  InvalidUid {
    business: AccountBusiness,
    value: u32,
  },

  #[snafu(display("{source}"))]
  Dirty { source: DirtyGachaUrlError },

  #[snafu(display("{source}"))]
  Parse { source: ParsedGachaUrlError },

  #[snafu(display("{source}"))]
  Scrape { source: GachaUrlRequestError },

  #[snafu(display("Gacha url with empty data"))]
  EmptyData,

  #[snafu(display("No gacha url found"))]
  NotFound,

  #[snafu(display(
    "Owner uid of the gacha url does not match: {actuals:?} (Expected: {expected})"
  ))]
  InconsistentUid {
    expected: u32,
    actuals: HashSet<u32>,
  },
}

impl ErrorDetails for GachaUrlError {
  fn name(&self) -> &'static str {
    match self {
      Self::Dirty { source } => source.name(),
      Self::Parse { source } => source.name(),
      Self::Scrape { source } => source.name(),
      _ => stringify!(GachaUrlError),
    }
  }

  fn details(&self) -> Option<serde_json::Value> {
    use serde_json::json;

    match self {
      Self::InvalidUid { business, value } => Some(json!({
        "kind": stringify!(InvalidUid),
        "business": business,
        "value": value,
      })),
      Self::Dirty { source } => source.details(),
      Self::Parse { source } => source.details(),
      Self::Scrape { source } => source.details(),
      Self::EmptyData => Some(json!({
        "kind": stringify!(EmptyData),
      })),
      Self::NotFound => Some(json!({
        "kind": stringify!(NotFound),
      })),
      Self::InconsistentUid { expected, actuals } => Some(json!({
        "kind": stringify!(InconsistentUid),
        "expected": expected,
        "actuals": actuals,
      })),
    }
  }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GachaUrl {
  pub business: AccountBusiness,
  pub owner_uid: u32,
  #[serde(with = "rfc3339::option")]
  pub creation_time: Option<OffsetDateTime>,
  pub value: String,
}

impl GachaUrl {
  /// Read all valid gacha urls from the webcaches data folder
  /// and check for timeliness and consistency to get the latest gacha url.
  #[tracing::instrument]
  pub async fn from_webcaches(
    business: AccountBusiness,
    uid: u32,
    data_folder: PathBuf, // Game data folder
  ) -> Result<Self, AppError<GachaUrlError>> {
    let webcaches_folder = data_folder.join("webCaches");
    let urls = DirtyGachaUrl::from_webcaches(webcaches_folder, CreationTimePolicy::Valid)
      .context(DirtySnafu)?;

    Self::validate(business, uid, urls, false).await
  }

  /// Verifying timeliness and consistency from a dirty gacha url
  #[tracing::instrument]
  pub async fn from_dirty(
    business: AccountBusiness,
    uid: u32,
    dirty: String,
  ) -> Result<Self, AppError<GachaUrlError>> {
    let urls = vec![DirtyGachaUrl {
      // Because the creation time is not known from the dirty gacha url.
      // The server will not return the creation time.
      creation_time: None,
      value: dirty,
    }];

    Self::validate(business, uid, urls, true).await
  }

  #[tracing::instrument(skip(urls), fields(urls = urls.len()))]
  async fn validate(
    business: AccountBusiness,
    uid: u32,
    urls: Vec<DirtyGachaUrl>,
    spread_err: bool,
  ) -> Result<Self, AppError<GachaUrlError>> {
    // First, Verify the uid
    let uid = Uid::validate(business.as_game(), uid).context(InvalidUidSnafu {
      business,
      value: uid,
    })?;

    info!("Find owner consistency gacha url...");
    let is_miliastra_wonderland = business == AccountBusiness::MiliastraWonderland;
    let mut actuals = HashSet::<u32>::with_capacity(urls.len());
    let mut contains_empty = false;

    for dirty in urls {
      let parsed = match ParsedGachaUrl::from_dirty(&dirty.value).context(ParseSnafu) {
        Ok(parsed) => parsed,
        Err(err) => {
          error!("Error parsing gacha url: {err:?}");

          if spread_err {
            return Err(err)?;
          } else {
            continue;
          }
        }
      };

      let response = parsed
        .request_with_retry(
          if is_miliastra_wonderland {
            GachaLogEndpointType::Beyond
          } else {
            GachaLogEndpointType::Standard
          },
          AsQueriesOptions {
            size: Some(1),
            gacha_type: Some(permanent_gacha_type(business)),
            ..Default::default()
          },
          RetryOptions::default(),
          tokio::time::sleep,
        )
        .await
        .inspect_err(|err| error!("Error requesting gacha url: {err:?}"))
        .context(ScrapeSnafu)?;

      let Some(log) = response.data.as_ref().and_then(|logs| logs.list.first()) else {
        // It's possible. For example:
        //   There are no gacha records.
        //   Server is not synchronising data (1 hour delay or more)
        warn!("Gacha url responded with empty record data");
        contains_empty = true;

        // FIXME: continue may not be secure.
        //   If the account is not record data and there are hundreds of cached gacha urls
        //   (when gacha record are constantly opened in game)
        continue;
      };

      if log.uid == uid.value() {
        info!(
          message = "Capture the gacha url with the expected uid",
          expected_uid = uid.value(),
          creation_time = ?dirty.creation_time,
          url = ?dirty.value,
        );

        return Ok(Self {
          business,
          owner_uid: uid.value(),
          creation_time: dirty
            .creation_time
            .map(|utc| utc.to_offset(*constants::LOCAL_OFFSET)),
          value: response.url.to_string(),
        });
      } else {
        // The gacha url does not match the expected uid
        actuals.insert(log.uid);
      }
    }

    if actuals.is_empty() {
      // No matching uid found from gacha urls
      if contains_empty {
        // HACK: If the account's record data has not been
        //   synchronised, then a special error kind is returned.
        //   When the record is empty, it is impossible to determine whether
        //   the URL is consistent with the expected UID. This is a necessary measure.
        warn!("Gacha url exists for empty record data.");
        EmptyDataSnafu.fail()?
      } else {
        warn!("No gacha url found");
        NotFoundSnafu.fail()?
      }
    } else {
      // Apparently, these actual gacha urls do not match the expected uid
      warn!(
        message = "The expected uid does not match the owner of the existing gacha urls",
        expected_uid = %uid.value(),
        ?actuals
      );

      InconsistentUidSnafu {
        expected: uid.value(),
        actuals,
      }
      .fail()?
    }
  }
}
