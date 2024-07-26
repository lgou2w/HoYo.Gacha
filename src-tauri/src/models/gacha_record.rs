use std::hash::{Hash, Hasher};

use serde::{Deserialize, Serialize};

use super::Business;

// HACK: Known gacha record data structures.
//
//              | Genshin Impact               | Honkai: Star Rail       | Zenless Zone Zero            |
// |------------|------------------------------|-------------------------|------------------------------|
// | business   | 0                            | 1                       | 2                            |
// | uid        | 100_000_000                  | <-                      | 10_000_000                   |
// | id         | 1675850760000000000          | <-                      | <-                           |
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
  pub business: Business,
  pub uid: u32,
  // HACK: SQLite cannot store u64,
  //   and Id can only use String.
  pub id: String,
  pub gacha_type: u32,
  pub gacha_id: Option<u32>,
  pub rank_type: u32,
  pub count: u32,
  pub lang: String,
  pub time: String,
  pub name: String,
  pub item_type: String,
  pub item_id: String,
}

impl PartialEq for GachaRecord {
  fn eq(&self, other: &Self) -> bool {
    self.business == other.business && self.uid == other.uid && self.id == other.id
  }
}

impl PartialOrd for GachaRecord {
  fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
    Some(
      self
        .business
        .cmp(&other.business)
        .then(self.uid.cmp(&other.uid))
        .then(self.id.cmp(&other.id)),
    )
  }
}

impl Hash for GachaRecord {
  fn hash<H: Hasher>(&self, state: &mut H) {
    self.business.hash(state);
    self.uid.hash(state);
    self.id.hash(state);
  }
}
