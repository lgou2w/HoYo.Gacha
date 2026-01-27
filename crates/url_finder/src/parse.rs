use std::borrow::Cow;
use std::collections::HashMap;

use hg_game_biz::{Game, GameBiz};
use snafu::{OptionExt, Snafu};

use crate::REGEX_GACHA_URL;

#[derive(Debug, Snafu)]
pub enum ParsedGachaUrlError {
  #[snafu(display("Invalid Gacha url"))]
  InvalidUrl,

  #[snafu(display("Gacha url missing required parameter: {name}"))]
  RequiredParam { name: &'static str },

  #[snafu(display("Unsupported game biz and region combination: {game_biz} / {region}"))]
  UnsupportedGameBiz { game_biz: String, region: String },
}

#[derive(Clone, Debug)]
pub struct ParsedGachaType {
  pub name: &'static str,
  pub value: Option<u32>,
}

/// A Gacha URL after validating and parsing parameters.
#[derive(Clone, Debug)]
pub struct ParsedGachaUrl<'a> {
  // Required params
  pub game_biz: &'static GameBiz,
  pub sign_type: Cow<'a, str>,
  pub authkey_ver: Cow<'a, str>,
  pub authkey: Cow<'a, str>,
  pub lang: Cow<'a, str>,
  // Optional params
  pub gacha_type: ParsedGachaType,
  pub init_gacha_type: ParsedGachaType,
  pub end_id: Option<Cow<'a, str>>,
  pub size: Option<u32>,
  // pub page: Option<u32>, // Deprecated
  //
  /// HACK: The base URL value (before the question mark) that matches the regular expression.
  ///   However, it is not necessarily the API Endpoint.
  pub base_url: &'a str,
  /// Other remaining query parameters
  pub queries: HashMap<Cow<'a, str>, Cow<'a, str>>,
}

// Required params
pub const PARAM_SIGN_TYPE: &str = "sign_type";
pub const PARAM_AUTHKEY_VER: &str = "authkey_ver";
pub const PARAM_AUTHKEY: &str = "authkey";
pub const PARAM_GAME_BIZ: &str = "game_biz";
pub const PARAM_REGION: &str = "region";
pub const PARAM_LANG: &str = "lang";
pub const PARAM_END_ID: &str = "end_id";
pub const PARAM_PAGE: &str = "page";
pub const PARAM_SIZE: &str = "size";

impl<'a> ParsedGachaUrl<'a> {
  /// Validate the format of a dirty URL and parse the required parameters.
  /// The format is shown in the regular expression above.
  pub fn from_dirty(s: &'a str) -> Result<Self, ParsedGachaUrlError> {
    let query_start = s.find('?');
    if query_start.is_none() || !REGEX_GACHA_URL.is_match(s) {
      return InvalidUrlSnafu.fail();
    }

    let query_start = query_start.unwrap(); // SAFETY
    let base_url = &s[..query_start];

    let queries_str = &s[query_start + 1..];
    let mut queries = form_urlencoded::parse(queries_str.as_bytes()).collect::<HashMap<_, _>>();

    // Required params
    macro_rules! required_param {
      ($param:expr) => {
        queries
          .remove($param)
          .filter(|s| !s.is_empty())
          .context(RequiredParamSnafu { name: $param })
      };
    }

    let sign_type = required_param! { PARAM_SIGN_TYPE }?;
    let authkey_ver = required_param! { PARAM_AUTHKEY_VER }?;
    let authkey = required_param! { PARAM_AUTHKEY }?;
    let game_biz = required_param! { PARAM_GAME_BIZ }?;
    let region = required_param! { PARAM_REGION }?;
    let lang = required_param! { PARAM_LANG }?;

    // Validate game_biz and region combination
    // If unsupported, return error.
    let game_biz =
      GameBiz::from_codename(&game_biz, &region).with_context(|| UnsupportedGameBizSnafu {
        game_biz: game_biz.to_string(),
        region: region.to_string(),
      })?;

    // These two parameters will vary depending on the specific Game biz.
    // See the top of the code for details.
    //   Genshin Impact    : gacha_type & init_type
    //   Honkai: Star Rail : gacha_type & default_gacha_type
    //   Zenless Zone Zero : real_gacha_type & init_log_gacha_base_type
    let (gacha_type_name, init_gacha_type_name) = match game_biz.game() {
      Game::Hk4e => ("gacha_type", "init_type"),
      Game::Hkrpg => ("gacha_type", "default_gacha_type"),
      Game::Nap => ("real_gacha_type", "init_log_gacha_base_type"),
    };

    // Optional params
    macro_rules! gacha_type_param {
      ($name:expr) => {
        ParsedGachaType {
          name: $name,
          value: required_param! { $name }
            .ok()
            .and_then(|s| s.parse::<u32>().ok()),
        }
      };
    }

    let gacha_type = gacha_type_param! { gacha_type_name };
    let init_gacha_type = gacha_type_param! { init_gacha_type_name };

    let end_id = queries.remove(PARAM_END_ID);
    let size = queries.remove(PARAM_SIZE).and_then(|s| s.parse::<_>().ok());
    // let page = queries.remove(PARAM_PAGE).and_then(|s| s.parse::<_>().ok());

    Ok(Self {
      game_biz,
      sign_type,
      authkey_ver,
      authkey,
      lang,
      gacha_type,
      init_gacha_type,
      end_id,
      size,
      // page,
      base_url,
      queries,
    })
  }
}

