use serde::{Deserialize, Serialize};
use time::serde::rfc3339;
use time::OffsetDateTime;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Kv {
  pub key: String,
  pub val: String,
  #[serde(with = "rfc3339")]
  pub updated_at: OffsetDateTime,
}
