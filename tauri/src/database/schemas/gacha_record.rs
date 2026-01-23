use std::collections::HashSet;
use std::time::Instant;

use serde::{Deserialize, Serialize};
use sqlx::query::Query;
use sqlx::sqlite::{SqliteArguments, SqliteRow};
use sqlx::{FromRow, Row, Sqlite};
use time::serde::rfc3339;
use time::{OffsetDateTime, PrimitiveDateTime};
use tracing::{error, info};

use crate::database::schemas::{AccountBusiness, JsonProperties};
use crate::database::{Database, DatabaseError};

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

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct GachaRecord {
  pub business: AccountBusiness,
  pub uid: u32,
  pub id: String,
  pub gacha_type: u32,
  pub gacha_id: Option<u32>,
  pub rank_type: u32,
  pub count: u32,
  pub lang: String,
  #[serde(with = "rfc3339")]
  pub time: OffsetDateTime,
  #[serde(alias = "name")] // v1.2.0 -> item_name
  pub item_name: String,
  pub item_type: String,
  // HACK: Must read from string and write as string,
  // But in the program, parse is u32 type.
  #[serde(with = "hg_serde_helper::string_number_into")]
  pub item_id: u32,
  pub properties: Option<JsonProperties>,
}

impl GachaRecord {
  /// HACK: 'Genshin Impact: Miliastra Wonderland' only
  #[inline]
  pub const fn is_rank_green(&self) -> bool {
    matches!(
      (self.business, self.rank_type),
      (AccountBusiness::MiliastraWonderland, 2)
    )
  }

  #[inline]
  pub const fn is_rank_blue(&self) -> bool {
    matches!(
      (self.business, self.rank_type),
      (
        AccountBusiness::GenshinImpact
          | AccountBusiness::MiliastraWonderland
          | AccountBusiness::HonkaiStarRail,
        3
      ) | (AccountBusiness::ZenlessZoneZero, 2)
    )
  }

  #[inline]
  pub const fn is_rank_purple(&self) -> bool {
    matches!(
      (self.business, self.rank_type),
      (
        AccountBusiness::GenshinImpact
          | AccountBusiness::MiliastraWonderland
          | AccountBusiness::HonkaiStarRail,
        4
      ) | (AccountBusiness::ZenlessZoneZero, 3)
    )
  }

  #[inline]
  pub const fn is_rank_golden(&self) -> bool {
    matches!(
      (self.business, self.rank_type),
      (
        AccountBusiness::GenshinImpact
          | AccountBusiness::MiliastraWonderland
          | AccountBusiness::HonkaiStarRail,
        5
      ) | (AccountBusiness::ZenlessZoneZero, 4)
    )
  }

  /// Convert `time` to [`PrimitiveDateTime`],
  /// this conversion loses the [`time::UtcOffset`]. Specific use!
  #[inline]
  pub const fn time_to_primitive(&self) -> PrimitiveDateTime {
    PrimitiveDateTime::new(self.time.date(), self.time.time())
  }
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
      item_name: row.try_get("name")?, // database: name
      item_type: row.try_get("item_type")?,
      item_id: row
        .try_get::<String, _>("item_id")? // database: string
        .parse::<u32>()
        .map_err(|e| sqlx::Error::Decode(e.into()))?,
      properties: row.try_get("properties")?,
    })
  }
}

impl_questioner_with_handlers! {
  #[gacha_record_handlers]
  GachaRecord of GachaRecordQuestioner,

  "SELECT * FROM `HG_GACHA_RECORDS` WHERE `business` = ? AND `uid` = ? ORDER BY `id` ASC;"
    = find_gacha_records {
        business: AccountBusiness,
        uid: u32
      }: fetch_all -> Vec<GachaRecord>,

  #[database_find_gacha_records_with_limit]
  "SELECT * FROM `HG_GACHA_RECORDS` WHERE `business` = ? AND `uid` = ? ORDER BY `id` ASC LIMIT ?;"
    = find_gacha_records_with_limit {
        business: AccountBusiness,
        uid: u32,
        limit: u32
      }: fetch_all -> Vec<GachaRecord>,

  "SELECT * FROM `HG_GACHA_RECORDS` WHERE `business` IN (?) AND `uid` = ? ORDER BY `id` ASC;"
    = find_gacha_records_with_businesses {
        businesses: HashSet<AccountBusiness> => businesses
          .iter()
          .map(|b| (*b as u8).to_string())
          .collect::<Vec<_>>()
          .join(","),
        uid: u32
      }: fetch_all -> Vec<GachaRecord>,

  #[database_delete_gacha_records]
  "DELETE FROM `HG_GACHA_RECORDS` WHERE `business` = ? AND `uid` = ?;"
    = delete_gacha_records { business: AccountBusiness, uid: u32 }: execute -> u64,

  "DELETE FROM `HG_GACHA_RECORDS` WHERE `business` = ? AND `uid` = ? AND `gacha_type` = ? AND `id` >= ?;"
    = delete_gacha_records_with_newer_than_end_id {
        business: AccountBusiness,
        uid: u32,
        gacha_type: u32,
        end_id: &str
      }: execute -> u64,
}

