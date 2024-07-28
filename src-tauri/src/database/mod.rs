use std::env;
use std::future::Future;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::Arc;

use serde::de::DeserializeOwned;
use serde::{Deserialize, Serialize};
use sqlx::encode::IsNull;
use sqlx::error::BoxDynError;
use sqlx::query::{Query, QueryAs};
use sqlx::sqlite::{
  Sqlite, SqliteArguments, SqliteConnectOptions, SqlitePool, SqliteRow, SqliteTypeInfo,
  SqliteValueRef,
};
use sqlx::{Decode, Encode, Executor, FromRow, Row, Type};
use tauri::State as TauriState;
use time::OffsetDateTime;
use tracing::{info, Span};

use crate::consts;
use crate::error::{Error, ErrorDetails};
use crate::models::{Account, AccountProperties, Business, GachaRecord, Kv};

// Type

pub type SqlxError = Error<sqlx::Error>;

impl ErrorDetails for sqlx::Error {
  fn name(&self) -> &'static str {
    match self.as_database_error() {
      None => stringify!(SqlxError),
      Some(_) => stringify!(SqlxDatabaseError),
    }
  }

  fn details(&self) -> impl serde::Serialize {
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
    // Database storage directory
    //   In debug mode  : is in the src-tauri directory
    //   In release mode:
    //     Windows -> %APPDATA%\\Local\\{ID}
    //     MacOS   -> %HOME%/Library/Caches/{ID}
    let filename = if cfg!(debug_assertions) {
      PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(consts::DATABASE)
    } else {
      consts::PLATFORM
        .appdata_local
        .join(consts::ID)
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
  pub async fn close(self) {
    info!("Closing database...");
    self.0.close().await;
  }

  #[tracing::instrument(skip(self))]
  async fn initialize(&self) -> Result<(), sqlx::Error> {
    let version: u32 = self.0.fetch_one("PRAGMA USER_VERSION;").await?.get(0);
    let expected_version = SQLS.len();

    info!("Current database version: {version}, expected: {expected_version}");
    for sql in SQLS.iter().skip(version as _) {
      self.0.execute(*sql).await?;
    }

    Ok(())
  }
}

pub type DatabaseState<'r> = TauriState<'r, Arc<Database>>;

// region: SQL

const SQL_V1: &str = r"
BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS `hg.kvs` (
  `key`        TEXT NOT NULL PRIMARY KEY,
  `val`        TEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `hg.accounts` (
  `business`   INTEGER NOT NULL,
  `uid`        INTEGER NOT NULL,
  `data_dir`   TEXT    NOT NULL,
  `gacha_url`  TEXT,
  `properties` TEXT,
  PRIMARY KEY (`business`, `uid`)
);
CREATE INDEX IF NOT EXISTS `hg.accounts.business_idx`     ON `hg.accounts` (`business`);
CREATE INDEX IF NOT EXISTS `hg.accounts.uid_idx`          ON `hg.accounts` (`uid`);

CREATE TABLE IF NOT EXISTS `hg.gacha_records` (
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
  `item_id`    TEXT    NOT NULL,
  PRIMARY KEY (`business`, `uid`, `id`)
);
CREATE INDEX IF NOT EXISTS `hg.gacha_records.id_idx`                      ON `hg.gacha_records` (`id`);
CREATE INDEX IF NOT EXISTS `hg.gacha_records.gacha_type_idx`              ON `hg.gacha_records` (`gacha_type`);
CREATE INDEX IF NOT EXISTS `hg.gacha_records.rank_type_idx`               ON `hg.gacha_records` (`rank_type`);
CREATE INDEX IF NOT EXISTS `hg.gacha_records.business_uid_idx`            ON `hg.gacha_records` (`business`, `uid`);
CREATE INDEX IF NOT EXISTS `hg.gacha_records.business_uid_gacha_type_idx` ON `hg.gacha_records` (`business`, `uid`, `gacha_type`);

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

          #[tracing::instrument(skip(database))]
          pub async fn $name(
            database: &crate::database::Database,
            $($arg_n: $arg_t),*
          ) -> Result<$result, crate::database::SqlxError> {
            Self::[<sql_ $name>]($($arg_n),*)
              .$operation(database.as_ref())
              .await
              .map_err(Into::into)
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

  "SELECT * FROM `hg.kvs` WHERE `key` = ?;"
    = find_kv { key: String, }: fetch_optional -> Option<Kv>,

  "INSERT INTO `hg.kvs` (`key`, `val`) VALUES (?, ?) RETURNING *;"
    = create_kv { key: String, val: String, }: fetch_one -> Kv,

  "UPDATE `hg.kvs` SET `val` = ?, `updated_at` = ? WHERE `key` = ? RETURNING *;"
    = update_kv {
      val: String,
      updated_at: Option<OffsetDateTime>,
      key: String,
    }: fetch_optional -> Option<Kv>,

  "INSERT OR REPLACE INTO `hg.kvs` (`key`, `val`, `updated_at`) VALUES (?, ?, ?) RETURNING *;"
    = upsert_kv {
      key: String,
      val: String,
      updated_at: Option<OffsetDateTime>,
    }: fetch_one -> Kv,

  "DELETE FROM `hg.kvs` WHERE `key` = ? RETURNING *;"
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

pub struct KvMut<'a, 'key> {
  pub database: &'a Database,
  pub key: &'key str,
}

impl<'a, 'key> KvMut<'a, 'key> {
  pub fn from(database: &'a Database, key: &'key str) -> Self {
    Self { database, key }
  }

  #[inline]
  pub async fn read(&self) -> Result<Option<Kv>, SqlxError> {
    KvQuestioner::find_kv(self.database, self.key.into()).await
  }

  #[inline]
  pub async fn write(&self, new_val: impl Into<String>) -> Result<Option<Kv>, SqlxError> {
    KvQuestioner::update_kv(
      self.database,
      new_val.into(),
      Some(OffsetDateTime::now_utc()),
      self.key.into(),
    )
    .await
  }

  #[inline]
  pub async fn remove(&self) -> Result<Option<Kv>, SqlxError> {
    KvQuestioner::delete_kv(self.database, self.key.into()).await
  }

  // Read ext

  #[inline]
  pub async fn read_val(&self) -> Result<Option<String>, SqlxError> {
    Ok(self.read().await?.map(|kv| kv.val))
  }

  #[inline]
  pub async fn read_val_parse<R>(&self) -> Result<Option<Result<R, R::Err>>, SqlxError>
  where
    R: FromStr,
  {
    Ok(self.read_val().await?.map(|val| R::from_str(&val)))
  }

  #[inline]
  pub async fn read_val_into<R>(&self) -> Result<Option<Result<R, R::Error>>, SqlxError>
  where
    R: TryFrom<String>,
  {
    Ok(self.read_val().await?.map(R::try_from))
  }

  #[inline]
  pub async fn read_val_into_json<R>(
    &self,
  ) -> Result<Option<Result<R, serde_json::Error>>, SqlxError>
  where
    R: DeserializeOwned,
  {
    Ok(self.read_val().await?.map(|val| serde_json::from_str(&val)))
  }
}

// endregion

// region: Account Questioner

declare_questioner_with_handlers! {
  Account,

  "SELECT * FROM `hg.accounts` WHERE `business` = ?;"
    = find_accounts_by_business {
        business: Business,
      }: fetch_all -> Vec<Account>,

  "SELECT * FROM `hg.accounts` WHERE `business` = ? AND `uid` = ?;"
    = find_account_by_business_and_uid {
        business: Business,
        uid: u32,
      }: fetch_optional -> Option<Account>,

  "INSERT INTO `hg.accounts` (`business`, `uid`, `data_dir`, `properties`) VALUES (?, ?, ?, ?) RETURNING *;"
    = create_account {
        business: Business,
        uid: u32,
        data_dir: String,
        properties: Option<AccountProperties>,
      }: fetch_one -> Account,

  "UPDATE `hg.accounts` SET `data_dir` = ? WHERE `business` = ? AND `uid` = ? RETURNING *;"
    = update_account_data_dir_by_business_and_uid {
        data_dir: String,
        business: Business,
        uid: u32,
      }: fetch_optional -> Option<Account>,

  "UPDATE `hg.accounts` SET `gacha_url` = ? WHERE `business` = ? AND `uid` = ? RETURNING *;"
    = update_account_gacha_url_by_business_and_uid {
        gacha_url: Option<String>,
        business: Business,
        uid: u32,
      }: fetch_optional -> Option<Account>,

  "UPDATE `hg.accounts` SET `properties` = ? WHERE `business` = ? AND `uid` = ? RETURNING *;"
    = update_account_properties_by_business_and_uid {
        properties: Option<AccountProperties>,
        uid: u32,
      }: fetch_optional -> Option<Account>,

  "DELETE FROM `hg.accounts` WHERE `business` = ? AND `uid` = ? RETURNING *;"
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
      data_dir: row.try_get("data_dir")?,
      gacha_url: row.try_get("gacha_url")?,
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

impl<'r> Decode<'r, Sqlite> for Business {
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

impl<'r> Decode<'r, Sqlite> for AccountProperties {
  fn decode(value: SqliteValueRef) -> Result<Self, BoxDynError> {
    serde_json::from_str(&String::decode(value)?)
      .map_err(|e| format!("Failed when deserializing account properties: {e}").into())
  }
}

// endregion

// region: GachaRecord Questioner

declare_questioner_with_handlers! {
  GachaRecord,

  "SELECT * FROM `hg.gacha_records` WHERE `business` = ? AND `uid` = ?;"
    = find_gacha_records_by_business_and_uid {
        business: Business,
        uid: u32,
      }: fetch_all -> Vec<GachaRecord>,

  "SELECT * FROM `hg.gacha_records` WHERE `business` = ? AND `uid` = ? AND `gacha_type` = ?;"
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

#[derive(Debug, Deserialize)]
pub enum GachaRecordOnConflict {
  Nothing,
  Update,
}

impl GachaRecordOnConflict {
  fn sql(&self) -> &'static str {
    match *self {
      Self::Nothing => {
        "INSERT INTO `hg.gacha_records` (
          `business`, `uid`, `id`, `gacha_type`, `gacha_id`, `rank_type`,
          `count`, `time`, `lang`, `name`, `item_type`, `item_id`
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        ) ON CONFLICT (`business`, `uid`, `id`) DO NOTHING;"
      }
      Self::Update => {
        "INSERT INTO `hg.gacha_records` (
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

pub trait GachaRecordQuestionerAdditions {
  #[tracing::instrument(skip(database, records), fields(records = records.len()))]
  fn create_gacha_records(
    database: &Database,
    records: Vec<GachaRecord>,
    on_conflict: GachaRecordOnConflict,
  ) -> impl Future<Output = Result<u64, SqlxError>> {
    async move {
      let mut txn = database.as_ref().begin().await?;
      let mut changes = 0;
      let sql = on_conflict.sql();
      for record in records {
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
      }
      txn.commit().await?;

      Ok(changes)
    }
  }

  #[tracing::instrument(skip(database))]
  fn delete_gacha_records_by_business_and_uid(
    database: &Database,
    business: Business,
    uid: u32,
  ) -> impl Future<Output = Result<u64, SqlxError>> {
    async move {
      let changes =
        sqlx::query("DELETE FROM `hg.gacha_records` WHERE `business` = ? AND `uid` = ?;")
          .bind(business)
          .bind(uid)
          .execute(database.as_ref())
          .await?
          .rows_affected();

      Ok(changes)
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
    on_conflict: GachaRecordOnConflict,
  ) -> Result<u64, SqlxError> {
    GachaRecordQuestioner::create_gacha_records(database.as_ref(), records, on_conflict).await
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