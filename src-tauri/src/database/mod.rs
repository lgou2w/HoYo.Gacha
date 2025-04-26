use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;
use std::{env, fmt};

use async_trait::async_trait;
use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use sqlx::encode::IsNull;
use sqlx::error::BoxDynError;
use sqlx::query::{Query, QueryAs};
use sqlx::sqlite::{
  Sqlite, SqliteArguments, SqliteConnectOptions, SqlitePool, SqliteQueryResult, SqliteRow,
  SqliteTypeInfo, SqliteValueRef,
};
use sqlx::{Decode, Encode, Executor, FromRow, Row, Type};
use tauri::State as TauriState;
use time::OffsetDateTime;
use tokio::sync::mpsc;
use tracing::{Span, debug, info};

use crate::consts;
use crate::error::{Error, ErrorDetails};
use crate::models::{Account, AccountProperties, Business, GachaRecord, Kv};

mod kvs;

pub use kvs::*;

// Type

pub type SqlxError = Error<sqlx::Error>;

impl ErrorDetails for sqlx::Error {
  fn name(&self) -> &'static str {
    match self.as_database_error() {
      None => stringify!(SqlxError),
      Some(_) => stringify!(SqlxDatabaseError),
    }
  }

  fn details(&self) -> serde_json::Value {
    match self.as_database_error() {
      None => serde_json::Value::Null,
      Some(database) => serde_json::json!({
        "code": database.code(),
        "kind": format_args!("{:?}", database.kind()),
      }),
    }
  }
}

pub struct Database(SqlitePool);

impl AsRef<SqlitePool> for Database {
  fn as_ref(&self) -> &SqlitePool {
    &self.0
  }
}

impl Database {
  #[tracing::instrument(fields(filename))]
  pub async fn new() -> Self {
    // Database storage folder
    //   In debug mode  : is in the src-tauri folder
    //   In release mode: Current executable folder
    let filename = if cfg!(debug_assertions) {
      PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(consts::DATABASE)
    } else {
      env::current_exe()
        .expect("Failed to get current executable path")
        .parent()
        .unwrap()
        .join(consts::DATABASE)
    };

    Span::current().record("filename", filename.to_str());

    info!("Connecting to database...");
    let sqlite = SqlitePool::connect_with(
      SqliteConnectOptions::new()
        .filename(filename)
        .create_if_missing(true)
        .read_only(false)
        .immutable(false)
        .shared_cache(false),
    )
    .await
    .expect("Failed to connect database");

    let database = Self(sqlite);
    database
      .initialize()
      .await
      .expect("Failed to initialize database");

    database
  }

  #[tracing::instrument(skip(self))]
  pub async fn close(&self) {
    info!("Closing database...");
    self.0.close().await;
  }

  #[tracing::instrument(skip(self))]
  async fn initialize(&self) -> Result<(), sqlx::Error> {
    let version: u32 = self.0.fetch_one("PRAGMA USER_VERSION;").await?.get(0);
    let expected_version = SQLS.len();

    info!("Current database version: {version}, expected: {expected_version}");
    for sql in SQLS.iter().skip(version as _) {
      self.execute(sql).await?;
    }

    Ok(())
  }

  #[tracing::instrument(skip(self))]
  pub async fn execute(
    &self,
    query: impl AsRef<str> + fmt::Debug,
  ) -> Result<SqliteQueryResult, sqlx::Error> {
    let start = Instant::now();

    info!(message = "Executing database query");

    let ret = self.0.execute(query.as_ref()).await;

    debug!(
      message = "Database query executed",
      elapsed = ?start.elapsed(),
      ?ret,
    );

    ret
  }
}

pub type DatabaseState<'r> = TauriState<'r, Arc<Database>>;

#[tauri::command]
pub async fn database_execute(
  database: DatabaseState<'_>,
  query: String,
) -> Result<u64, SqlxError> {
  let ret = database.execute(query).await?;
  Ok(ret.rows_affected())
}

// region: SQL

