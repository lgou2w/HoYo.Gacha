use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use time::serde::rfc3339;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Kv {
  pub key: String,
  pub val: String,
  #[serde(with = "rfc3339")]
  pub updated_at: OffsetDateTime,
}
