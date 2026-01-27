use std::collections::HashMap;

use hg_game_biz::{GachaLogEndpointType, Uid};
use hg_metadata::Metadata;
use hg_url_finder::parse::{ParsedGachaUrl, ParsedGachaUrlError};
use hg_url_scraper::requester::{GachaUrlRequestError, RetryOptions};
use hg_url_scraper::scraper::{GachaLogsScraper, GachaLogsScraperNotify};
use serde::{Deserialize, Serialize};
use snafu::{OptionExt, ResultExt, Snafu};
use tauri::ipc::Channel;
use tracing::{debug, info};

use crate::business::prettized::{
  HONKAI_STAR_RAIL_COLLABORATION_CHARACTER, HONKAI_STAR_RAIL_COLLABORATION_WEAPON,
  PrettizedCategory,
};
use crate::database::schemas::{
  AccountBusiness, GachaRecord, GachaRecordQuestioner, GachaRecordSaveOnConflict, GachaRecordSaver,
  JsonProperties,
};
use crate::database::{Database, DatabaseError};
use crate::error::{AppError, ErrorDetails};

#[derive(Debug, Snafu)]
#[snafu(visibility)]
pub enum FetchRecordError {
  #[snafu(display("Invalid {business:?} account uid: {value}"))]
  InvalidUid {
    business: AccountBusiness,
    value: u32,
  },

  #[snafu(display("{source}"))]
  Parse { source: ParsedGachaUrlError },

  #[snafu(display("{source}"))]
  Scrape { source: GachaUrlRequestError },

  #[snafu(display("Missing metadata entry: {business:?}, lang: {lang}, item name: {item_name}"))]
  MetadataEntry {
    business: AccountBusiness,
    lang: String,
    item_name: String,
  },

  #[snafu(display("{source}"))]
  Database { source: DatabaseError },
}

impl ErrorDetails for FetchRecordError {
  fn name(&self) -> &'static str {
    match self {
      Self::Parse { source } => source.name(),
      Self::Scrape { source } => source.name(),
      Self::Database { source } => source.name(),
      _ => stringify!(FetchRecordError),
    }
  }

  fn details(&self) -> Option<serde_json::Value> {
    use serde_json::json;

    match self {
      Self::InvalidUid { business, value } => Some(json!({
        "kind": stringify!(InvalidUid),
        "business": business,
        "value": value,
      })),
      Self::Parse { source } => source.details(),
      Self::Scrape { source } => source.details(),
      Self::MetadataEntry {
        business,
        lang,
        item_name,
      } => Some(json!({
        "kind": stringify!(MetadataEntry),
        "business": business,
        "lang": lang,
        "itemName": item_name,
      })),
      Self::Database { source } => source.details(),
    }
  }
}

#[derive(Copy, Clone, Debug, Default, Deserialize)]
pub enum GachaRecordSaveToDatabase {
  #[default]
  No,
  Yes,
  FullUpdate,
}

#[derive(Serialize)]
pub enum FetchEventPayload {
  Sleeping,
  Ready(Option<PrettizedCategory>),
  Pagination(usize),
  Data(usize),
  Completed(Option<PrettizedCategory>),
  Finished,
}

impl FetchEventPayload {
  pub(crate) fn from(business: AccountBusiness, value: GachaLogsScraperNotify<'_>) -> Self {
    match value {
      GachaLogsScraperNotify::Sleeping => Self::Sleeping,
      GachaLogsScraperNotify::Ready(gacha_type) => {
        Self::Ready(PrettizedCategory::from_gacha_type(business, gacha_type))
      }
      GachaLogsScraperNotify::Pagination(page) => Self::Pagination(page),
      GachaLogsScraperNotify::Data(data) => Self::Data(data.len()),
      GachaLogsScraperNotify::Completed(gacha_type) => {
        Self::Completed(PrettizedCategory::from_gacha_type(business, gacha_type))
      }
      GachaLogsScraperNotify::Finished => Self::Finished,
    }
  }
}