const SQL_V1: &str = r"
BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS `HG_KVS` (
  `key`        TEXT NOT NULL PRIMARY KEY,
  `val`        TEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `HG_ACCOUNTS` (
  `business`    INTEGER NOT NULL,
  `uid`         INTEGER NOT NULL,
  `data_folder` TEXT    NOT NULL,
  `properties`  TEXT,
  PRIMARY KEY (`business`, `uid`)
);
CREATE INDEX IF NOT EXISTS `HG_ACCOUNTS.business_idx` ON `HG_ACCOUNTS` (`business`);
CREATE INDEX IF NOT EXISTS `HG_ACCOUNTS.uid_idx`      ON `HG_ACCOUNTS` (`uid`);

CREATE TABLE IF NOT EXISTS `HG_GACHA_RECORDS` (
  `business`   INTEGER NOT NULL,
  `uid`        INTEGER NOT NULL,
  `id`         TEXT    NOT NULL,
  `gacha_type` INTEGER NOT NULL,
  `gacha_id`   INTEGER,
  `rank_type`  INTEGER NOT NULL,
  `count`      INTEGER NOT NULL,
  `time`       TEXT    NOT NULL,
  `lang`       TEXT    NOT NULL,
  `name`       TEXT    NOT NULL,
  `item_type`  TEXT    NOT NULL,
  `item_id`    TEXT,
  PRIMARY KEY (`business`, `uid`, `id`)
);
CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.id_idx`                      ON `HG_GACHA_RECORDS` (`id`);
CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.gacha_type_idx`              ON `HG_GACHA_RECORDS` (`gacha_type`);
CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.rank_type_idx`               ON `HG_GACHA_RECORDS` (`rank_type`);
CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.business_uid_idx`            ON `HG_GACHA_RECORDS` (`business`, `uid`);
CREATE INDEX IF NOT EXISTS `HG_GACHA_RECORDS.business_uid_gacha_type_idx` ON `HG_GACHA_RECORDS` (`business`, `uid`, `gacha_type`);

PRAGMA USER_VERSION = 1;
COMMIT TRANSACTION;
";

const SQLS: &[&str] = &[SQL_V1];

// endregion

// region: Questioner

#[allow(unused)]
type SqliteQuery = Query<'static, Sqlite, SqliteArguments<'static>>;
type SqliteQueryAs<T> = QueryAs<'static, Sqlite, T, SqliteArguments<'static>>;

pub trait Questioner {
  type Entity: Clone + DeserializeOwned + for<'r> FromRow<'r, SqliteRow> + Serialize + Sized;
  const ENTITY_NAME: &'static str;
}

macro_rules! declare_questioner {
  (
    $entity:ident,
    $(
      $sql:literal = $name:ident {
        $($arg_n:ident: $arg_t:ty,)*
      }: $operation:ident -> $result:ty,
    )*
  ) => {
    paste::paste! {
      pub struct [<$entity Questioner>];

      impl crate::database::Questioner for [<$entity Questioner>] {
        type Entity = $entity;
        const ENTITY_NAME: &'static str = stringify!($entity);
      }

      impl [<$entity Questioner>] {
        $(
          fn [<sql_ $name>](
            $($arg_n: $arg_t),*
          ) -> crate::database::SqliteQueryAs<<Self as crate::database::Questioner>::Entity> {
            sqlx::query_as($sql)
              $(.bind($arg_n))*
          }

          #[tracing::instrument(
            skip(database),
            fields(
              name = stringify!($name),
              operation = stringify!($operation),
            )
          )]
          pub async fn $name(
            database: &crate::database::Database,
            $($arg_n: $arg_t),*
          ) -> Result<$result, crate::database::SqlxError> {
            let start = Instant::now();

            tracing::info!(
              message = "Executing database operation",
              $($arg_n = ?$arg_n),*
            );

            let ret = Self::[<sql_ $name>]($($arg_n),*)
              .$operation(database.as_ref())
              .await
              .map_err(Into::into);

            tracing::debug!(
              message = "Database operation executed",
              elapsed = ?start.elapsed(),
              ?ret,
            );

            ret
          }
        )*
      }
    }
  };
}

