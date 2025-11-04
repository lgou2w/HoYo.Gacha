use std::collections::{HashMap, hash_map};
use std::path::PathBuf;

use serde::Deserialize;
use tauri::{Emitter, WebviewWindow};
use time::format_description::FormatItem;
use time::macros::format_description;
use tokio::sync::mpsc;

use crate::database::{
  DatabaseState, GachaRecordQuestioner, GachaRecordQuestionerAdditions, GachaRecordSaveOnConflict,
};
use crate::error::{BoxDynErrorDetails, Error};
use crate::models::{Business, BusinessRegion, GachaRecord};

mod data_folder_locator;
mod disk_cache;
mod gacha_convert;
mod gacha_fetcher;
mod gacha_metadata;
mod gacha_prettied;
mod gacha_url;

pub use data_folder_locator::*;
pub use gacha_convert::*;
pub use gacha_fetcher::*;
pub use gacha_metadata::*;
pub use gacha_prettied::*;
pub use gacha_url::*;

pub const GACHA_TIME_FORMAT: &[FormatItem<'_>] =
  format_description!("[year]-[month]-[day] [hour]:[minute]:[second]");

time::serde::format_description!(pub gacha_time_format, PrimitiveDateTime, GACHA_TIME_FORMAT);

// region: Tauri plugin

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_locate_data_folder(
  business: Business,
  region: BusinessRegion,
  factory: DataFolderLocatorFactory,
) -> Result<DataFolder, DataFolderError> {
  factory.locate_data_folder(business, region).await
}

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_from_webcaches_gacha_url(
  business: Business,
  region: BusinessRegion,
  data_folder: PathBuf,
  expected_uid: u32,
) -> Result<GachaUrl, GachaUrlError> {
  GachaUrl::from_webcaches(business, region, &data_folder, expected_uid).await
}

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_from_dirty_gacha_url(
  business: Business,
  region: BusinessRegion,
  dirty_url: String,
  expected_uid: u32,
) -> Result<GachaUrl, GachaUrlError> {
  GachaUrl::from_dirty(business, region, dirty_url, expected_uid).await
}

#[derive(Copy, Clone, Debug, Deserialize)]
pub enum GachaRecordSaveToDatabase {
  No,
  Yes,
  FullUpdate,
}

#[allow(clippy::too_many_arguments)]
#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_create_gacha_records_fetcher(
  window: WebviewWindow,
  database: DatabaseState<'_>,
  business: Business,
  region: BusinessRegion,
  uid: u32,
  gacha_url: String,
  mut gacha_type_and_last_end_id_mappings: Vec<(u32, Option<String>)>,
  event_channel: Option<String>,
  save_to_database: Option<GachaRecordSaveToDatabase>,
  save_on_conflict: Option<GachaRecordSaveOnConflict>,
) -> Result<i64, BoxDynErrorDetails> {
  let save_to_database = save_to_database.unwrap_or(GachaRecordSaveToDatabase::No);
  let save_on_conflict = save_on_conflict.unwrap_or(GachaRecordSaveOnConflict::Nothing);

  // The last_end_id value is discarded on full update
  if matches!(save_to_database, GachaRecordSaveToDatabase::FullUpdate) {
    for (_, last_end_id) in gacha_type_and_last_end_id_mappings.iter_mut() {
      last_end_id.take();
    }
  }

  let records = create_gacha_records_fetcher(
    business,
    region,
    uid,
    gacha_url,
    gacha_type_and_last_end_id_mappings,
    window,
    event_channel,
  )
  .await?
  .unwrap_or(Vec::new());

  if records.is_empty() {
    return Ok(0);
  }

  match save_to_database {
    GachaRecordSaveToDatabase::No => Ok(0),
    GachaRecordSaveToDatabase::Yes => {
      let changes =
        GachaRecordQuestioner::create_gacha_records(&database, records, save_on_conflict, None)
          .await
          .map_err(Error::boxed)? as i64;

      Ok(changes)
    }
    GachaRecordSaveToDatabase::FullUpdate => {
      let groups: HashMap<u32, Vec<GachaRecord>> =
        records.into_iter().fold(HashMap::new(), |mut acc, record| {
          match acc.entry(record.gacha_type) {
            hash_map::Entry::Occupied(mut o) => {
              o.get_mut().push(record);
            }
            hash_map::Entry::Vacant(o) => {
              o.insert(vec![record]);
            }
          }
          acc
        });

      let mut deleted: i64 = 0;
      let mut created: i64 = 0;

      for (gacha_type, records) in groups {
        if records.is_empty() {
          continue;
        }

        let oldest_end_id = records.last().map(|record| record.id.as_str()).unwrap();

        deleted += GachaRecordQuestioner::delete_gacha_records_by_newer_than_end_id(
          &database,
          business,
          uid,
          gacha_type,
          oldest_end_id,
        )
        .await
        .map_err(Error::boxed)? as i64;

        created +=
          GachaRecordQuestioner::create_gacha_records(&database, records, save_on_conflict, None)
            .await
            .map_err(Error::boxed)? as i64;
      }

      let changes = created - deleted;

      Ok(changes)
    }
  }
}

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_import_gacha_records(
  window: WebviewWindow,
  database: DatabaseState<'_>,
  input: PathBuf,
  importer: GachaRecordsImporter,
  save_on_conflict: Option<GachaRecordSaveOnConflict>,
  progress_channel: Option<String>,
) -> Result<u64, BoxDynErrorDetails> {
  let records = importer.import(GachaMetadata::current(), input)?;

  // Progress reporting
  let (progress_reporter, progress_task) = if let Some(event_channel) = progress_channel {
    let (reporter, mut receiver) = mpsc::channel(1);
    let task = tokio::spawn(async move {
      while let Some(progress) = receiver.recv().await {
        window.emit(&event_channel, &progress).unwrap(); // FIXME: emit SAFETY?
      }
    });

    (Some(reporter), Some(task))
  } else {
    (None, None)
  };

  let changes = GachaRecordQuestioner::create_gacha_records(
    database.as_ref(),
    records,
    save_on_conflict.unwrap_or(GachaRecordSaveOnConflict::Nothing),
    progress_reporter,
  )
  .await
  .map_err(Error::boxed)?;

  // Wait for the progress task to finish
  if let Some(progress_task) = progress_task {
    progress_task.await.unwrap(); // FIXME: SAFETY?
  }

  Ok(changes)
}

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_export_gacha_records(
  _window: WebviewWindow,
  database: DatabaseState<'_>,
  output: PathBuf,
  exporter: GachaRecordsExporter,
) -> Result<PathBuf, BoxDynErrorDetails> {
  // TODO: Progress reporting

  let records = match &exporter {
    GachaRecordsExporter::LegacyUigf(writer) => {
      GachaRecordQuestioner::find_gacha_records_by_business_and_uid(
        database.as_ref(),
        Business::GenshinImpact,
        writer.account_uid,
      )
      .await
      .map_err(Error::boxed)?
    }
    GachaRecordsExporter::Uigf(writer) => {
      let mut records = Vec::new();

      for account_uid in writer.accounts.keys() {
        let account_records = GachaRecordQuestioner::find_gacha_records_by_businesses_or_uid(
          database.as_ref(),
          writer.businesses.as_ref(),
          *account_uid,
        )
        .await
        .map_err(Error::boxed)?;

        records.extend(account_records);
      }

      records
    }
    GachaRecordsExporter::Srgf(writer) => {
      GachaRecordQuestioner::find_gacha_records_by_business_and_uid(
        database.as_ref(),
        Business::HonkaiStarRail,
        writer.account_uid,
      )
      .await
      .map_err(Error::boxed)?
    }
    GachaRecordsExporter::Csv(writer) => {
      GachaRecordQuestioner::find_gacha_records_by_business_and_uid(
        database.as_ref(),
        writer.business,
        writer.account_uid,
      )
      .await
      .map_err(Error::boxed)?
    }
  };

  exporter.export(GachaMetadata::current(), records, output)
}

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_find_and_pretty_gacha_records(
  database: DatabaseState<'_>,
  business: Business,
  uid: u32,
  custom_locale: Option<String>,
) -> Result<PrettiedGachaRecords, BoxDynErrorDetails> {
  let records =
    GachaRecordQuestioner::find_gacha_records_by_business_and_uid(database.as_ref(), business, uid)
      .await
      .map_err(Error::boxed)?;

  let prettied = PrettiedGachaRecords::pretty(
    GachaMetadata::current(),
    business,
    uid,
    &records[..],
    custom_locale.as_deref(),
  );
  // .map_err(Error::boxed)?;

  Ok(prettied)
}

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_gacha_metadata_is_updating() -> bool {
  GachaMetadata::is_updating()
}

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_gacha_metadata_update() -> Result<GachaMetadataUpdatedKind, String> {
  GachaMetadata::update().await.map_err(|e| e.to_string())
}

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_gacha_metadata_item_name_from_id(
  business: Business,
  item_id: u32,
  locale: String,
) -> Option<String> {
  GachaMetadata::current()
    .locale(business, locale)?
    .entry_from_id(item_id)
    .map(|entry| entry.name.to_owned())
}

// endregion
