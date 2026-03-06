use serde::{Deserialize, Serialize};
use sqlx::sqlite::SqliteRow;
use sqlx::{FromRow, Row};
use time::OffsetDateTime;
use time::serde::rfc3339;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct KeyValuePair {
  pub key: String,
  pub val: String,
  #[serde(with = "rfc3339")]
  pub updated_at: OffsetDateTime,
}

impl<'r> FromRow<'r, SqliteRow> for KeyValuePair {
  fn from_row(row: &'r SqliteRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      key: row.try_get("key")?,
      val: row.try_get("val")?,
      updated_at: row.try_get("updated_at")?,
    })
  }
}

impl_questioner_with_handlers! {
  #[key_value_pair_handlers]
  KeyValuePair of KeyValuePairQuestioner,

  #[database_find_kv_pair]
  "SELECT * FROM `HG_KVS` WHERE `key` = ?;"
    = find_kv_pair { key: &str }: fetch_optional -> Option<KeyValuePair>,

  #[database_create_kv_pair]
  "INSERT INTO `HG_KVS` (`key`, `val`) VALUES (?, ?) RETURNING *;"
    = create_kv_pair { key: &str, val: &str }: fetch_one -> KeyValuePair,

  #[database_update_kv_pair]
  "UPDATE `HG_KVS` SET `val` = ?, `updated_at` = ? WHERE `key` = ? RETURNING *;"
    = update_kv_pair {
        val: &str,
        updated_at: Option<OffsetDateTime>,
        key: &str
      }: fetch_optional -> Option<KeyValuePair>,

  #[database_upsert_kv_pair]
  "INSERT OR REPLACE INTO `HG_KVS` (`key`, `val`, `updated_at`) VALUES (?, ?, ?) RETURNING *;"
    = upsert_kv_pair {
        key: &str,
        val: &str,
        updated_at: Option<OffsetDateTime>
      }: fetch_one -> KeyValuePair,

  #[database_delete_kv_pair]
  "DELETE FROM `HG_KVS` WHERE `key` = ? RETURNING *;"
    = delete_kv_pair { key: &str }: fetch_optional -> Option<KeyValuePair>,
}