macro_rules! declare_questioner_with_handlers {
  (
    $entity:ident,
    $(
      $sql:literal = $name:ident {
        $($arg_n:ident: $arg_t:ty,)*
      }: $operation:ident -> $result:ty,
    )*
  ) => {
    declare_questioner! {
      $entity,
      $(
        $sql = $name {
          $($arg_n: $arg_t,)*
        }: $operation -> $result,
      )*
    }

    paste::paste! {
      pub mod [<$entity:snake:lower _questioner>] {
        use super::*;

        $(
          #[tauri::command]
          pub async fn [<database_ $name>](
            database: crate::database::DatabaseState<'_>,
            $($arg_n: $arg_t),*
          ) -> Result<$result, crate::database::SqlxError> {
            super::[<$entity Questioner>]::$name(&*database, $($arg_n),*).await
          }
        )*
      }
    }
  }
}

// endregion

// region: Kv

declare_questioner_with_handlers! {
  Kv,

  "SELECT * FROM `HG_KVS` WHERE `key` = ?;"
    = find_kv { key: String, }: fetch_optional -> Option<Kv>,

  "INSERT INTO `HG_KVS` (`key`, `val`) VALUES (?, ?) RETURNING *;"
    = create_kv { key: String, val: String, }: fetch_one -> Kv,

  "UPDATE `HG_KVS` SET `val` = ?, `updated_at` = ? WHERE `key` = ? RETURNING *;"
    = update_kv {
      val: String,
      updated_at: Option<OffsetDateTime>,
      key: String,
    }: fetch_optional -> Option<Kv>,

  "INSERT OR REPLACE INTO `HG_KVS` (`key`, `val`, `updated_at`) VALUES (?, ?, ?) RETURNING *;"
    = upsert_kv {
      key: String,
      val: String,
      updated_at: Option<OffsetDateTime>,
    }: fetch_one -> Kv,

  "DELETE FROM `HG_KVS` WHERE `key` = ? RETURNING *;"
    = delete_kv { key: String, }: fetch_optional -> Option<Kv>,
}

impl<'r> FromRow<'r, SqliteRow> for Kv {
  fn from_row(row: &'r SqliteRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      key: row.try_get("key")?,
      val: row.try_get("val")?,
      updated_at: row.try_get("updated_at")?,
    })
  }
}

// endregion

// region: Account Questioner

declare_questioner_with_handlers! {
  Account,

  "SELECT * FROM `HG_ACCOUNTS` WHERE `business` = ?;"
    = find_accounts_by_business {
        business: Business,
      }: fetch_all -> Vec<Account>,

  "SELECT * FROM `HG_ACCOUNTS` WHERE `business` = ? AND `uid` = ?;"
    = find_account_by_business_and_uid {
        business: Business,
        uid: u32,
      }: fetch_optional -> Option<Account>,

  "INSERT INTO `HG_ACCOUNTS` (`business`, `uid`, `data_folder`, `properties`) VALUES (?, ?, ?, ?) RETURNING *;"
    = create_account {
        business: Business,
        uid: u32,
        data_folder: String,
        properties: Option<AccountProperties>,
      }: fetch_one -> Account,

  "UPDATE `HG_ACCOUNTS` SET `data_folder` = ? WHERE `business` = ? AND `uid` = ? RETURNING *;"
    = update_account_data_folder_by_business_and_uid {
        data_folder: String,
        business: Business,
        uid: u32,
      }: fetch_optional -> Option<Account>,

  "UPDATE `HG_ACCOUNTS` SET `properties` = ? WHERE `business` = ? AND `uid` = ? RETURNING *;"
    = update_account_properties_by_business_and_uid {
        properties: Option<AccountProperties>,
        business: Business,
        uid: u32,
      }: fetch_optional -> Option<Account>,

  "DELETE FROM `HG_ACCOUNTS` WHERE `business` = ? AND `uid` = ? RETURNING *;"
    = delete_account_by_business_and_uid {
        business: Business,
        uid: u32,
      }: fetch_optional -> Option<Account>,
}

