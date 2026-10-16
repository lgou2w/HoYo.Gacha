use std::borrow::Cow;
use std::collections::HashSet;
use std::time::Duration;

use hg_gamebiz::{GachaLogEndpoint, Game, Uid};
use hg_url_parser::finder::DirtyGachaUrl;
use hg_url_parser::{AsParamsOptions, GachaUrlParseError, ParsedGachaUrl};
use snafu::{ResultExt, Snafu};

use crate::KnownGachaType;
use crate::request::{GachaUrlRequestError, GachaUrlRequester, GachaUrlResponse, RetryOptions};

#[derive(Debug, Snafu)]
#[snafu(context(suffix(false)))]
pub enum GachaUrlValidationError {
  #[snafu(display("{source}"))]
  Parse { source: GachaUrlParseError },

  #[snafu(display("{source}"))]
  Request { source: GachaUrlRequestError },

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

#[derive(Clone, Debug, PartialEq, Eq, Default)]
pub struct VerifyOptions {
  /// Use the `Genshin Impact: Miliastra Wonderland` gacha log endpoint.
  ///
  /// When `true`, the request uses [`GachaLogEndpoint::Hk4eBeyond`] and the
  /// Miliastra Wonderland gacha type set instead of the standard Genshin Impact ones.
  pub is_beyond: bool,

  /// Skip URLs whose `auth_appid` is not `webview_gacha`.
  ///
  /// Gacha URLs collected from the game's disk cache always carry
  /// `auth_appid=webview_gacha`; URLs pasted by hand usually do not. Set to
  /// `true` when verifying cache-sourced URLs, `false` otherwise.
  pub is_webview_gacha: bool,

  /// When `true`, a URL that fails [`ParsedGachaUrl::parse`] returns
  /// immediately as [`GachaUrlValidationError::Parse`]. When `false`, the
  /// source is skipped and later sources are still tried.
  ///
  /// Set to `true` for single-source verification (e.g. a user-pasted URL),
  /// `false` when scanning a cache directory where some entries may be
  /// malformed.
  pub fail_parse: bool,
}

/// A source of a raw gacha URL string.
///
/// [`VerifiedGachaUrl::verify`] calls [`Self::url`] on every element of its
/// `sources` slice to obtain the string to parse. Implement this for any
/// type that carries a gacha URL — [`DirtyGachaUrl`], [`String`], `&str`,
/// or a wrapper of your own.
pub trait VerificationSource {
  /// Returns the raw URL string to parse and verify.
  fn url(&self) -> &str;
}

impl VerificationSource for DirtyGachaUrl {
  #[inline]
  fn url(&self) -> &str {
    &self.value
  }
}

impl VerificationSource for str {
  #[inline]
  fn url(&self) -> &str {
    self
  }
}

impl VerificationSource for String {
  #[inline]
  fn url(&self) -> &str {
    self.as_str()
  }
}

impl<T: VerificationSource + ?Sized> VerificationSource for &T {
  #[inline]
  fn url(&self) -> &str {
    (**self).url()
  }
}

impl<T: VerificationSource + ?Sized> VerificationSource for Box<T> {
  #[inline]
  fn url(&self) -> &str {
    (**self).url()
  }
}

/// A verified gacha URL that has been confirmed to belong to a specific uid.
///
/// Returned by [`Self::verify`].
///
/// # Lifetimes
///
/// `'a` is the lifetime of the `sources` slice passed to [`Self::verify`].
/// All borrowed fields — [`Self::url`], [`Self::params`], [`Self::parsed`],
/// [`Self::context`] — borrow from that slice, so the caller must keep it
/// alive for as long as this value is used.
///
/// `parsed` is an owned [`ParsedGachaUrl`] (there is no persistent value in
/// the caller's data to borrow from), but its inner `&'a str` fields still
/// point into `sources`.
#[derive(Debug)]
pub struct VerifiedGachaUrl<'a, C = ()> {
  /// Owner uid.
  pub uid: Uid,
  /// Endpoint without query parameters.
  pub url: &'a str,
  /// Query parameters reconstructed from the winning request.
  pub params: Vec<(&'static str, Cow<'a, str>)>,
  /// The parsed gacha URL that matched.
  pub parsed: ParsedGachaUrl<'a>,
  /// The source element that produced `parsed`.
  pub context: &'a C,
}

