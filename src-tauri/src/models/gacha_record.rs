use num_enum::{IntoPrimitive, TryFromPrimitive};
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};

use super::{AccountBusiness, AccountIdentifier};

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
//              | Genshin Impact                    | Honkai: Star Rail                     |
// |------------|-----------------------------------|---------------------------------------|
// | id         | 1675850760000000000               | <-                                    |
// | business   | 0                                 | 1                                     |
// | uid        | 100000001                         | <-                                    |
// | gacha_type | 100, 200, 301, 400, 302, 500      | 1, 2, 11, 12                          |
// | gacha_id   | Null                              | Some                                  |
// | rank_type  | 3, 4, 5                           | <-                                    |
// | count      | 1                                 | <-                                    |
// | lang       | zh-cn, en-us                      | <-                                    |
// | time       | 2023-01-01 00:00:00               | <-                                    |
// | name       | Some                              | <-                                    |
// | item_type  | [角色 | 武器], [Character, Weapon] | [角色 | 光锥], [Character, Light Cone] |
// | item_id    | Empty                             | Some                                  |
// |------------|------------------------------     |---------------------------------------|
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
  pub id: String,                 // 1675850760000000000          | <-
  pub business: AccountBusiness,  //                            0 | 1
  pub uid: AccountIdentifier,     // 100000001                    | <-
  pub gacha_type: u32,            // 100, 200, 301, 400, 302, 500 | 1, 2, 11, 12
  pub gacha_id: Option<u32>,      //                         None | Some(_)
  pub rank_type: GachaRecordRank, // 3, 4, 5                      | <-
  pub count: u32,                 // 1                            | <-
  pub lang: String,               // zh-cn
  pub time: String,               // 2023-01-01 00:00:00
  pub name: String,               // TODO: Internationalization
  pub item_type: String,          // TODO: Internationalization
  pub item_id: String,
}
