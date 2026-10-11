use std::borrow::Cow;
use std::collections::HashMap;

use hg_gamebiz::{Game, GameServer};
use snafu::{OptionExt, Snafu};

#[derive(Debug, Snafu)]
#[snafu(context(suffix(false)))]
pub enum GachaUrlParseError {
  #[snafu(display("Invalid Gacha url"))]
  Invalid,

  #[snafu(display("Gacha url missing parameter: {name}"))]
  MissingParam { name: &'static str },

  #[snafu(display("Unsupported gamebiz: {value}"))]
  UnsupportedGamebiz { value: String },
}

// Paramters
pub const PARAM_AUTH_APPID: &str = "auth_appid";
pub const PARAM_SIGN_TYPE: &str = "sign_type";
pub const PARAM_AUTHKEY_VER: &str = "authkey_ver";
pub const PARAM_AUTHKEY: &str = "authkey";
pub const PARAM_GAME_BIZ: &str = "game_biz";
pub const PARAM_REGION: &str = "region";
pub const PARAM_LANG: &str = "lang";
pub const PARAM_END_ID: &str = "end_id";
pub const PARAM_PAGE: &str = "page";
pub const PARAM_SIZE: &str = "size";
// These two parameters will vary depending on the specific Gamebiz.
//   Genshin Impact    : gacha_type & init_type
//   Honkai: Star Rail : gacha_type & default_gacha_type
//   Zenless Zone Zero : real_gacha_type & init_log_gacha_base_type
pub const PARAM_GACHA_TYPE: &str = "gacha_type";
pub const PARAM_REAL_GACHA_TYPE: &str = "real_gacha_type";
pub const PARAM_INIT_TYPE: &str = "init_type";
pub const PARAM_DEFAULT_GACHA_TYPE: &str = "default_gacha_type";
pub const PARAM_INIT_LOG_GACHA_BASE_TYPE: &str = "init_log_gacha_base_type";

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ParsedGachaType {
  pub name: &'static str,
  pub value: Option<u32>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ParsedGachaUrl<'a> {
  pub gamebiz: GameServer,

  // Required params
  pub sign_type: Cow<'a, str>,
  pub authkey_ver: Cow<'a, str>,
  pub authkey: Cow<'a, str>,
  pub lang: Cow<'a, str>,

  // Optional params
  pub region: Option<Cow<'a, str>>,
  pub auth_appid: Option<Cow<'a, str>>,
  pub gacha_type: ParsedGachaType,
  pub init_gacha_type: ParsedGachaType,
  pub end_id: Option<Cow<'a, str>>,
  pub size: Option<u32>,
  /// Deprecated (Please use the `end_id` parameter to turn pages)
  pub page: Option<u32>,

  //
  /// Other remaining query parameters
  pub queries: HashMap<Cow<'a, str>, Cow<'a, str>>,

  /// HACK: The endpoint URL value (before the question mark) that matches the regular expression.
  ///   However, it is not necessarily the Gacha log endpoint.
  pub url: &'a str,
}

impl<'a> ParsedGachaUrl<'a> {
  // Known Auth appid
  pub const AUTH_APPID_WEBVIEW_GACHA: &'static str = "webview_gacha";

  /// Returns `true` if the `auth_appid` is `webview_gacha`.
  #[inline]
  pub fn is_auth_appid_webview_gacha(&self) -> bool {
    self.auth_appid.as_deref() == Some(Self::AUTH_APPID_WEBVIEW_GACHA)
  }
}

// region: Parser

impl<'a> TryFrom<&'a str> for ParsedGachaUrl<'a> {
  type Error = GachaUrlParseError;

  #[inline]
  fn try_from(value: &'a str) -> Result<Self, Self::Error> {
    parse(value)
  }
}

impl<'a> ParsedGachaUrl<'a> {
  #[inline]
  pub fn parse(s: &'a str) -> Result<Self, GachaUrlParseError> {
    parse(s)
  }
}

pub fn parse<'a>(s: &'a str) -> Result<ParsedGachaUrl<'a>, GachaUrlParseError> {
  // Validate and parse queries
  let (url, mut queries) = {
    let start = s.find('?');
    if start.is_none() || !crate::REGEX_GACHA_URL.is_match(s) {
      return Err(GachaUrlParseError::Invalid);
    }

    let start = start.unwrap(); // SAFETY
    let queries = form_urlencoded::parse(&s.as_bytes()[start + 1..]);
    (&s[..start], queries.collect::<HashMap<_, _>>())
  };

  // Required params
  macro_rules! required_param {
    ($param:expr) => {
      queries
        .remove($param)
        .filter(|s| !s.is_empty())
        .context(MissingParam { name: $param })
    };
  }
  let sign_type = required_param! { PARAM_SIGN_TYPE }?;
  let authkey_ver = required_param! { PARAM_AUTHKEY_VER }?;
  let authkey = required_param! { PARAM_AUTHKEY }?;
  let game_biz = required_param! { PARAM_GAME_BIZ }?;
  let lang = required_param! { PARAM_LANG }?;

  // Validate game_biz, if unsupported, return error.
  let gamebiz = GameServer::resolve(&game_biz).with_context(|| UnsupportedGamebiz {
    value: game_biz.to_string(),
  })?;

  // These two parameters will vary depending on the specific Gamebiz.
  let (gacha_type_name, init_gacha_type_name) = match gamebiz.game() {
    Game::Hk4e => (PARAM_GACHA_TYPE, PARAM_INIT_TYPE),
    Game::Hkrpg => (PARAM_GACHA_TYPE, PARAM_DEFAULT_GACHA_TYPE),
    Game::Nap => (PARAM_REAL_GACHA_TYPE, PARAM_INIT_LOG_GACHA_BASE_TYPE),
  };

  // Optional params
  macro_rules! gacha_type_param {
    ($name:expr) => {
      ParsedGachaType {
        name: $name,
        value: required_param! { $name }.ok().and_then(|s| s.parse().ok()),
      }
    };
  }
  let region = queries.remove(PARAM_REGION);
  let auth_appid = queries.remove(PARAM_AUTH_APPID);
  let gacha_type = gacha_type_param! { gacha_type_name };
  let init_gacha_type = gacha_type_param! { init_gacha_type_name };
  let end_id = queries.remove(PARAM_END_ID);
  let size = queries.remove(PARAM_SIZE).and_then(|s| s.parse().ok());
  let page = queries.remove(PARAM_PAGE).and_then(|s| s.parse().ok());

  Ok(ParsedGachaUrl {
    gamebiz,
    sign_type,
    authkey_ver,
    authkey,
    lang,
    region,
    auth_appid,
    gacha_type,
    init_gacha_type,
    end_id,
    size,
    page,
    queries,
    url,
  })
}

