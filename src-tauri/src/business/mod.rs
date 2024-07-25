use tauri::plugin::{Builder as TauriPluginBuilder, TauriPlugin};
use tauri::{generate_handler, Runtime};

use crate::consts;
use crate::models::{Business, BusinessRegion};

mod data_folder_locator;

use data_folder_locator::*;

// region: Tauri plugin

#[tauri::command]
pub async fn locate_data_folder(
  business: Business,
  region: BusinessRegion,
  factory: DataFolderLocatorFactory,
) -> Result<Option<DataFolder>, DataFolderError> {
  <&dyn DataFolderLocator>::from(factory)
    .locate_data_folder(business, region)
    .await
}

pub fn tauri_plugin<R: Runtime>() -> TauriPlugin<R> {
  TauriPluginBuilder::new(consts::TAURI_PLUGIN_BUSINESS)
    .invoke_handler(generate_handler![locate_data_folder])
    .build()
}

// endregion