impl<'a, C> VerifiedGachaUrl<'a, C> {
  /// Verify which of the given `sources` corresponds to `uid`.
  ///
  /// Returns the first source whose parsed URL yields a gacha log for `uid`.
  /// Sources after the match are never parsed — matters when `sources` is a
  /// large cache list.
  ///
  /// Parse failures are handled according to [`VerifyOptions::fail_parse`]:
  /// in strict mode (`fail_parse = true`) the first failure returns
  /// immediately; in lenient mode (`fail_parse = false`) the source is
  /// skipped and later sources are still tried.
  ///
  /// # Errors
  ///
  /// - [`GachaUrlValidationError::Parse`] — a source failed to parse and
  ///   [`VerifyOptions::fail_parse`] is `true`.
  /// - [`GachaUrlValidationError::Request`] — the HTTP request failed
  ///   irrecoverably.
  /// - [`GachaUrlValidationError::EmptyData`] — every candidate returned an
  ///   empty list (e.g. the account's data has not been synced yet).
  /// - [`GachaUrlValidationError::NotFound`] — no source produced a valid
  ///   response.
  /// - [`GachaUrlValidationError::InconsistentUid`] — one or more sources
  ///   resolved to a `uid` other than `expected`.
  pub async fn verify<S>(
    uid: Uid,
    sources: &'a [C],
    options: VerifyOptions,
    sleeper: fn(Duration) -> S,
  ) -> Result<Self, GachaUrlValidationError>
  where
    C: VerificationSource + 'a,
    S: Future<Output = ()> + Send + 'static,
  {
    let mut endpoint = GachaLogEndpoint::Standard;
    let mut types = match uid.gamebiz().game() {
      Game::Hk4e => KnownGachaType::Hk4e,
      Game::Hkrpg => KnownGachaType::Hkrpg,
      Game::Nap => KnownGachaType::Nap,
    };

    // For 'Genshin Impact: Miliastra Wonderland'
    if options.is_beyond {
      endpoint = GachaLogEndpoint::Hk4eBeyond;
      types = KnownGachaType::Beyond;
    }

    let mut actuals = HashSet::<u32>::with_capacity(sources.len());
    let mut contains_empty = false;

    for source in sources {
      // `source: &'a C` — this borrow lives as long as `sources`.
      let parsed = match ParsedGachaUrl::parse(source.url()) {
        Ok(parsed) => parsed,
        Err(err) => {
          if options.fail_parse {
            return Err(GachaUrlValidationError::Parse { source: err });
          } else {
            continue;
          }
        }
      };

      // If it's a url from webcaches, then its 'auth_appid' parameter must
      // have this value; otherwise, you might encounter errors like
      // { retcode: -109, message: "app id error" }.
      // This error indicates that the `authkey` was not generated by the
      // `webview_gacha` endpoint. It's speculated that the `authkey` and
      // `auth_appid` parameters are bound together. Authkeys generated by
      // different endpoints cannot be used interchangeably.
      if options.is_webview_gacha && !parsed.is_auth_appid_webview_gacha() {
        continue;
      }

      // See: https://github.com/lgou2w/HoYo.Gacha/issues/159
      let response = fast_requests(&parsed, endpoint, types, sleeper)
        .await
        .context(Request)?;

      let Some(log) = response.data.as_ref().and_then(|logs| logs.list.first()) else {
        // It's possible. For example:
        //   There are no gacha logs.
        //   Server is not synchronising data (1 hour delay or more)
        contains_empty = true;
        // FIXME: continue may not be secure.
        //   If the account is not record data and there are hundreds of cached gacha urls
        //   (when gacha log are constantly opened in game)
        continue;
      };

      if log.uid == *uid {
        return Ok(Self {
          uid,
          url: response.url,
          params: response.params,
          parsed,
          context: source,
        });
      } else {
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
        EmptyData.fail()?
      } else {
        NotFound.fail()?
      }
    } else {
      // Apparently, these actual gacha urls do not match the expected uid
      InconsistentUid {
        expected: *uid,
        actuals,
      }
      .fail()?
    }
  }
}

