use std::collections::HashMap;
use std::fmt::Debug;
use std::path::PathBuf;
use std::time::Instant;

use hg_game_biz::Uid;
use hg_metadata::Metadata;
use hg_url_scraper::GACHA_LOG_TIME_FORMAT;
use serde::Serialize;
use snafu::{Snafu, ensure};
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::{Executor, Row, SqlitePool, SqliteTransaction};
use time::{OffsetDateTime, PrimitiveDateTime};
use tracing::{debug, error, info, warn};

use crate::business::data_folder::{DataFolderLocator, UnityLogDataFolderLocator};
use crate::constants;
use crate::database::schemas::{
  AccountBusiness, AccountQuestioner, GachaRecord, GachaRecordSaveOnConflict, JsonProperties,
};
use crate::database::{Database, DatabaseError};
use crate::error::ErrorDetails;

#[derive(Debug, Snafu)]
pub enum LegacyMigrationError {
  #[snafu(display("Legacy database path does not exist"))]
  NotFound,

  #[snafu(display("Legacy database path cannot be the same as the current database path"))]
  SamePath,

  #[snafu(display("{source}"))]
  Database { source: DatabaseError },

  #[snafu(display("Invalid {business:?} account uid: {value}"))]
  InvalidUid {
    business: AccountBusiness,
    value: String,
  },

  #[snafu(display("Invalid {business:?} record field '{field}': {value} (uid: {uid}, id: {id})"))]
  InvalidRecord {
    business: AccountBusiness,
    uid: u32,
    id: String,
    field: &'static str,
    value: String,
  },

  #[snafu(display("Missing metadata locale: {business:?}, lang: {lang}"))]
  MetadataLocale {
    business: AccountBusiness,
    lang: String,
  },

  #[snafu(display("Missing metadata entry: {business:?}, lang: {lang}, {field}: {value}"))]
  MetadataEntry {
    business: AccountBusiness,
    lang: String,
    field: &'static str,
    value: String,
  },
}

impl ErrorDetails for LegacyMigrationError {
  fn name(&self) -> &'static str {
    match self {
      Self::Database { source } => source.name(),
      _ => stringify!(LegacyMigrationError),
    }
  }

  fn details(&self) -> Option<serde_json::Value> {
    use serde_json::json;

    match self {
      Self::Database { source } => source.details(),
      Self::NotFound => Some(json!({
        "kind": stringify!(NotFound),
      })),
      Self::SamePath => Some(json!({
        "kind": stringify!(SamePath),
      })),
      Self::InvalidUid { business, value } => Some(json!({
        "kind": stringify!(InvalidUid),
        "business": business,
        "value": value,
      })),
      Self::InvalidRecord {
        business,
        uid,
        id,
        field,
        value,
      } => Some(json!({
        "kind": stringify!(InvalidRecord),
        "business": business,
        "uid": uid,
        "id": id,
        "field": field,
        "value": value,
      })),
      Self::MetadataLocale { business, lang } => Some(json!({
        "kind": stringify!(MetadataLocale),
        "business": business,
        "lang": lang,
      })),
      Self::MetadataEntry {
        business,
        lang,
        field,
        value,
      } => Some(json!({
        "kind": stringify!(MetadataEntry),
        "business": business,
        "lang": lang,
        "field": field,
        "value": value,
      })),
    }
  }
}

mod private {
  use super::*;

  impl From<sqlx::Error> for LegacyMigrationError {
    fn from(value: sqlx::Error) -> Self {
      Self::Database {
        source: DatabaseError::from(value),
      }
    }
  }
}

#[derive(Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct LegacyMigration {
  pub accounts: usize,
  pub records: HashMap<AccountBusiness, u64>, // business -> total
  pub elapsed: f32,
}

