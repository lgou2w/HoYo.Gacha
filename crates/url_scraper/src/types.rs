use std::ops::Deref;

use reqwest::Url;
use serde::{Deserialize, Serialize};
use time::PrimitiveDateTime;
use time::format_description::FormatItem;
use time::macros::format_description;

// Gacha Log use this format `yyyy-MM-dd HH:mm:ss`,
// but the timezone depends on the specific UID and the corresponding server.
pub const GACHA_LOG_TIME_FORMAT: &[FormatItem<'_>] =
  format_description! { "[year]-[month]-[day] [hour]:[minute]:[second]" };

// serde helper
time::serde::format_description! {
  pub gacha_log_time_format, PrimitiveDateTime, GACHA_LOG_TIME_FORMAT
}

pub mod gacha_log_gacha_id_or_item_id {
  pub mod option {
    use std::fmt::Display;

    use serde::de::IntoDeserializer;
    use serde::{Deserializer, Serializer};

    pub fn serialize<T, S>(num: &Option<T>, ser: S) -> Result<S::Ok, S::Error>
    where
      T: Display,
      S: Serializer,
    {
      hg_serde_helper::string_number_into::option::serialize(num, ser)
    }

    pub fn deserialize<'de, D>(de: D) -> Result<Option<u32>, D::Error>
    where
      D: Deserializer<'de>,
    {
      let opt: Option<String> = hg_serde_helper::de::empty_string_as_none(de)?;
      match opt {
        None => Ok(None),
        Some(str) => {
          let num: u64 = hg_serde_helper::string_number_into::deserialize(str.into_deserializer())?;
          let res = u32::try_from(num).map_err(serde::de::Error::custom)?;
          Ok(Some(res))
        }
      }
    }
  }
}

// JSON Structs

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct MihoyoResponse<T> {
  pub retcode: i32,
  pub message: String,
  pub data: Option<T>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct GachaLogs {
  pub list: Vec<GachaLog>,

  // Except for 'Genshin Impact: Miliastra Wonderland'
  pub region: Option<String>,
}

// 'Genshin Impact: Miliastra Wonderland' does not have this field,
// possibly to reduce data size. Therefore, the default value is 1.
const fn gacha_log_default_count() -> u32 {
  1
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct GachaLog {
  pub id: String,

  #[serde(with = "hg_serde_helper::string_number_into")]
  pub uid: u32,

  // `gacha_type`    -> Normally
  // `op_gacha_type` -> 'Genshin Impact: Miliastra Wonderland'
  #[serde(with = "hg_serde_helper::string_number_into", alias = "op_gacha_type")]
  pub gacha_type: u32,

  // 'Honkai: Star Rail', 'Zenless Zone Zero' only
  #[serde(
    with = "gacha_log_gacha_id_or_item_id::option",
    skip_serializing_if = "Option::is_none",
    default = "Option::default"
  )]
  pub gacha_id: Option<u32>,

  #[serde(with = "hg_serde_helper::string_number_into")]
  pub rank_type: u32,

  // Except for 'Genshin Impact: Miliastra Wonderland'
  // See the default function above.
  #[serde(
    with = "hg_serde_helper::string_number_into",
    default = "gacha_log_default_count"
  )]
  pub count: u32,

  #[serde(with = "gacha_log_time_format")]
  pub time: PrimitiveDateTime,

  // Except for 'Genshin Impact: Miliastra Wonderland'
  #[serde(skip_serializing_if = "Option::is_none", default = "Option::default")]
  pub lang: Option<String>,

  // `name`      -> Normally
  // `item_name` -> 'Genshin Impact: Miliastra Wonderland'
  #[serde(alias = "name")]
  pub item_name: String,

  pub item_type: String,

  // Except for 'Genshin Impact'
  #[serde(
    with = "gacha_log_gacha_id_or_item_id::option",
    skip_serializing_if = "Option::is_none",
    default = "Option::default"
  )]
  pub item_id: Option<u32>,

  //- 'Genshin Impact: Miliastra Wonderland' only
  #[serde(skip_serializing_if = "Option::is_none", default = "Option::default")]
  pub region: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none", default = "Option::default")]
  pub schedule_id: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none", default = "Option::default")]
  pub is_up: Option<String>,
  //-
}

impl GachaLog {
  /// Returns `true` if the `item_id` field is present.
  /// Except for 'Genshin Impact'.
  #[inline]
  pub const fn has_item_id(&self) -> bool {
    self.item_id.is_some()
  }
}

#[derive(Clone, Debug)]
pub struct GachaLogsResponse {
  pub(crate) inner: MihoyoResponse<GachaLogs>,
  pub url: Url,
}

impl GachaLogsResponse {
  #[inline]
  pub fn into_inner(self) -> MihoyoResponse<GachaLogs> {
    self.inner
  }
}

impl Deref for GachaLogsResponse {
  type Target = MihoyoResponse<GachaLogs>;

  fn deref(&self) -> &Self::Target {
    &self.inner
  }
}
