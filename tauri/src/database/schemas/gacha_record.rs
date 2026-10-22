use std::time::{Duration, Instant};

use rusqlite::types::FromSqlError;
use rusqlite::{Row, params};
use serde::{Deserialize, Serialize};
use time::serde::rfc3339;
use time::{OffsetDateTime, PrimitiveDateTime};
use tracing::{error, info};

use crate::database::schemas::{AccountBusiness, Properties};
use crate::database::{Database, DatabaseError, impl_questioner_with_handlers};

// Known Gacha record data structures.
//
// | fields     | Genshin Impact               | Honkai: Star Rail       | Zenless Zone Zero            | Miliastra Wonderland      |
// |------------|------------------------------|-------------------------|------------------------------|---------------------------|
// | business   | 0                            | 1                       | 2                            | 3                         |
// | uid        | 100_000_000                  | <-                      | 10_000_000                   | Genshin Impact            |
// | id         | 1675850760000000000          | <-                      | <-                           | Genshin Impact            |
// | gacha_type | 100, 200, 301, 400, 302, 500 | 1, 2, 11, 12, 21, 22    | 1, 2, 3, 5, 102, 103         | 1000, 200[11, 12, 21, 22] |
// | gacha_id   | Null                         | Some                    | Some                         | Null                      |
// | rank_type  | 3, 4, 5                      | <-                      | 2, 3, 4                      | 2, 3, 4, 5                |
// | count      | 1                            | <-                      | <-                           | <-                        |
// | lang       | en-us                        | <-                      | <-                           | <-                        |
// | time       | 2023-01-01T00:00:00±??:00    | <-                      | <-                           | <-                        |
// | item_name  | Some                         | <-                      | <-                           | <-                        |
// | item_type  | [Character, Weapon]          | [Character, Light Cone] | [Agents, W-Engines, Bangboo] | See: /docs/Beyond.md      |
// | item_id    | Empty                        | Some                    | Some                         | Some                      |
// | properties | Null                         | Null                    | Null                         | Some                      |
// |------------|------------------------------|-------------------------|------------------------------|---------------------------|
//
// Note:
// * `<-`    : Same as the left side.
// * `Null`  : This field does not exist.
// * `Some`  : Have values and are different.
// * `Empty` : Is the empty string.
//

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GachaRecord {
  pub business: AccountBusiness,
  pub uid: u32,
  pub id: String,
  pub gacha_type: u32,
  pub gacha_id: Option<u32>,
  pub rank_type: u32,
  pub count: u32,
  #[serde(with = "rfc3339")]
  pub time: OffsetDateTime,
  pub lang: String,
  #[serde(alias = "name")] // v1.2.0 -> item_name
  pub item_name: String,
  pub item_type: String,
  // HACK: Must read from string and write as string,
  // But in the program, parse is u32 type.
  #[serde(with = "hg_url_scraper::helpers::string_number_into")]
  pub item_id: u32,
  pub properties: Option<Properties>,
}

impl GachaRecord {
  // Known `properties` keys
  pub const KEY_SCHEDULE_ID: &str = "schedule_id";
  pub const KEY_IS_UP: &str = "is_up";
  pub const IS_UP_ZERO: &str = "0";

  /// Convert `time` to [`PrimitiveDateTime`],
  /// this conversion loses the [`time::UtcOffset`]. Specific use!
  #[inline]
  pub const fn time_to_primitive(&self) -> PrimitiveDateTime {
    PrimitiveDateTime::new(self.time.date(), self.time.time())
  }
}

// FromRow

impl TryFrom<&Row<'_>> for GachaRecord {
  type Error = rusqlite::Error;

  fn try_from(row: &Row<'_>) -> Result<Self, Self::Error> {
    Ok(Self {
      business: row.get("business")?,
      uid: row.get("uid")?,
      id: row.get("id")?,
      gacha_type: row.get("gacha_type")?,
      gacha_id: row.get("gacha_id")?,
      rank_type: row.get("rank_type")?,
      count: row.get("count")?,
      lang: row.get("lang")?,
      time: row.get("time")?,
      item_name: row.get("name")?, // Column: name
      item_type: row.get("item_type")?,
      item_id: row
        .get::<_, String>("item_id")? // Column: (TEXT) -> u32
        .parse::<u32>()
        .map_err(FromSqlError::other)?,
      properties: row.get("properties")?,
    })
  }
}

