use crate::models::{Business, BusinessRegion};

mod data_folder_locator;

use data_folder_locator::*;

// region: Tauri plugin

#[tauri::command]
pub async fn business_locate_data_folder(
  business: Business,
  region: BusinessRegion,
  factory: DataFolderLocatorFactory,
) -> Result<Option<DataFolder>, DataFolderError> {
  <&dyn DataFolderLocator>::from(factory)
    .locate_data_folder(business, region)
    .await
}

// endregion
