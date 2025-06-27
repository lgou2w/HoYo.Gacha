use std::env;
use std::error::Error as StdError;
use std::fmt::Debug;
use std::path::{Path, PathBuf};
use std::str::FromStr;
use std::time::Instant;

use serde::Serialize;
use sqlx::sqlite::SqliteConnectOptions;
use sqlx::{Executor, Row, SqlitePool, SqliteTransaction};
use time::PrimitiveDateTime;
use tracing::{info, warn};

use crate::business::{
  DataFolderLocator, GACHA_TIME_FORMAT, GachaMetadata, UnityLogDataFolderLocator,
};
use crate::consts;
use crate::database::{
  AccountQuestioner, Database, GachaRecordQuestioner, GachaRecordQuestionerAdditions,
  GachaRecordSaveOnConflict,
};
use crate::models::{AccountProperties, Business, GachaRecord};

//
// Migration v0.3.x ~ v0.4.x database to v1.0.0
// https://github.com/lgou2w/HoYo.Gacha/tree/0.3.10/src-tauri/src/storage
// https://github.com/lgou2w/HoYo.Gacha/tree/0.4.4/src-tauri/src/storage
//

// TODO: Custom error kind

#[derive(Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MigrationMetrics {
  pub accounts: u32,
  pub gacha_records: u64,
}

pub async fn migration(
  database: &Database,
) -> Result<MigrationMetrics, Box<dyn StdError + 'static>> {
  let legacy_database = env::current_exe()
    .expect("Failed to get current executable path")
    .parent()
    .unwrap()
    .join(consts::LEGACY_DATABASE);

  migration_with(database, legacy_database).await
}