#[tracing::instrument(skip(database, metadata, event_channel))]
#[allow(clippy::too_many_arguments)]
pub async fn fetch(
  database: &Database,
  metadata: &dyn Metadata,
  business: AccountBusiness,
  uid: u32,
  gacha_url: String,
  mut gacha_type_and_last_end_ids: Vec<(u32, Option<&str>)>,
  event_channel: Channel<FetchEventPayload>,
  save_to_database: Option<GachaRecordSaveToDatabase>,
  save_on_conflict: Option<GachaRecordSaveOnConflict>,
) -> Result<i64, AppError<FetchRecordError>> {
  // First, Verify the uid
  let uid = Uid::validate(business.as_game(), uid).context(InvalidUidSnafu {
    business,
    value: uid,
  })?;

  // Second, Parse gacha url
  let url = ParsedGachaUrl::from_dirty(&gacha_url).context(ParseSnafu)?;
  info!("Fetching gacha records...");

  let save_to_database = save_to_database.unwrap_or_default();
  let save_on_conflict = save_on_conflict.unwrap_or_default();

  // The last_end_id value is discarded on full update
  if matches!(save_to_database, GachaRecordSaveToDatabase::FullUpdate) {
    for (_, last_end_id) in gacha_type_and_last_end_ids.iter_mut() {
      last_end_id.take();
    }
  }

  // Scrape...
  debug!("Scraping gacha logs...");
  let scraper = GachaLogsScraper::new(
    url,
    RetryOptions::default(),
    tokio::time::sleep,
    Some(Box::new(move |notify| {
      let _ = event_channel.send(FetchEventPayload::from(business, notify));
    })),
  );

  let logs = match business {
    AccountBusiness::GenshinImpact | AccountBusiness::ZenlessZoneZero => scraper
      .scrape(
        GachaLogEndpointType::Standard,
        &gacha_type_and_last_end_ids[..],
        None,
      )
      .await
      .context(ScrapeSnafu)?,
    AccountBusiness::MiliastraWonderland => scraper
      .scrape(
        GachaLogEndpointType::Beyond,
        &gacha_type_and_last_end_ids[..],
        None,
      )
      .await
      .context(ScrapeSnafu)?,
    AccountBusiness::HonkaiStarRail => {
      let mut standard = Vec::with_capacity(gacha_type_and_last_end_ids.len());
      let mut collaborations = Vec::with_capacity(2);

      for (gacha_type, last_end_id) in gacha_type_and_last_end_ids {
        if gacha_type == HONKAI_STAR_RAIL_COLLABORATION_CHARACTER
          || gacha_type == HONKAI_STAR_RAIL_COLLABORATION_WEAPON
        {
          collaborations.push((gacha_type, last_end_id));
        } else {
          standard.push((gacha_type, last_end_id));
        }
      }

      scraper
        .scrapes(
          vec![
            (GachaLogEndpointType::Standard, &standard[..]),
            (GachaLogEndpointType::Collaboration, &collaborations[..]),
          ],
          None,
        )
        .await
        .context(ScrapeSnafu)?
    }
  };

  if logs.is_empty() || matches!(save_to_database, GachaRecordSaveToDatabase::No) {
    return Ok(0);
  }

  // Convert official logs to schema
  let is_miliastra_wonderland = business == AccountBusiness::MiliastraWonderland;
  let mut records = Vec::with_capacity(logs.len());

  for log in logs {
    // FIXME: Transform lang
    let lang = log.lang.unwrap_or_else(|| scraper.url().lang.to_string());

    // HACK: Genshin Impact only
    //   Mandatory mapping of item ids.
    //   If metadata is outdated, this error will be thrown.
    let item_id = if let Some(item_id) = log.item_id {
      item_id
    } else {
      metadata
        .locale(business as _, &lang)
        .and_then(|locale| locale.entry_from_name_first(&log.item_name))
        .with_context(|| {
          tracing::error!(
            message = "Failed to map item name to item id, outdated metadata?",
            ?business,
            ?lang,
            ?log.id,
            ?log.item_name,
            ?log.gacha_type,
            ?log.rank_type,
          );

          MetadataEntrySnafu {
            business,
            lang: lang.clone(),
            item_name: log.item_name.clone(),
          }
        })?
        .item_id
    };

    // HACK: 'Genshin Impact: Miliastra Wonderland' needs to retain some special field values,
    //   which may be used in the future.
    let properties = if is_miliastra_wonderland {
      const KEY_SCHEDULE_ID: &str = "schedule_id";
      const KEY_IS_UP: &str = "is_up";
      const IS_UP_ZERO: &str = "0";

      let mut value = JsonProperties::default();

      if let Some(schedule_id) = log.schedule_id {
        value.insert(KEY_SCHEDULE_ID.into(), schedule_id.into());
      }

      // HACK: Only keep it if it is not "0".
      //   https://github.com/UIGF-org/UIGF-org.github.io/issues/108#issuecomment-3450043575
      if let Some(is_up) = log.is_up
        && is_up.as_str() != IS_UP_ZERO
      {
        value.insert(KEY_IS_UP.into(), is_up.into());
      }

      Some(value)
    } else {
      None
    };

    let record = GachaRecord {
      business,
      uid: uid.value(),
      id: log.id,
      gacha_type: log.gacha_type,
      gacha_id: log.gacha_id,
      rank_type: log.rank_type,
      count: log.count,
      lang,
      time: log.time.assume_offset(uid.game_biz().timezone()),
      item_name: log.item_name,
      item_type: log.item_type,
      item_id,
      properties,
    };

    records.push(record);
  }

  // Final, Save to database if necessary
  let changes = if matches!(save_to_database, GachaRecordSaveToDatabase::Yes) {
    // Save normally, create and add directly
    GachaRecordSaver::new(&records[..], save_on_conflict, Option::<fn(u64)>::None)
      .save(database)
      .await
      .context(DatabaseSnafu)? as i64
  } else if matches!(save_to_database, GachaRecordSaveToDatabase::FullUpdate) {
    // Full update, group by gacha_type, delete the oldest, recreate and add.
    let groups: HashMap<u32, Vec<_>> =
      records.into_iter().fold(HashMap::new(), |mut acc, record| {
        acc.entry(record.gacha_type).or_default().push(record);
        acc
      });

    let mut deleted = 0;
    let mut created = 0;

    for (gacha_type, group) in groups {
      if group.is_empty() {
        continue;
      }

      // SAFETY
      let oldest_end_id = group.last().map(|e| e.id.as_str()).unwrap();

      // Delete oldest
      deleted += database
        .delete_gacha_records_with_newer_than_end_id(
          business,
          uid.value(),
          gacha_type,
          oldest_end_id,
        )
        .await
        .context(DatabaseSnafu)? as i64;

      // Recreate and add
      created += GachaRecordSaver::new(&group[..], save_on_conflict, Option::<fn(u64)>::None)
        .save(database)
        .await
        .context(DatabaseSnafu)? as i64
    }

    // If the return value is negative, it means that there are duplicates or errors in the old data;
    // otherwise, it means that the data is newly added.
    created - deleted
  } else {
    // unreachable!()
    // See above
    0
  };

  Ok(changes)
}
