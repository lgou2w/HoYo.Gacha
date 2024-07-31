use std::path::PathBuf;

use serde::Deserialize;
use tauri::{Emitter, WebviewWindow};

use crate::database::{DatabaseState, GachaRecordOnConflict};
use crate::error::ErrorDetails;
use crate::models::{Business, BusinessRegion};

pub mod advanced;
mod data_folder_locator;
mod disk_cache;
mod gacha_url;

pub use data_folder_locator::*;
pub use gacha_url::*;

// region: Tauri plugin

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_locate_data_folder(
  business: Business,
  region: BusinessRegion,
  factory: DataFolderLocatorFactory,
) -> Result<Option<DataFolder>, DataFolderError> {
  <&dyn DataFolderLocator>::from(factory)
    .locate_data_folder(business, region)
    .await
}

#[tauri::command]
#[tracing::instrument(skip_all)]
pub async fn business_obtain_gacha_url(
  business: Business,
  region: BusinessRegion,
  data_folder: PathBuf,
  expected_uid: u32,
) -> Result<GachaUrl, GachaUrlError> {
  GachaUrl::obtain(&business, &region, &data_folder, expected_uid).await
}

#[derive(Debug, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateGachaRecordsFetcherChannelOptions {
  event_channel: Option<String>,
  save_to_database: Option<bool>,
  on_conflict: Option<GachaRecordOnConflict>,
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
) -> Result<(), Box<dyn ErrorDetails + 'static>> {
  let options = options.unwrap_or_default();

  let event_emit = options.event_channel.is_some();
  let event_channel = options.event_channel.unwrap_or_default();

  let save_to_database = options.save_to_database.unwrap_or_default();
  let on_conflict = options
    .on_conflict
    .unwrap_or(GachaRecordOnConflict::Nothing);

  use advanced::GachaRecordsFetcherChannelFragment as Fragment;
  advanced::create_gacha_records_fetcher_channel(
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
          use crate::database::{GachaRecordQuestioner, GachaRecordQuestionerAdditions};
          GachaRecordQuestioner::create_gacha_records(&database, records, on_conflict)
            .await
            .map_err(|error| Box::new(error.into_inner()) as _)?;
        }
      }

      Ok(())
    },
  )
  .await
  .map_err(|error| error as _)
}

// endregion