async fn fast_requests<'a, S>(
  parsed: &ParsedGachaUrl<'a>,
  endpoint: GachaLogEndpoint,
  types: KnownGachaType,
  sleeper: fn(Duration) -> S,
) -> Result<GachaUrlResponse<'a>, GachaUrlRequestError>
where
  S: Future<Output = ()> + Send + 'static,
{
  // First, try the permanent gacha type because it is the most likely to be valid and has a higher priority.
  let permanent = types.permanent();
  let mut response = parsed
    .request_with_retry(
      endpoint,
      AsParamsOptions {
        size: Some(1),
        gacha_type: Some(permanent),
        ..Default::default()
      },
      RetryOptions::DEFAULT,
      sleeper,
    )
    .await?;

  // If the permanent gacha type does not return any log, then try the non-permanent gacha type.
  // This is a workaround for the accounts that have no log in the permanent gacha type.
  // See:
  //   https://github.com/HoYo.Gacha/issues/159
  if response.is_empty() {
    let gacha_types = types.values();
    for &gacha_type in gacha_types {
      // Skip the permanent gacha type because it has been requested.
      if gacha_type == permanent {
        continue;
      }

      response = parsed
        .request_with_retry(
          endpoint,
          AsParamsOptions {
            size: Some(1),
            gacha_type: Some(gacha_type),
            ..Default::default()
          },
          RetryOptions::DEFAULT,
          sleeper,
        )
        .await?;

      // Return early if the response is not empty,
      // which means the gacha url is valid and can be used to scrape gacha logs.
      if !response.is_empty() {
        return Ok(response);
      }
    }
  }

  Ok(response)
}

// Test
#[cfg(test)]
mod test {
  use super::*;

  // SAFETY
  const UID: Uid = Uid::parse(Game::Hk4e, 100_000_000).unwrap();

  #[tokio::test]
  async fn bad_url() {
    let err = VerifiedGachaUrl::verify(
      UID,
      &["bad url"],
      VerifyOptions {
        is_beyond: false,
        is_webview_gacha: false,
        fail_parse: true,
      },
      tokio::time::sleep,
    )
    .await
    .unwrap_err();

    assert!(matches!(
      err,
      GachaUrlValidationError::Parse {
        source: GachaUrlParseError::Invalid
      }
    ));
  }

  #[tokio::test]
  async fn bad_url_lenient() {
    let err = VerifiedGachaUrl::verify(
      UID,
      &["bad url"],
      VerifyOptions {
        is_beyond: false,
        is_webview_gacha: false,
        fail_parse: false,
      },
      tokio::time::sleep,
    )
    .await
    .unwrap_err();

    // In lenient mode, invalid URLs are skipped; with no
    // other sources left to try, the result is NotFound.
    assert!(matches!(err, GachaUrlValidationError::NotFound));
  }

  #[tokio::test]
  async fn empty_sources() {
    let sources: &[&str] = &[];
    let err = VerifiedGachaUrl::verify(UID, sources, VerifyOptions::default(), tokio::time::sleep)
      .await
      .unwrap_err();

    assert!(matches!(err, GachaUrlValidationError::NotFound));
  }

  #[tokio::test]
  async fn webview_gacha_filter_skips() {
    /// A well-formed URL without `auth_appid=webview_gacha`.
    const URL_NO_AUTH_APPID: &str = "https://public-operation-hk4e.mihoyo.com/gacha_info/api/getGachaLog?authkey_ver=1&sign_type=2&authkey=abc&lang=zh-cn&game_biz=hk4e_cn";

    let err = VerifiedGachaUrl::verify(
      UID,
      &[URL_NO_AUTH_APPID],
      VerifyOptions {
        is_beyond: false,
        is_webview_gacha: true,
        fail_parse: true,
      },
      tokio::time::sleep,
    )
    .await
    .unwrap_err();

    // URL filtered out before any HTTP request → NotFound.
    assert!(matches!(err, GachaUrlValidationError::NotFound));
  }
}