impl<'r> FromRow<'r, SqliteRow> for Account {
  fn from_row(row: &'r SqliteRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      business: row.try_get("business")?,
      uid: row.try_get("uid")?,
      data_folder: row.try_get("data_folder")?,
      properties: row.try_get("properties")?,
    })
  }
}

impl Type<Sqlite> for Business {
  fn type_info() -> SqliteTypeInfo {
    u8::type_info()
  }

  fn compatible(ty: &SqliteTypeInfo) -> bool {
    u8::compatible(ty)
  }
}

impl<'r> Encode<'r, Sqlite> for Business {
  fn encode_by_ref(
    &self,
    buf: &mut <Sqlite as sqlx::Database>::ArgumentBuffer<'r>,
  ) -> Result<IsNull, BoxDynError> {
    u8::from(*self).encode_by_ref(buf)
  }
}

impl Decode<'_, Sqlite> for Business {
  fn decode(value: SqliteValueRef) -> Result<Self, BoxDynError> {
    Business::try_from(u8::decode(value)?).map_err(Into::into)
  }
}

impl Type<Sqlite> for AccountProperties {
  fn type_info() -> SqliteTypeInfo {
    String::type_info()
  }

  fn compatible(ty: &SqliteTypeInfo) -> bool {
    String::compatible(ty)
  }
}

impl<'r> Encode<'r, Sqlite> for AccountProperties {
  fn encode_by_ref(
    &self,
    buf: &mut <Sqlite as sqlx::Database>::ArgumentBuffer<'r>,
  ) -> Result<IsNull, BoxDynError> {
    serde_json::to_string(self)
      .map_err(|e| format!("Failed when serializing account properties: {e}"))?
      .encode_by_ref(buf)
  }
}

impl Decode<'_, Sqlite> for AccountProperties {
  fn decode(value: SqliteValueRef) -> Result<Self, BoxDynError> {
    serde_json::from_str(&String::decode(value)?)
      .map_err(|e| format!("Failed when deserializing account properties: {e}").into())
  }
}

// endregion

// region: GachaRecord Questioner

declare_questioner_with_handlers! {
  GachaRecord,

  "SELECT * FROM `HG_GACHA_RECORDS` WHERE `uid` = ? ORDER BY `id` ASC;"
    = find_gacha_records_by_uid {
        uid: u32,
      }: fetch_all -> Vec<GachaRecord>,

  "SELECT * FROM `HG_GACHA_RECORDS` WHERE `business` = ? AND `uid` = ? ORDER BY `id` ASC;"
    = find_gacha_records_by_business_and_uid {
        business: Business,
        uid: u32,
      }: fetch_all -> Vec<GachaRecord>,

  "SELECT * FROM `HG_GACHA_RECORDS` WHERE `business` = ? AND `uid` = ? AND `gacha_type` = ? ORDER BY `id` ASC;"
    = find_gacha_records_by_business_and_uid_with_gacha_type {
        business: Business,
        uid: u32,
        gacha_type: u32,
      }: fetch_all -> Vec<GachaRecord>,
}

