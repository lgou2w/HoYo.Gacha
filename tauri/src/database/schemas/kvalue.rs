use rusqlite::Row;
use serde::{Deserialize, Serialize};
use time::OffsetDateTime;
use time::serde::rfc3339;

use crate::database::impl_questioner_with_handlers;

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct KValue {
  pub key: String,
  pub val: String,
  #[serde(with = "rfc3339")]
  pub updated_at: OffsetDateTime,
}

// FromRow

impl TryFrom<&Row<'_>> for KValue {
  type Error = rusqlite::Error;

  fn try_from(row: &rusqlite::Row) -> Result<Self, Self::Error> {
    Ok(Self {
      key: row.get("key")?,
      val: row.get("val")?,
      updated_at: row.get("updated_at")?,
    })
  }
}

impl_questioner_with_handlers! {
  #[kvalue_handlers]
  KValue of KValueQuestioner,

  #[database_find_kvalue]
  "SELECT * FROM `HG_KVS` WHERE `key` = ?1;"
    = find_kvalue { key: String }: fetch_optional -> Option<KValue>,

  #[database_create_kvalue]
  "INSERT INTO `HG_KVS` (`key`, `val`) VALUES (?1, ?2) RETURNING *;"
    = create_kvalue { key: String, val: String }: fetch_one -> KValue,

  #[database_update_kvalue]
  "UPDATE `HG_KVS` SET `val` = ?2, `updated_at` = ?3 WHERE `key` = ?1 RETURNING *;"
    = update_kvalue {
        key: String,
        val: String,
        updated_at: Option<OffsetDateTime>
      }: fetch_optional -> Option<KValue>,

  #[database_upsert_kvalue]
  "INSERT OR REPLACE INTO `HG_KVS` (`key`, `val`, `updated_at`) VALUES (?1, ?2, ?3) RETURNING *;"
    = upsert_kvalue {
        key: String,
        val: String,
        updated_at: Option<OffsetDateTime>
      }: fetch_one -> KValue,

  #[database_delete_kvalue]
  "DELETE FROM `HG_KVS` WHERE `key` = ?1 RETURNING *;"
    = delete_kvalue { key: String }: fetch_optional -> Option<KValue>,
}