/// Minimal view of a gacha record used for analysis.
/// Only the fields needed by `GachaStats::analyze` are retained, so callers
/// can `SELECT` just these columns instead of the full `GachaRecord` row.
#[derive(Clone, Debug)]
pub struct AnalysisGachaRecord {
  pub id: String,
  pub time: OffsetDateTime,
  pub gacha_type: u32,
  pub lang: String,
  pub item_id: u32,
  pub item_name: String,
  pub rank_type: u32,
}

// FromRow

impl TryFrom<&Row<'_>> for AnalysisGachaRecord {
  type Error = rusqlite::Error;

  fn try_from(row: &Row<'_>) -> Result<Self, Self::Error> {
    Ok(Self {
      id: row.get("id")?,
      gacha_type: row.get("gacha_type")?,
      rank_type: row.get("rank_type")?,
      lang: row.get("lang")?,
      time: row.get("time")?,
      item_name: row.get("name")?, // Column: name
      item_id: row
        .get::<_, String>("item_id")? // Column: (TEXT) -> u32
        .parse::<u32>()
        .map_err(FromSqlError::other)?,
    })
  }
}

impl From<GachaRecord> for AnalysisGachaRecord {
  fn from(record: GachaRecord) -> Self {
    Self {
      id: record.id,
      gacha_type: record.gacha_type,
      rank_type: record.rank_type,
      lang: record.lang,
      time: record.time,
      item_name: record.item_name,
      item_id: record.item_id,
    }
  }
}

impl_questioner_with_handlers! {
  #[gacha_record_handlers]
  GachaRecord of GachaRecordQuestioner,

  #[database_find_gacha_records]
  "SELECT * FROM `HG_GACHA_RECORDS` WHERE `business` = ?1 AND `uid` = ?2 ORDER BY `id` ASC;"
    = find_gacha_records {
        business: AccountBusiness,
        uid: u32
      }: fetch_all -> Vec<GachaRecord>,

  #[database_find_gacha_records_with_limit]
  "SELECT * FROM `HG_GACHA_RECORDS` WHERE `business` = ?1 AND `uid` = ?2 ORDER BY `id` ASC LIMIT ?3;"
    = find_gacha_records_with_limit {
        business: AccountBusiness,
        uid: u32,
        limit: u32
      }: fetch_all -> Vec<GachaRecord>,

  #[database_delete_gacha_records]
  "DELETE FROM `HG_GACHA_RECORDS` WHERE `business` = ?1 AND `uid` = ?2;"
    = delete_gacha_records { business: AccountBusiness, uid: u32 }: execute -> usize,

  #[database_delete_gacha_records_with_newer_than_end_id]
  "DELETE FROM `HG_GACHA_RECORDS` WHERE `business` = ?1 AND `uid` = ?2 AND `gacha_type` = ?3 AND `id` >= ?4;"
    = delete_gacha_records_with_newer_than_end_id {
        business: AccountBusiness,
        uid: u32,
        gacha_type: u32,
        end_id: String
      }: execute -> usize,

  // See: tauri/src/business/stats.rs
  "SELECT `id`, `gacha_type`, `rank_type`, `lang`, `time`, `name`, `item_id` FROM `HG_GACHA_RECORDS` WHERE `business` = ?1 AND `uid` = ?2 ORDER BY `id` ASC"
    = find_analysis_records {
        business: AccountBusiness,
        uid: u32
      }: fetch_all -> Vec<AnalysisGachaRecord>,
}

// Saver transaction