impl LegacyMigration {
  #[tracing::instrument(skip_all)]
  pub async fn migrate(
    database: &Database,
    metadata: &dyn Metadata,
    legacy: Option<PathBuf>,
  ) -> Result<Self, LegacyMigrationError> {
    // Or current exe dir with default filename
    let legacy = legacy.unwrap_or(
      #[allow(deprecated)]
      constants::EXE_WORKING_DIR.join(constants::DATABASE_LEGACY),
    );

    // Verify legacy
    ensure!(legacy.exists(), NotFoundSnafu);
    ensure!(legacy != database.filename, SamePathSnafu);

    let start = Instant::now();
    info!(message = "Migrating legacy database...", ?legacy, ?start);

    let legacy = SqlitePool::connect_with(
      SqliteConnectOptions::new()
        .filename(legacy)
        .read_only(true)
        .immutable(false)
        .shared_cache(false),
    )
    .await?;

    // Create transaction
    let mut txn = database.inner.begin().await?;

    let mut migration = Self::default();
    migration.migrate_accounts(&mut txn, &legacy).await?;
    migration
      .migrate_records(&mut txn, metadata, &legacy)
      .await?;

    // Commit
    txn.commit().await?;

    let elapsed = start.elapsed();
    migration.elapsed = elapsed.as_secs_f32();

    info!(
      message = "Legacy database migrate completed",
      ?elapsed,
      ?migration
    );

    Ok(migration)
  }

  //
  // Migration v0.3.x ~ v0.4.x database to v1.0.0
  // https://github.com/lgou2w/HoYo.Gacha/tree/0.3.10/src-tauri/src/storage
  // https://github.com/lgou2w/HoYo.Gacha/tree/0.4.4/src-tauri/src/storage
  //

  #[tracing::instrument(skip_all)]
  async fn migrate_accounts(
    &mut self,
    database: &mut SqliteTransaction<'static>,
    legacy: &SqlitePool,
  ) -> Result<(), LegacyMigrationError> {
    info!("Migrating legacy accounts...");

    let rows = legacy.fetch_all("SELECT * FROM `accounts`;").await?;
    for row in rows {
      // entity_account.rs
      // - id            : Index
      // - facet         : "genshin" | "starrail" | "zzz"
      // - uid           : "123456"
      // - game_data_dir : "some"
      // - gacha_url     : "some"   (nullable)
      // - properties    : "{JSON}" (nullable)

      let facet: String = row.try_get("facet")?;
      let uid: String = row.try_get("uid")?;
      let mut data_folder: String = row.try_get("game_data_dir")?;
      let properties: Option<String> = row.try_get("properties")?;

      // facet -> business
      let business = match facet.as_str() {
        "genshin" => AccountBusiness::GenshinImpact,
        "starrail" => AccountBusiness::HonkaiStarRail,
        "zzz" => AccountBusiness::ZenlessZoneZero,
        _ => {
          error!(message = "Invalid legacy account facet", ?facet, ?uid);
          continue;
        }
      };

      // parse and validate uid
      let uid = if let Ok(n) = uid.parse::<u32>()
        && let Some(valid) = Uid::validate(business.as_game(), n)
      {
        valid
      } else {
        error!(message = "Invalid legacy account uid", ?business, ?uid);
        continue;
      };

      // Try parse properties or using default when error
      // Legacy {
      //    displayName      ?: string | null
      //    lastGachaUpdated ?: string | null
      //    [key: string]     : unknown
      // }
      //
      // v1.0.0 {
      //    displayName             ?: string | null
      //    gachaUrl                ?: string | null
      //    gachaUrlCreationTime    ?: string | null
      //    lastGachaRecordsUpdated ?: string | null
      // }
      let properties: Option<JsonProperties> = properties
        .as_deref()
        .map(serde_json::from_str)
        .transpose()
        .unwrap_or_default();

      let new_properties = properties.map(|mut props| {
        let mut new_props = JsonProperties::default();
        new_props.insert("displayName".into(), props.remove("displayName").into());
        new_props.insert(
          "lastGachaRecordsUpdated".into(),
          props.remove("lastGachaUpdated").into(),
        );
        new_props
      });

      // Check data folder
      if !PathBuf::from(&data_folder).is_dir()
        && let Ok(reobtain) = UnityLogDataFolderLocator
          .locate(business, uid.value())
          .await
      {
        data_folder = format!("{}", reobtain.value.display());
        warn!(
          message = "Legacy data folder does not exist, using new location",
          ?business,
          uid = ?uid.value(),
          ?data_folder
        );
      }

      // Preparing to create
      if let Err(err) = database
        .create_account(business, uid.value(), &data_folder, new_properties)
        .await
      {
        if let Some(native) = err.source.as_database_error()
          && native.is_unique_violation()
        {
          error!(message = "Account already exists, skipping...", ?business, uid = ?uid.value());
          continue;
        } else {
          return Err(LegacyMigrationError::Database { source: err });
        }
      }

      info!(message = "Migrated account", ?business, uid = ?uid.value());
      self.accounts += 1;
    }

    Ok(())
  }