// endregion

// region: As Params

#[derive(Clone, Debug, PartialEq, Eq, Default)]
pub struct AsParamsOptions<'a> {
  pub lang: Option<&'a str>,
  pub gacha_type: Option<u32>,
  pub init_gacha_type: Option<u32>,
  pub end_id: Option<&'a str>,
  pub size: Option<u32>,
  /// Deprecated (Please use the `end_id` parameter to turn pages)
  pub page: Option<u32>,
}

impl<'a> ParsedGachaUrl<'a> {
  /// Convert the current parsed Gacha URL into an array of query parameters for an HTTP request.
  /// If optional parameters for `options` are provided, then use them first.
  pub fn as_params(&'a self, options: AsParamsOptions<'a>) -> Vec<(&'static str, Cow<'a, str>)> {
    let mut params = vec![
      // Required params
      (PARAM_SIGN_TYPE, Cow::clone(&self.sign_type)),
      (PARAM_AUTHKEY_VER, Cow::clone(&self.authkey_ver)),
      (PARAM_AUTHKEY, Cow::clone(&self.authkey)),
      (PARAM_GAME_BIZ, Cow::Borrowed(self.gamebiz.codename())),
    ];

    macro_rules! push_param {
      ($key:expr, Owned($value:expr)) => {
        if let Some(value) = $value {
          params.push(($key, Cow::Owned(value.to_string())));
        }
      };
      ($key:expr, Borrowed($value:expr)) => {
        if let Some(value) = $value {
          params.push(($key, Cow::Borrowed(value)));
        }
      };
    }

    // Allow overriding lang and gacha_type
    push_param! { PARAM_REGION, Borrowed(self.region.as_deref()) }
    push_param! { PARAM_LANG, Borrowed(options.lang.or(Some(&self.lang))) }
    push_param! { PARAM_AUTH_APPID, Borrowed(self.auth_appid.as_deref()) }
    push_param! { self.gacha_type.name, Owned(options.gacha_type.or(self.gacha_type.value)) }
    push_param! { self.init_gacha_type.name, Owned(options.init_gacha_type.or(self.init_gacha_type.value)) }

    // Optional params
    push_param! { PARAM_END_ID, Borrowed(options.end_id.or(self.end_id.as_deref())) }
    push_param! { PARAM_SIZE, Owned(options.size.or(self.size)) }
    push_param! { PARAM_PAGE, Owned(options.page) }

    params
  }
}

// endregion

// Tests
#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn parse_success() {
    let dirty = "https://public-operation-hkrpg.mihoyo.com/common/gacha_record/api/getGachaLog?authkey_ver=1&sign_type=2&region=prod_gf_cn&default_gacha_type=11&lang=zh-cn&game_biz=hkrpg_cn&page=1&size=5&gacha_type=11&end_id=0&authkey=yourauthkey%2B";

    let parsed = parse(dirty).unwrap();
    assert_eq!(parsed.gamebiz, GameServer::HKRPG_CN);
    assert_eq!(parsed.sign_type, "2");
    assert_eq!(parsed.authkey_ver, "1");
    assert_eq!(parsed.authkey, "yourauthkey+"); // '+' == "%2B"
    assert_eq!(parsed.lang, "zh-cn");
    assert_eq!(parsed.auth_appid, None);
    assert_eq!(
      parsed.gacha_type,
      ParsedGachaType {
        name: "gacha_type",
        value: Some(11)
      }
    );
    assert_eq!(
      parsed.init_gacha_type,
      ParsedGachaType {
        name: "default_gacha_type",
        value: Some(11)
      }
    );
    assert_eq!(parsed.end_id.as_deref(), Some("0"));
    assert_eq!(parsed.size, Some(5));
    assert_eq!(parsed.page, Some(1));
    assert!(parsed.queries.is_empty());
    assert_eq!(
      parsed.url,
      "https://public-operation-hkrpg.mihoyo.com/common/gacha_record/api/getGachaLog"
    );
  }
}
