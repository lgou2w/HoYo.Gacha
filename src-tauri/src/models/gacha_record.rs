use serde::{Deserialize, Serialize};
use time::serde::rfc3339;
use time::{OffsetDateTime, PrimitiveDateTime};

use super::{Business, Properties};
use crate::utilities::serde_helper;

// HACK: Known gacha record data structures.
//
//              | Genshin Impact               | Honkai: Star Rail       | Zenless Zone Zero            | Miliastra Wonderland      |
// |------------|------------------------------|-------------------------|------------------------------|---------------------------|
// | business   | 0                            | 1                       | 2                            | 3                         |
// | uid        | 100_000_000                  | <-                      | 10_000_000                   | Genshin Impact            |
// | id         | 1675850760000000000          | <-                      | <-                           | Genshin Impact            |
// | gacha_type | 100, 200, 301, 400, 302, 500 | 1, 2, 11, 12, 21, 22    | 1, 2, 3, 5                   | 1000, 200[11, 12, 21, 22] |
// | gacha_id   | Null                         | Some                    | Some                         | Null                      |
// | rank_type  | 3, 4, 5                      | <-                      | 2, 3, 4                      | Genshin Impact            |
// | count      | 1                            | <-                      | <-                           | <-                        |
// | lang       | en-us                        | <-                      | <-                           | <-                        |
// | time       | 2023-01-01T00:00:00±??:00    | <-                      | <-                           | <-                        |
// | name       | Some                         | <-                      | <-                           | <-                        |
// | item_type  | [Character, Weapon]          | [Character, Light Cone] | [Agents, W-Engines, Bangboo] |                           |
// | item_id    | Empty                        | Some                    | Some                         | Some                      |
// | properties | Null                         | Null                    | Null                         | Some                      |
// |------------|------------------------------|-------------------------|------------------------------|---------------------------|
//
// Note:
//   `<-`    : Same as the left side.
//   `Null`  : This field does not exist.
//   `Some`  : Have values and are different.
//   `Empty` : Is the empty string.
//

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GachaRecord {
  pub business: Business,
  pub uid: u32,
  pub id: String,
  pub gacha_type: u32,
  pub gacha_id: Option<u32>,
  pub rank_type: u32,
  pub count: u32,
  pub lang: String,
  #[serde(with = "rfc3339")]
  pub time: OffsetDateTime,
  pub name: String,
  pub item_type: String,
  // HACK: Must read from string and write as string,
  // But in the program, parse is u32 type.
  #[serde(with = "serde_helper::string_number_into")]
  pub item_id: u32,
  pub properties: Option<Properties>,
}

impl GachaRecord {
  #[inline]
  pub const fn is_gacha_type_bangboo(&self) -> bool {
    match self.business {
      Business::ZenlessZoneZero => self.gacha_type == 5,
      _ => false,
    }
  }

  /// HACK: 'Genshin Impact: Miliastra Wonderland' only
  #[inline]
  pub const fn is_rank_type_green(&self) -> bool {
    match self.business {
      Business::MiliastraWonderland => self.rank_type == 2,
      _ => false,
    }
  }

  #[inline]
  pub const fn is_rank_type_blue(&self) -> bool {
    match self.business {
      Business::GenshinImpact | Business::MiliastraWonderland | Business::HonkaiStarRail => {
        self.rank_type == 3
      }
      Business::ZenlessZoneZero => self.rank_type == 2,
    }
  }

  #[inline]
  pub const fn is_rank_type_purple(&self) -> bool {
    match self.business {
      Business::GenshinImpact | Business::MiliastraWonderland | Business::HonkaiStarRail => {
        self.rank_type == 4
      }
      Business::ZenlessZoneZero => self.rank_type == 3,
    }
  }

  #[inline]
  pub const fn is_rank_type_golden(&self) -> bool {
    match self.business {
      Business::GenshinImpact | Business::MiliastraWonderland | Business::HonkaiStarRail => {
        self.rank_type == 5
      }
      Business::ZenlessZoneZero => self.rank_type == 4,
    }
  }

  /// Convert `time` to [`PrimitiveDateTime`],
  /// this conversion loses the [`time::UtcOffset`]. Specific use!
  #[inline]
  pub const fn time_to_primitive(&self) -> PrimitiveDateTime {
    PrimitiveDateTime::new(self.time.date(), self.time.time())
  }
}