  #[tracing::instrument(skip_all)]
  async fn migrate_records(
    &mut self,
    database: &mut SqliteTransaction<'static>,
    metadata: &dyn Metadata,
    legacy: &SqlitePool,
  ) -> Result<(), LegacyMigrationError> {
    info!("Migrating legacy records...");

    // entity_genshin_gacha_record.rs
    // entity_starrail_gacha_record.rs
    // entity_zzz_gacha_record.rs - v0.4.0+
    // - id         : "some record id"
    // - uid        : "account uid"
    // - gacha_id   : "some" (starrail & zzz)
    // - gacha_type : "some"
    // - item_id    : "some" (genshin is blank)
    // - count      : "some"
    // - time       : "some"
    // - name       : "some"
    // - lang       : "some"
    // - item_type  : "some"
    // - rank_type  : "some"

    const MAPPINGS: &[(AccountBusiness, &str)] = &[
      (AccountBusiness::GenshinImpact, "genshin_gacha_records"),
      (AccountBusiness::HonkaiStarRail, "starrail_gacha_records"),
      (AccountBusiness::ZenlessZoneZero, "zzz_gacha_records"),
    ];

    for mapping in MAPPINGS {
      self
        .migrate_records_with(database, metadata, legacy, mapping)
        .await?;
    }

    Ok(())
  }

