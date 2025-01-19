use std::path::PathBuf;

use serde::Deserialize;
use tauri::{Emitter, WebviewWindow};
use tokio::sync::mpsc;

use crate::database::{
  DatabaseState, GachaRecordOnConflict, GachaRecordQuestioner, GachaRecordQuestionerAdditions,
};
use crate::error::{Error, ErrorDetails};
use crate::models::{Business, BusinessRegion};

mod advanced;
mod data_folder_locator;
mod disk_cache;
mod gacha_convert;
mod gacha_metadata;
mod gacha_prettied;
mod gacha_url;

pub use advanced::*;
pub use data_folder_locator::*;
pub use gacha_convert::*;
pub use gacha_metadata::*;
pub use gacha_prettied::*;
pub use gacha_url::*;

// region: Tauri plugin

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_locate_data_folder(
  business: Business,
  region: BusinessRegion,
  factory: DataFolderLocatorFactory,
) -> Result<DataFolder, DataFolderError> {
  <&dyn DataFolderLocator>::from(factory)
    .locate_data_folder(business, region)
    .await
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

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateGachaRecordsFetcherChannelOptions {
  event_channel: Option<String>,
  save_to_database: Option<bool>,
  save_on_conflict: Option<GachaRecordOnConflict>,
}

#[allow(clippy::too_many_arguments)]
#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_create_gacha_records_fetcher_channel(
  window: WebviewWindow,
  database: DatabaseState<'_>,
  business: Business,
  region: BusinessRegion,
  uid: u32,
  gacha_url: String,
  gacha_type_and_last_end_id_mappings: Vec<(u32, Option<String>)>,
  options: Option<CreateGachaRecordsFetcherChannelOptions>,
) -> Result<(), Box<dyn ErrorDetails + Send + 'static>> {
  let options = options.unwrap_or_default();

  let event_channel = options.event_channel.unwrap_or_default();
  let event_emit = !event_channel.is_empty();

  let save_to_database = options.save_to_database.unwrap_or_default();
  let save_on_conflict = options
    .save_on_conflict
    .unwrap_or(GachaRecordOnConflict::Nothing);

  use GachaRecordsFetcherChannelFragment as Fragment;
  create_gacha_records_fetcher_channel(
    business,
    region,
    uid,
    gacha_url,
    gacha_type_and_last_end_id_mappings,
    |fragment| async {
      // FIXME: emit SAFETY?
      if event_emit {
        // If the fragment is the actual records data, then just send the length
        if let Fragment::Data(records) = &fragment {
          window
            .emit(&event_channel, &Fragment::DataRef(records.len()))
            .unwrap();
        } else {
          window.emit(&event_channel, &fragment).unwrap();
        }
      }

      if save_to_database {
        if let Fragment::Data(records) = fragment {
          GachaRecordQuestioner::create_gacha_records(&database, records, save_on_conflict, None)
            .await
            .map_err(Error::boxed)?;
        }
      }

      Ok(())
    },
  )
  .await
}

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_import_gacha_records(
  window: WebviewWindow,
  database: DatabaseState<'_>,
  input: PathBuf,
  importer: GachaRecordsImporter,
  save_on_conflict: Option<GachaRecordOnConflict>,
  progress_channel: Option<String>,
) -> Result<u64, Box<dyn ErrorDetails + Send + 'static>> {
  let records = importer.import(GachaMetadata::embedded(), input)?;

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
    save_on_conflict.unwrap_or(GachaRecordOnConflict::Nothing),
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
  window: WebviewWindow,
  database: DatabaseState<'_>,
  output: PathBuf,
  exporter: GachaRecordsExporter,
) -> Result<(), Box<dyn ErrorDetails + Send + 'static>> {
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
  };

  exporter.export(GachaMetadata::embedded(), records, output)
}

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_find_and_pretty_gacha_records(
  database: DatabaseState<'_>,
  business: Business,
  uid: u32,
) -> Result<PrettiedGachaRecords, Box<dyn ErrorDetails + Send + 'static>> {
  let records =
    GachaRecordQuestioner::find_gacha_records_by_business_and_uid(database.as_ref(), business, uid)
      .await
      .map_err(Error::boxed)?;

  let prettied =
    PrettiedGachaRecords::pretty(GachaMetadata::embedded(), business, uid, &records[..])
      .map_err(Error::boxed)?;

  Ok(prettied)
}

// endregion