/// Strategy for handling conflicts when saving [`GachaRecord`]s into the database.
///
/// `Nothing` will ignore the conflicting records and not save them.
/// `Update` will update the existing records with the new data.
#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
pub enum GachaRecordSaveOnConflict {
  #[default]
  Nothing,
  Update,
}

const SQL_NOTHING: &str = "INSERT INTO `HG_GACHA_RECORDS` (`business`, `uid`, `id`, `gacha_type`, `gacha_id`, `rank_type`, `count`, `time`, `lang`, `name`, `item_type`, `item_id`, `properties`) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13) ON CONFLICT (`business`, `uid`, `id`, `gacha_type`) DO NOTHING;";

const SQL_UPDATE: &str = "INSERT INTO `HG_GACHA_RECORDS` (`business`, `uid`, `id`, `gacha_type`, `gacha_id`, `rank_type`, `count`, `time`, `lang`, `name`, `item_type`, `item_id`, `properties`) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13) ON CONFLICT (`business`, `uid`, `id`, `gacha_type`) DO UPDATE SET `gacha_id` = excluded.`gacha_id`, `rank_type` = excluded.`rank_type`, `count` = excluded.`count`, `time` = excluded.`time`, `lang` = excluded.`lang`, `name` = excluded.`name`, `item_type` = excluded.`item_type`, `item_id` = excluded.`item_id`, `properties` = excluded.`properties`;";

impl GachaRecordSaveOnConflict {
  #[inline]
  const fn sql(&self) -> &'static str {
    match self {
      GachaRecordSaveOnConflict::Nothing => SQL_NOTHING,
      GachaRecordSaveOnConflict::Update => SQL_UPDATE,
    }
  }
}

/// Create a transaction to save multiple [`GachaRecord`]s into the database.
///
/// Note: This function will automatically commit the transaction after all records are saved.
///
/// # Arguments
/// * `database` - The database connection.
/// * `records` - The list of records to save.
/// * `on_conflict` - The strategy to use when a conflict is encountered.
/// * `on_progress` - An optional callback to report progress.
///
/// # Returns
/// The number of records successfully saved, or an error if the operation failed.
#[tracing::instrument(
  skip_all,
  fields(
    records = records.len(),
    ?on_conflict,
  )
)]
pub async fn save_transaction<P>(
  database: &Database,
  records: Vec<GachaRecord>,
  on_conflict: GachaRecordSaveOnConflict,
  on_progress: Option<P>,
) -> Result<usize, DatabaseError>
where
  P: Fn(u64) + Send + 'static,
{
  let len = records.len();
  if len == 0 {
    return Ok(0);
  }

  let start = Instant::now();
  info!("Committing GachaRecord save transaction...");

  database
    .interact(move |conn| {
      let txn = conn.transaction()?;
      let mut changes: usize = 0;
      let mut completes: u64 = 0;

      const PROGRESS_EVERY: u64 = 100;
      const PROGRESS_INTERVAL: Duration = Duration::from_millis(50);
      let mut last_progress = Instant::now();

      {
        let mut stmt = txn.prepare_cached(on_conflict.sql())?;
        for record in records {
          let n = match stmt.execute(params![
            record.business,
            record.uid,
            record.id,
            record.gacha_type,
            record.gacha_id,
            record.rank_type,
            record.count,
            record.time,
            record.lang,
            record.item_name,
            record.item_type,
            record.item_id,
            record.properties,
          ]) {
            Ok(n) => n,
            Err(err) => {
              error!(message = "Failed to save GachaRecord", ?record, ?err);
              return Err(err); // drop and auto rollback
            }
          };

          changes += n;
          completes += 1;

          if let Some(cb) = &on_progress
            && (completes.is_multiple_of(PROGRESS_EVERY)
              || last_progress.elapsed() >= PROGRESS_INTERVAL
              || len == completes as usize)
          {
            cb(completes);
            last_progress = Instant::now();
          }
        }
      }

      txn.commit()?;
      info!(
        message = "GachaRecord save transaction committed",
        elapsed = ?start.elapsed(),
        changes,
      );

      Ok(changes)
    })
    .await
}