#[tracing::instrument(skip_all)]
pub async fn migration_with(
  database: &Database,
  legacy_database: impl AsRef<Path> + Debug,
) -> Result<MigrationMetrics, Box<dyn StdError + 'static>> {
  let legacy_database = legacy_database.as_ref();
  if !legacy_database.exists() {
    return Err("Legacy database does not exist".into());
  }

  if database.as_ref().connect_options().get_filename() == legacy_database {
    return Err("Legacy database path cannot be the same as the current database path".into());
  }

  let start = Instant::now();
  info!(
    message = "Migrating legacy database",
    legacy_database = %legacy_database.display(),
  );

  let legacy_database = SqlitePool::connect_with(
    SqliteConnectOptions::new()
      .filename(legacy_database)
      .read_only(true)
      .immutable(true)
      .shared_cache(false),
  )
  .await?;

  // Metrics
  let mut metrics = MigrationMetrics::default();

  // Write txn
  let mut txn = database.as_ref().begin().await?;

  // entity_account.rs
  // - id            : Index
  // - facet         : "genshin" | "starrail" | "zzz"
  // - uid           : "123456"
  // - game_data_dir : "some"
  // - gacha_url     : "some"   (nullable)
  // - properties    : "{JSON}" (nullable)

  for row in legacy_database
    .fetch_all("SELECT * FROM `accounts`;")
    .await?
  {
    let facet: String = row.try_get("facet")?;
    let uid: u32 = row.try_get::<String, _>("uid")?.parse()?;
    let mut game_data_dir: String = row.try_get("game_data_dir")?;
    // let gacha_url: Option<String> = row.try_get("gacha_url")?;
    let properties: Option<serde_json::Map<String, serde_json::Value>> = row
      .try_get::<Option<String>, _>("properties")?
      .map(|json| serde_json::from_str(&json))
      .transpose()?;

    let business = match facet.as_str() {
      "genshin" => Business::GenshinImpact,
      "starrail" => Business::HonkaiStarRail,
      "zzz" => Business::ZenlessZoneZero,
      _ => {
        warn!(message = "Unknown account facet", %facet, %uid);
        continue;
      }
    };

    let business_region = business.detect_uid_business_region(uid).ok_or(format!(
      "Failed to detect business region for uid: {uid} ({business})"
    ))?;

    let properties = properties.and_then(move |mut props| {
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

      if props.is_empty() {
        return None;
      }

      let mut new_props = AccountProperties::default();

      new_props.insert(
        "displayName".into(),
        props.remove("displayName").unwrap_or_default(),
      );
      // new_props.insert("gachaUrl".into(), gacha_url.into());
      new_props.insert(
        "lastGachaRecordsUpdated".into(),
        props.remove("lastGachaUpdated").unwrap_or_default(),
      );

      Some(new_props)
    });

    // Check game data dir
    {
      let legacy = PathBuf::from(&game_data_dir);
      if !legacy.exists() {
        if let Ok(data_folder) = UnityLogDataFolderLocator
          .locate_data_folder(business, business_region)
          .await
        {
          game_data_dir = format!("{}", data_folder.value.display());
          warn!(
            message = "Legacy game data directory does not exist, using new location",
            %business,
            uid,
            legacy = %legacy.display(),
            new = %game_data_dir,
          );
        }
      }
    }

    if let Err(error) =
      AccountQuestioner::sql_create_account(business, uid, game_data_dir, properties)
        .fetch_one(&mut *txn)
        .await
    {
      if let Some(database_error) = error.as_database_error() {
        if database_error.is_unique_violation() {
          warn!(
            message = "Account already exists, skipping",
            %business,
            uid,
          );
          continue;
        }
      }

      return Err(error.into());
    };

    info!(
      message = "Migrated account",
      %business,
      uid,
    );

    metrics.accounts += 1;
  }

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

  async fn migration_gacha_records(
    database_txn: &mut SqliteTransaction<'static>,
    legacy_database: &SqlitePool,
    table: &'static str,
    business: Business,
  ) -> Result<u64, Box<dyn StdError + 'static>> {
    use futures_util::TryStreamExt;

    info!(message = "Migrating gacha records from legacy table", %table, ?business);
    let start = Instant::now();

    let exists = legacy_database
      .fetch_optional(
        format!(
          "SELECT `name` FROM `sqlite_master` WHERE `type` = 'table' AND `name` = '{table}';"
        )
        .as_str(),
      )
      .await?
      .is_some();

    if !exists {
      warn!("Legacy table does not exist, skipping migration: {table}");
      return Ok(0);
    }

    let sql = format!("SELECT * FROM `{table}`;");
    let mut stream = legacy_database.fetch(sql.as_str());
    let metadata = GachaMetadata::current();
    let is_genshin_impact = business == Business::GenshinImpact;

    let mut total = 0;
    while let Some(row) = stream.try_next().await? {
      let uid = row.try_get::<String, _>("uid")?.parse()?;
      let server_region = business.detect_uid_server_region(uid).ok_or(format!(
        "Failed to determine server region for uid: {uid} ({business})"
      ))?;

      let id = row.try_get("id")?;
      let gacha_type = row.try_get::<String, _>("gacha_type")?.parse()?;
      let gacha_id = if is_genshin_impact {
        None
      } else {
        row
          .try_get::<Option<String>, _>("gacha_id")?
          .as_deref()
          .map(FromStr::from_str)
          .transpose()?
      };

      let rank_type = row.try_get::<String, _>("rank_type")?.parse()?;
      let count = row.try_get::<String, _>("count")?.parse()?;
      let lang = row.try_get("lang")?;

      let time = row.try_get::<String, _>("time")?;
      let time = PrimitiveDateTime::parse(&time, GACHA_TIME_FORMAT)?
        .assume_offset(server_region.time_zone());

      let mut name = row.try_get::<String, _>("name")?;
      let item_type = row.try_get("item_type")?;
      let mut item_id = row.try_get::<String, _>("item_id")?;

      let metadata_locale = metadata
        .obtain(business, &lang)
        .ok_or(format!("Missing metadata locale: {lang} ({business})"))?;

      match item_id.trim() {
        "" => {
          // Genshin Impact only
          let metadata_entry = metadata_locale.entry_from_name_first(&name).ok_or(format!(
            "Missing metadata entry: {name}, locale: {lang} ({business})"
          ))?;

          item_id = metadata_entry.id.to_owned();
        }
        other => {
          // Honkai: Star Rail & Zenless Zone Zero
          let metadata_entry = metadata_locale.entry_from_id(other).ok_or(format!(
            "Missing metadata entry: {other}, locale: {lang} ({business})"
          ))?;

          // Prefer metadata item name
          if name != metadata_entry.name {
            name = metadata_entry.name.to_owned();
          }
        }
      }

      let query = GachaRecordQuestioner::sql_create_gacha_record(
        GachaRecord {
          business,
          uid,
          id,
          gacha_type,
          gacha_id,
          rank_type,
          count,
          lang,
          time,
          name,
          item_type,
          item_id,
        },
        GachaRecordSaveOnConflict::Nothing,
      );

      database_txn.execute(query).await?;
      total += 1;
    }

    info!(
      message = "Migration completed",
      elapsed = ?start.elapsed(),
      %table,
      ?business,
    );

    Ok(total)
  }

  metrics.gacha_records += migration_gacha_records(
    &mut txn,
    &legacy_database,
    "genshin_gacha_records",
    Business::GenshinImpact,
  )
  .await?;

  metrics.gacha_records += migration_gacha_records(
    &mut txn,
    &legacy_database,
    "starrail_gacha_records",
    Business::HonkaiStarRail,
  )
  .await?;

  // Zenless Zone Zero in v0.4.0+
  metrics.gacha_records += migration_gacha_records(
    &mut txn,
    &legacy_database,
    "zzz_gacha_records",
    Business::ZenlessZoneZero,
  )
  .await?;

  // commit
  txn.commit().await?;

  info!(
    message = "Legacy database migration completed",
    elapsed = ?start.elapsed(),
  );

  Ok(metrics)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  #[ignore = "Hard-coded database path"]
  async fn test_migration() {
    let database = r"\HoYo.Gacha\migration\HoYo.Gacha.v1.db";
    let legacy_database = r"\HoYo.Gacha\migration\HoYo.Gacha.db";

    let database = Database::new_with(database).await;
    let metrics = migration_with(&database, legacy_database).await.unwrap();
    println!("Migration metrics: {metrics:?}");

    database.close().await;
  }
}
