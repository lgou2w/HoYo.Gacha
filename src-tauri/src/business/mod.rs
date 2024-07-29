use std::path::PathBuf;

use crate::models::{Business, BusinessRegion};

mod data_folder_locator;
mod disk_cache;
mod gacha_url;

pub use data_folder_locator::*;
pub use gacha_url::*;

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

#[tauri::command]
pub async fn business_obtain_gacha_url(
  business: Business,
  region: BusinessRegion,
  data_folder: PathBuf,
  expected_uid: u32,
) -> Result<GachaUrl, GachaUrlError> {
  GachaUrl::obtain(&business, &region, &data_folder, expected_uid).await
}

// endregion