impl<'r> FromRow<'r, SqliteRow> for GachaRecord {
  fn from_row(row: &'r SqliteRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      business: row.try_get("business")?,
      uid: row.try_get("uid")?,
      id: row.try_get("id")?,
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

#[derive(Copy, Clone, Debug, Deserialize)]
pub enum GachaRecordSaveOnConflict {
  Nothing,
  Update,
}

impl GachaRecordSaveOnConflict {
  fn sql(&self) -> &'static str {
    match *self {
      Self::Nothing => {
        "INSERT INTO `HG_GACHA_RECORDS` (
          `business`, `uid`, `id`, `gacha_type`, `gacha_id`, `rank_type`,
          `count`, `time`, `lang`, `name`, `item_type`, `item_id`
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        ) ON CONFLICT (`business`, `uid`, `id`) DO NOTHING;"
      }
      Self::Update => {
        "INSERT INTO `HG_GACHA_RECORDS` (
          `business`, `uid`, `id`, `gacha_type`, `gacha_id`, `rank_type`,
          `count`, `time`, `lang`, `name`, `item_type`, `item_id`
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        ) ON CONFLICT (`business`, `uid`, `id`) DO UPDATE SET
          `gacha_type` = `excluded.gacha_type`,
          `gacha_id`   = `excluded.gacha_id`,
          `rank_type`  = `excluded.rank_type`,
          `count`      = `excluded.count`,
          `time`       = `excluded.time`,
          `lang`       = `excluded.lang`,
          `item_type`  = `excluded.item_type`,
          `item_id`    = `excluded.item_id`;"
      }
    }
  }
}

#[async_trait]
pub trait GachaRecordQuestionerAdditions {
  #[tracing::instrument(skip(database, records, progress_reporter), fields(records = records.len()))]
  async fn create_gacha_records(
    database: &Database,
    records: Vec<GachaRecord>,
    save_on_conflict: GachaRecordSaveOnConflict,
    progress_reporter: Option<mpsc::Sender<f32>>,
  ) -> Result<u64, SqlxError> {
    info!("Executing create gacha records database operation...");
    let total = records.len();
    let start = Instant::now();
    let sql = save_on_conflict.sql();

    let mut txn = database.as_ref().begin().await?;
    let mut changes = 0;
    let mut completes = 0;
    let mut last_progress_reported = Instant::now();

    for record in records {
      completes += 1;
      changes += sqlx::query(sql)
        .bind(record.business)
        .bind(record.uid)
        .bind(record.id)
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

      // Progress reporting: 200ms interval
      // Avoiding excessive recording leading to frequent reporting
      if let Some(reporter) = &progress_reporter {
        if last_progress_reported.elapsed().as_millis() > 200 {
          last_progress_reported = Instant::now();

          let progress = completes as f32 / total as f32;
          let progress = (progress * 100.).round() / 100.;
          if progress > 0. {
            let _ = reporter.try_send(progress);
          }
        }
      }
    }
    txn.commit().await?;

    // Avoiding incomplete progress due to reporting intervals
    let _ = progress_reporter.map(|reporter| reporter.try_send(1.0));

    info!(
      message = "Creation of gacha records completed",
      changes = ?changes,
      elapsed = ?start.elapsed()
    );

    Ok(changes)
  }

  #[tracing::instrument(skip(database))]
  async fn delete_gacha_records_by_business_and_uid(
    database: &Database,
    business: Business,
    uid: u32,
  ) -> Result<u64, SqlxError> {
    info!("Executing delete gacha records database operation...");
    let start = Instant::now();
    let changes = sqlx::query("DELETE FROM `HG_GACHA_RECORDS` WHERE `business` = ? AND `uid` = ?;")
      .bind(business)
      .bind(uid)
      .execute(database.as_ref())
      .await?
      .rows_affected();

    info!(
      message = "Deletion of gacha records completed",
      changes = ?changes,
      elapsed = ?start.elapsed(),
    );

    Ok(changes)
  }

  #[tracing::instrument(skip(database))]
  async fn delete_gacha_records_by_newer_than_end_id(
    database: &Database,
    business: Business,
    uid: u32,
    gacha_type: u32,
    end_id: &str,
  ) -> Result<u64, SqlxError> {
    info!("Executing delete gacha records by newer than end_id database operation...");
    let start = Instant::now();
    let changes = sqlx::query("DELETE FROM `HG_GACHA_RECORDS` WHERE `business` = ? AND `uid` = ? AND `gacha_type` = ? AND `id` >= ?;")
      .bind(business)
      .bind(uid)
      .bind(gacha_type)
      .bind(end_id)
      .execute(database.as_ref())
      .await?
      .rows_affected();

    info!(
      message = "Deletion of gacha records by newer than end_id completed",
      changes = ?changes,
      elapsed = ?start.elapsed(),
    );

    Ok(changes)
  }