#[derive(Clone, Debug, Default)]
pub struct AsQueriesOptions<'a> {
  pub lang: Option<&'a str>,
  pub gacha_type: Option<u32>,
  pub init_gacha_type: Option<u32>,
  pub end_id: Option<&'a str>,
  pub size: Option<u32>,
  // When page turning is required, the `end_id` parameter should be used.
  // This is because the `page` parameters are deprecated.
  pub page: Option<u32>,
}

impl<'a> ParsedGachaUrl<'a> {
  #[inline]
  pub fn as_queries(&self) -> Vec<(&'static str, Cow<'_, str>)> {
    self.as_queries_with(AsQueriesOptions::default())
  }

  /// Convert the current parsed Gacha URL into an array of query parameters for an HTTP request.
  /// If optional parameters for `options` are provided, then use them first.
  pub fn as_queries_with(
    &'a self,
    options: AsQueriesOptions<'a>,
  ) -> Vec<(&'static str, Cow<'a, str>)> {
    let mut queries = vec![
      // Required params
      (PARAM_SIGN_TYPE, Cow::clone(&self.sign_type)),
      (PARAM_AUTHKEY_VER, Cow::clone(&self.authkey_ver)),
      (PARAM_AUTHKEY, Cow::clone(&self.authkey)),
      (PARAM_GAME_BIZ, Cow::Borrowed(self.game_biz.codename())),
      (PARAM_REGION, Cow::Borrowed(self.game_biz.region())),
    ];

    macro_rules! push_query {
      ($key:expr, Owned($value:expr)) => {
        if let Some(value) = $value {
          queries.push(($key, Cow::Owned(value.to_string())));
        }
      };
      ($key:expr, Borrowed($value:expr)) => {
        if let Some(value) = $value {
          queries.push(($key, Cow::Borrowed(value)));
        }
      };
    }

    // Allow overriding lang and gacha_type
    push_query! { PARAM_LANG, Borrowed(options.lang.or(Some(&self.lang))) }
    push_query! { self.gacha_type.name, Owned(options.gacha_type.or(self.gacha_type.value)) }
    push_query! { self.init_gacha_type.name, Owned(options.init_gacha_type.or(self.init_gacha_type.value)) }

    // Optional params
    push_query! { PARAM_END_ID, Borrowed(options.end_id.or(self.end_id.as_deref())) }
    push_query! { PARAM_SIZE, Owned(options.size.or(self.size)) }
    push_query! { PARAM_PAGE, Owned(options.page) }

    queries
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_parse_invalid_url() {
    macro_rules! case {
      ($s:expr) => {
        assert!(matches!(
          ParsedGachaUrl::from_dirty($s),
          Err(ParsedGachaUrlError::InvalidUrl { .. })
        ))
      };
    }

    case! { "invalid url" }
    case! { "https://hello.world" }
    case! { "https://.mihoyo.com" }
    case! { "https://.mihoyo.com?foo=bar" }
  }

  #[test]
  fn test_parse_required_param() {
    macro_rules! case {
      ($s:expr, $name:expr) => {
        assert!(matches!(
          ParsedGachaUrl::from_dirty($s),
          Err(ParsedGachaUrlError::RequiredParam { name }) if name == $name,
        ))
      };
    }

    // Note that the error for a missing `authkey` parameter
    // is `InvalidUrl` because it fails regular expression validation.
    case! { "https://.mihoyo.com?authkey=1", PARAM_SIGN_TYPE }
    case! { "https://.mihoyo.com?authkey=1&sign_type=1", PARAM_AUTHKEY_VER }
    case! { "https://.mihoyo.com?authkey=1&sign_type=1&authkey_ver=1", PARAM_GAME_BIZ }
    case! { "https://.mihoyo.com?authkey=1&sign_type=1&authkey_ver=1&game_biz=1", PARAM_REGION }
    case! { "https://.mihoyo.com?authkey=1&sign_type=1&authkey_ver=1&game_biz=1&region=1", PARAM_LANG }
  }
}