  #[tracing::instrument(skip_all)]
  async fn migrate_records_with(
    &mut self,
    database: &mut SqliteTransaction<'static>,
    metadata: &dyn Metadata,
    legacy: &SqlitePool,
    mapping: &'static (AccountBusiness, &'static str), // business -> legacy table
  ) -> Result<(), LegacyMigrationError> {
    info!(message = "Migrating legacy records with", ?mapping);

    let (business, table) = *mapping;
    let is_genshin_impact = business == AccountBusiness::GenshinImpact;
    let start = Instant::now();

    // Check table exists
    let exists = legacy
      .fetch_optional(
        format!(
          "SELECT `name` FROM `sqlite_master` WHERE `type` = 'table' AND `name` = '{table}';",
        )
        .as_str(),
      )
      .await?
      .is_some();

    if !exists {
      warn!("Legacy table '{table}' does not exist, skipping");
      return Ok(());
    }

    let select = format!("SELECT * FROM `{table}`;");
    let mut stream = legacy.fetch(select.as_str());
    let mut total: u64 = 0;

    use futures_util::TryStreamExt;
    while let Some(row) = stream.try_next().await? {
      let id: String = row.try_get("id")?;
      let uid: String = row.try_get("uid")?;

      // parse and validate uid
      let uid = if let Ok(n) = uid.parse::<u32>()
        && let Some(valid) = Uid::validate(business.as_game(), n)
      {
        valid
      } else {
        error!(message = "Invalid legacy record uid", ?business, ?id, ?uid);
        InvalidUidSnafu {
          business,
          value: uid,
        }
        .fail()?
      };

      macro_rules! invalid_record {
        ($field:literal -> $value:expr) => {
          error!(
            message = "Invalid legacy record field value",
            ?business,
            uid = ?uid.value(),
            ?id,
            field = ?$field,
            value = ?$value,
          );
          return InvalidRecordSnafu {
            business,
            uid: uid.value(),
            id,
            field: $field,
            value: $value,
          }
          .fail()?
        };
      }

      // parse and validate gacha type
      let gacha_type = row.try_get::<String, _>("gacha_type")?;
      let gacha_type = if let Ok(n) = gacha_type.parse::<u32>() {
        n
      } else {
        invalid_record! { "gacha_type" -> gacha_type }
      };

      // parse and validate gacha id
      let mut gacha_id: Option<u32> = None;
      if !is_genshin_impact && let Some(str) = row.try_get::<Option<String>, _>("gacha_id")? {
        if let Ok(n) = str.parse() {
          gacha_id.replace(n);
        } else {
          invalid_record! { "gacha_id" -> str }
        }
      }

      // parse and validate time
      let time: String = row.try_get("time")?;
      let time: OffsetDateTime =
        if let Ok(n) = PrimitiveDateTime::parse(&time, GACHA_LOG_TIME_FORMAT) {
          n.assume_offset(uid.game_biz().timezone())
        } else {
          invalid_record! { "time" -> time }
        };

      let lang: String = row.try_get("lang")?;
      let count: u32 = row.try_get::<String, _>("count")?.parse().unwrap_or(1);

      let mut item_name: String = row.try_get("name")?;
      let mut rank_type: Option<u32> = row
        .try_get::<String, _>("rank_type")?
        .parse::<u32>()
        .map(Option::Some)
        .unwrap_or_default();

      let mut item_type: String = row.try_get("item_type")?;
      let mut item_id: Option<u32> = row
        .try_get::<String, _>("item_id")?
        .parse::<u32>()
        .map(Option::Some)
        .unwrap_or_default();

      // Map metadata locale
      let locale = if let Some(find) = metadata.locale(business as _, &lang) {
        find
      } else {
        error!(message = "Missing metadata locale", ?business, ?lang);
        return MetadataLocaleSnafu { business, lang }.fail()?;
      };

      // Map metadata entry
      let entry = match item_id {
        // 'Genshin Impact' only
        None => {
          let entry = if let Some(find) = locale.entry_from_name_first(&item_name) {
            find
          } else {
            error!(
              message = "Missing metadata entry",
              ?business,
              ?lang,
              ?item_name
            );
            return MetadataEntrySnafu {
              business,
              lang,
              field: "item_name",
              value: item_name,
            }
            .fail()?;
          };

          // Remapping item id
          item_id.replace(entry.item_id);
          entry
        }
        // 'Honkai: Star Rail' & 'Zenless Zone Zero'
        Some(other) => {
          let entry = if let Some(find) = locale.entry_from_id(other) {
            find
          } else {
            error!(message = "Missing metadata entry", ?business, ?lang, item_id = ?other);
            return MetadataEntrySnafu {
              business,
              lang,
              field: "item_id",
              value: other.to_string(),
            }
            .fail()?;
          };

          // Prefer metadata item name
          if item_name.is_empty() || item_name != entry.item_name {
            debug!(
              message = "Prefer metadata entry item name",
              source = ?item_name,
              prefer = ?entry.item_name
            );
            item_name = entry.item_name.to_owned();
          }

          entry
        }
      };

      // Automatically fix incorrect data
      // See: https://github.com/lgou2w/HoYo.Gacha/issues/95
      if rank_type.is_none() {
        rank_type.replace(entry.rank_type as _);
      }
      if item_type.is_empty() || item_type != entry.category_name {
        item_type = entry.category_name.to_owned();
      }
      //

      // Preparing to create record
      const SAVE_ON_CONFLICT: GachaRecordSaveOnConflict = GachaRecordSaveOnConflict::Nothing;
      let record = GachaRecord {
        business,
        uid: uid.value(),
        id,
        gacha_type,
        gacha_id,
        rank_type: rank_type.unwrap(), // SAFETY: See below
        count,
        lang: entry.locale.to_owned(),
        time,
        item_name,
        item_type,
        item_id: item_id.unwrap(), // SAFETY: See below
        properties: None,
      };

      database.execute(SAVE_ON_CONFLICT.as_query(&record)).await?;
      total += 1;
    }

    self.records.insert(business, total);
    info!(
      message = "Migrated legacy records with",
      ?mapping,
      elapsed = ?start.elapsed(),
      ?total
    );

    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  #[ignore = "Hard-coded database path"]
  async fn test_migration() {
    crate::bootstrap::init_tracing();

    let database = r"\Temp\HoYo.Gacha.v1.db";
    let legacy = r"\HoYo.Gacha\HoYo.Gacha.db";

    let metadata = crate::business::metadata::Metadata::embedded();
    let database = Database::new_with(database).await.unwrap();
    database.apply_migrations().await.unwrap();

    let migration = LegacyMigration::migrate(&database, metadata, Some(PathBuf::from(legacy)))
      .await
      .unwrap();

    println!("Legacy migration: {migration:?}");
    database.close().await;
  }
}