  #[tracing::instrument(skip(database))]
  async fn find_gacha_records_by_businesses_and_uid(
    database: &Database,
    businesses: &HashSet<Business>,
    uid: u32,
  ) -> Result<Vec<GachaRecord>, SqlxError> {
    info!("Executing find gacha records by businesses and uid database operation...");
    let start = Instant::now();
    let records = sqlx::query_as(
      "SELECT * FROM `HG_GACHA_RECORDS` WHERE `business` IN (?) AND `uid` = ? ORDER BY `id` ASC;",
    )
    .bind(
      businesses
        .iter()
        .map(|b| (*b as u8).to_string())
        .collect::<Vec<_>>()
        .join(","),
    )
    .bind(uid)
    .fetch_all(database.as_ref())
    .await?;

    info!(
      message = "Finding of gacha records completed",
      records = ?records.len(),
      elapsed = ?start.elapsed(),
    );

    Ok(records)
  }

  #[tracing::instrument(skip(database))]
  async fn find_gacha_records_by_businesses_or_uid(
    database: &Database,
    businesses: Option<&HashSet<Business>>,
    uid: u32,
  ) -> Result<Vec<GachaRecord>, SqlxError> {
    if let Some(businesses) = businesses {
      Self::find_gacha_records_by_businesses_and_uid(database, businesses, uid).await
    } else {
      GachaRecordQuestioner::find_gacha_records_by_uid(database, uid).await
    }
  }
}

impl GachaRecordQuestionerAdditions for GachaRecordQuestioner {}

pub mod gacha_record_questioner_additions {
  use super::*;

  #[tauri::command]
  pub async fn database_create_gacha_records(
    database: DatabaseState<'_>,
    records: Vec<GachaRecord>,
    on_conflict: GachaRecordSaveOnConflict,
  ) -> Result<u64, SqlxError> {
    GachaRecordQuestioner::create_gacha_records(database.as_ref(), records, on_conflict, None).await
  }

  #[tauri::command]
  pub async fn database_delete_gacha_records_by_business_and_uid(
    database: DatabaseState<'_>,
    business: Business,
    uid: u32,
  ) -> Result<u64, SqlxError> {
    GachaRecordQuestioner::delete_gacha_records_by_business_and_uid(
      database.as_ref(),
      business,
      uid,
    )
    .await
  }

  #[tauri::command]
  pub async fn database_find_gacha_records_by_businesses_and_uid(
    database: DatabaseState<'_>,
    businesses: HashSet<Business>,
    uid: u32,
  ) -> Result<Vec<GachaRecord>, SqlxError> {
    GachaRecordQuestioner::find_gacha_records_by_businesses_and_uid(
      database.as_ref(),
      &businesses,
      uid,
    )
    .await
  }

  #[tauri::command]
  pub async fn database_find_gacha_records_by_businesses_or_uid(
    database: DatabaseState<'_>,
    businesses: Option<HashSet<Business>>,
    uid: u32,
  ) -> Result<Vec<GachaRecord>, SqlxError> {
    GachaRecordQuestioner::find_gacha_records_by_businesses_or_uid(
      database.as_ref(),
      businesses.as_ref(),
      uid,
    )
    .await
  }
}

// endregion

#[cfg(test)]
mod tests {
  use super::*;
  use crate::error::SERIALIZATION_MARKER;

  #[test]
  fn test_error_serialize() {
    let error = SqlxError::from(sqlx::Error::ColumnNotFound("column".into()));

    assert_eq!(format!("{error:?}"), "Error(ColumnNotFound(\"column\"))");
    assert_eq!(
      serde_json::to_string(&error).unwrap(),
      format!(
        r#"{{"name":"{name}","message":"{error}","details":null,"{SERIALIZATION_MARKER}":true}}"#,
        name = error.as_ref().name()
      )
    );
  }
}
