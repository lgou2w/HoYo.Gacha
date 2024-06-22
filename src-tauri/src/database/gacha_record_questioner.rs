use std::future::Future;

use sqlx::database::HasArguments;
use sqlx::encode::IsNull;
use sqlx::error::BoxDynError;
use sqlx::sqlite::{SqliteRow, SqliteTypeInfo, SqliteValueRef};
use sqlx::{Decode, Encode, FromRow, Row, Sqlite, SqlitePool, Type};

use super::macros::declare_entity_with_handlers;
use super::DatabaseError;
use crate::models::{AccountBusiness, AccountIdentifier, GachaRecord, GachaRecordRank};

declare_entity_with_handlers! {
  GachaRecord,

  "
  CREATE TABLE IF NOT EXISTS `hg.gacha_records` (
    `id`         TEXT    NOT NULL,
    `business`   INTEGER NOT NULL,
    `uid`        INTEGER NOT NULL,
    `gacha_type` INTEGER NOT NULL,
    `gacha_id`   INTEGER,
    `rank_type`  INTEGER NOT NULL,
    `count`      INTEGER NOT NULL,
    `time`       TEXT    NOT NULL,
    `lang`       TEXT    NOT NULL,
    `name`       TEXT    NOT NULL,
    `item_type`  TEXT    NOT NULL,
    `item_id`    TEXT    NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS `hg.gacha_records.id_idx`                      ON `hg.gacha_records` (`id`);
  CREATE        INDEX IF NOT EXISTS `hg.gacha_records.business_idx`                ON `hg.gacha_records` (`business`);
  CREATE        INDEX IF NOT EXISTS `hg.gacha_records.uid_idx`                     ON `hg.gacha_records` (`uid`);
  CREATE        INDEX IF NOT EXISTS `hg.gacha_records.item_id_idx`                 ON `hg.gacha_records` (`item_id`);
  CREATE        INDEX IF NOT EXISTS `hg.gacha_records.business_uid_idx`            ON `hg.gacha_records` (`business`, `uid`);
  CREATE        INDEX IF NOT EXISTS `hg.gacha_records.gacha_type_idx`              ON `hg.gacha_records` (`gacha_type`);
  CREATE        INDEX IF NOT EXISTS `hg.gacha_records.rank_type_idx`               ON `hg.gacha_records` (`rank_type`);
  CREATE        INDEX IF NOT EXISTS `hg.gacha_records.business_uid_gacha_type_idx` ON `hg.gacha_records` (`business`, `uid`, `gacha_type`);
  ",

  "SELECT * FROM `hg.gacha_records` WHERE `business` = ? AND `uid` = ?;"
    = find_gacha_records_by_business_and_uid {
        business: AccountBusiness,
        uid: AccountIdentifier
      } and fetch_all -> Vec<GachaRecord>,

  "SELECT * FROM `hg.gacha_records` WHERE `business` = ? AND `uid` = ? AND `gacha_type` = ?;"
    = find_gacha_records_by_business_and_uid_with_gacha_type {
        business: AccountBusiness,
        uid: AccountIdentifier,
        gacha_type: u32
      } and fetch_all -> Vec<GachaRecord>,
}

// Additions

pub trait GachaRecordQuestionerAdditions {
  fn create_gacha_records(
    executor: impl AsRef<SqlitePool>,
    records: Vec<GachaRecord>,
  ) -> impl Future<Output = Result<u64, DatabaseError>> {
    async move {
      let mut txn = executor.as_ref().begin().await?;
      let mut changes = 0;
      for record in records {
        changes += sqlx::query(
          "INSERT INTO `hg.gacha_records` (
          `id`, `business`, `uid`, `gacha_type`, `gacha_id`, `rank_type`,
          `count`, `time`, `lang`, `name`, `item_type`, `item_id`
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        ) ON CONFLICT (`id`) DO NOTHING;",
        )
        .bind(record.id)
        .bind(record.business)
        .bind(record.uid)
        .bind(record.gacha_type)
        .bind(record.gacha_id)
        .bind(record.rank_type)
        .bind(record.count)
        .bind(record.time)
        .bind(record.lang)
        .bind(record.name)
        .bind(record.item_type)
        .bind(record.item_id)
        .execute(&mut *txn)
        .await?
        .rows_affected();
      }
      txn.commit().await?;

      Ok(changes)
    }
  }
}

impl GachaRecordQuestionerAdditions for GachaRecordQuestioner {}

// Sqlx de, ser

impl<'r> FromRow<'r, SqliteRow> for GachaRecord {
  fn from_row(row: &'r SqliteRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      id: row.try_get("id")?,
      business: row.try_get("business")?,
      uid: row.try_get("uid")?,
      gacha_type: row.try_get("gacha_type")?,
      gacha_id: row.try_get("gacha_id")?,
      rank_type: row.try_get("rank_type")?,
      count: row.try_get("count")?,
      lang: row.try_get("lang")?,
      time: row.try_get("time")?,
      name: row.try_get("name")?,
      item_type: row.try_get("item_type")?,
      item_id: row.try_get("item_id")?,
    })
  }
}

// Rank of Gacha Record

impl Type<Sqlite> for GachaRecordRank {
  fn type_info() -> SqliteTypeInfo {
    u8::type_info()
  }

  fn compatible(ty: &SqliteTypeInfo) -> bool {
    u8::compatible(ty)
  }
}

impl<'r> Encode<'r, Sqlite> for GachaRecordRank {
  fn encode_by_ref(&self, buf: &mut <Sqlite as HasArguments<'r>>::ArgumentBuffer) -> IsNull {
    u8::from(self.clone()).encode_by_ref(buf)
  }
}

impl<'r> Decode<'r, Sqlite> for GachaRecordRank {
  fn decode(value: SqliteValueRef) -> Result<Self, BoxDynError> {
    GachaRecordRank::try_from(u8::decode(value)?).map_err(Into::into)
  }
}