// Create and save transaction

#[derive(Clone, Copy, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
pub enum GachaRecordSaveOnConflict {
  #[default]
  Nothing,
  Update,
}

impl GachaRecordSaveOnConflict {
  pub const fn as_sql(&self) -> &'static str {
    match self {
      Self::Nothing => {
        "INSERT INTO `HG_GACHA_RECORDS` (
          `business`, `uid`, `id`, `gacha_type`, `gacha_id`, `rank_type`,
          `count`, `time`, `lang`, `name`, `item_type`, `item_id`,
          `properties`
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?
        ) ON CONFLICT (`business`, `uid`, `id`, `gacha_type`) DO NOTHING;"
      }
      Self::Update => {
        "INSERT INTO `HG_GACHA_RECORDS` (
          `business`, `uid`, `id`, `gacha_type`, `gacha_id`, `rank_type`,
          `count`, `time`, `lang`, `name`, `item_type`, `item_id`,
          `properties`
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?
        ) ON CONFLICT (`business`, `uid`, `id`, `gacha_type`) DO UPDATE SET
          `gacha_id`   = excluded.`gacha_id`,
          `rank_type`  = excluded.`rank_type`,
          `count`      = excluded.`count`,
          `time`       = excluded.`time`,
          `lang`       = excluded.`lang`,
          `name`       = excluded.`name`,
          `item_type`  = excluded.`item_type`,
          `item_id`    = excluded.`item_id`,
          `properties` = excluded.`properties`;"
      }
    }
  }

  /// Generate a query for saving a GachaRecord with the specified conflict resolution strategy.
  pub fn as_query<'r>(&self, bind: &'r GachaRecord) -> Query<'r, Sqlite, SqliteArguments<'r>> {
    sqlx::query(self.as_sql())
      .bind(bind.business)
      .bind(bind.uid)
      .bind(&bind.id)
      .bind(bind.gacha_type)
      .bind(bind.gacha_id)
      .bind(bind.rank_type)
      .bind(bind.count)
      .bind(bind.time)
      .bind(&bind.lang)
      .bind(&bind.item_name) // database: name
      .bind(&bind.item_type)
      .bind(bind.item_id) // database: string
      .bind(&bind.properties)
  }
}

pub struct GachaRecordSaver<'a, P>
where
  P: Fn(u64),
{
  records: &'a [GachaRecord],
  on_conflict: GachaRecordSaveOnConflict,
  progress_reporter: Option<P>,
}

impl<'a, P> GachaRecordSaver<'a, P>
where
  P: Fn(u64),
{
  pub fn new(
    records: &'a [GachaRecord],
    on_conflict: GachaRecordSaveOnConflict,
    progress_reporter: Option<P>,
  ) -> Self {
    Self {
      records,
      on_conflict,
      progress_reporter,
    }
  }

  #[tracing::instrument(skip_all)]
  pub async fn save(self, database: &Database) -> Result<u64, DatabaseError> {
    let Self {
      records,
      on_conflict,
      progress_reporter,
    } = self;

    let start = Instant::now();
    let len = records.len();
    info!(
      message = "Committing GachaRecord saver transaction",
      records = len,
      ?on_conflict,
      ?start
    );

    let mut txn = database.inner.begin().await?;
    let mut changes: u64 = 0;
    let mut completes: u64 = 0;

    for record in records {
      match on_conflict.as_query(record).execute(&mut *txn).await {
        Err(e) => {
          // Log error and rollback transaction
          error!(message = "Failed to save GachaRecord", ?record, ?e);
          txn.rollback().await?;
          return Err(e.into());
        }
        Ok(ret) => {
          // Count affected rows and report progress
          changes += ret.rows_affected();
          completes += 1;

          if let Some(reporter) = &progress_reporter {
            reporter(completes);
          }
        }
      }
    }

    // Commit transaction
    txn.commit().await?;

    info!(
      message = "GachaRecord saver transaction committed",
      elapsed = ?start.elapsed(),
      records = len,
      changes,
    );

    Ok(changes)
  }
}
