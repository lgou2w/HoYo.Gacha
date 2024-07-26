use std::hash::{Hash, Hasher};

use serde::{Deserialize, Serialize};
use time::serde::rfc3339;
use time::OffsetDateTime;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Kv {
  pub key: String,
  pub val: String,
  #[serde(with = "rfc3339")]
  pub updated_at: OffsetDateTime,
}

impl PartialEq for Kv {
  fn eq(&self, other: &Self) -> bool {
    self.key == other.key
  }
}

impl PartialOrd for Kv {
  fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
    self.key.partial_cmp(&other.key)
  }
}

impl Hash for Kv {
  fn hash<H: Hasher>(&self, state: &mut H) {
    self.key.hash(state);
  }
}
