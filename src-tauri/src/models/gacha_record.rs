use num_enum::{IntoPrimitive, TryFromPrimitive};
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};

use super::{AccountIdentifier, Business};

/// Rank of Gacha Record

#[derive(
  Clone,
  Debug,
  Deserialize_repr,
  Serialize_repr,
  IntoPrimitive,
  TryFromPrimitive,
  PartialEq,
  Eq,
  PartialOrd,
  Ord,
  Hash,
)]
#[repr(u8)]
pub enum GachaRecordRank {
  Blue = 3,
  Purple = 4,
  Orange = 5,
}

// HACK: Known gacha record data structures.
//
//              | Genshin Impact               | Honkai: Star Rail       | Zenless Zone Zero            |
// |------------|------------------------------|-------------------------|------------------------------|
// | id         | 1675850760000000000          | <-                      | <-                           |
// | business   | 0                            | 1                       | 2                            |
// | uid        | 100_000_000                  | <-                      | 10_000_000                   |
// | gacha_type | 100, 200, 301, 400, 302, 500 | 1, 2, 11, 12            | 1, 2, 3, 5                   |
// | gacha_id   | Null                         | Some                    | Some                         |
// | rank_type  | 3, 4, 5                      | <-                      | 2, 3, 4                      |
// | count      | 1                            | <-                      | <-                           |
// | lang       | en-us                        | <-                      | <-                           |
// | time       | 2023-01-01 00:00:00          | <-                      | <-                           |
// | name       | Some                         | <-                      | <-                           |
// | item_type  | [Character, Weapon]          | [Character, Light Cone] | [Agents, W-Engines, Bangboo] |
// | item_id    | Empty                        | Some                    | Some                         |
// |------------|------------------------------|-------------------------|------------------------------|
//
// Note:
//   `<-`    : Same as the left side.
//   `Null`  : This field does not exist.
//   `Some`  : Have values and are different.
//   `Empty` : Is the empty string.
//

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GachaRecord {
  // HACK: SQLite cannot store u64,
  //   and Id can only use String.
  pub id: String,
  pub business: Business,
  pub uid: AccountIdentifier,
  pub gacha_type: u32,
  pub gacha_id: Option<u32>,
  pub rank_type: GachaRecordRank,
  pub count: u32,
  pub lang: String,
  pub time: String,
  pub name: String,
  pub item_type: String,
  pub item_id: String,
}
