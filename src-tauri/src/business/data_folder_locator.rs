use std::fmt::Debug;
use std::num::NonZeroIsize;
use std::path::PathBuf;

use async_trait::async_trait;
use raw_window_handle::{RawWindowHandle, Win32WindowHandle, WindowHandle};
use rfd::AsyncFileDialog;
use serde::{Deserialize, Serialize};
use tokio::fs::File as TokioFile;
use tokio::io::{AsyncBufReadExt, BufReader as TokioBufReader};
use tracing::{info, warn, Span};

use crate::bootstrap::internals;
use crate::consts;
use crate::error::declare_error_kinds;
use crate::models::{BizInternals, Business, BusinessRegion};

declare_error_kinds! {
  DataFolderError, kinds {
    #[error("Invalid data folder")]
    Invalid,

    #[error("Unity log file not found: {path}")]
    UnityLogFileNotFound { path: PathBuf },

    #[error("Error opening Unity log file: '{path}', cause: {cause}")]
    OpenUnityLogFile {
      path: PathBuf,
      cause: std::io::Error => serde_json::json!({
        "kind": format_args!("{}", cause.kind()),
        "message": format_args!("{cause}"),
      })
    },
  }
}

#[derive(Debug, Serialize)]
pub struct DataFolder {
  pub business: Business,
  pub region: BusinessRegion,
  pub value: PathBuf,
}

#[async_trait]
pub trait DataFolderLocator {
  async fn locate_data_folder(
    &self,
    business: Business,
    region: BusinessRegion,
  ) -> Result<Option<DataFolder>, DataFolderError>;
}

// region: Unity log

#[derive(Debug)]
pub struct UnityLogDataFolderLocator;

#[async_trait]
impl DataFolderLocator for UnityLogDataFolderLocator {
  #[tracing::instrument(fields(log_path, keyword))]
  async fn locate_data_folder(
    &self,
    business: Business,
    region: BusinessRegion,
  ) -> Result<Option<DataFolder>, DataFolderError> {
    info!("Locating the data folder...");

    let biz = BizInternals::mapped(business, region);

    let log_filename = if biz.business == Business::GenshinImpact {
      "output_log.txt"
    } else {
      "Player.log"
    };

    let appdata_folder = if biz.business == Business::GenshinImpact || biz.is_official() {
      &*consts::PLATFORM.appdata_locallow_mihoyo
    } else {
      &*consts::PLATFORM.appdata_locallow_cognosphere
    };

    let span = Span::current();
    let log_path = appdata_folder.join(biz.display_name).join(log_filename);
    span.record("log_path", log_path.to_str());

    if !log_path.is_file() {
      warn!("Unity log file not found");
      return Err(DataFolderErrorKind::UnityLogFileNotFound { path: log_path })?;
    }

    let keyword = biz.data_folder_name;
    let keyword_len = keyword.len();
    span.record("keyword", keyword);

    info!("Try to find the keyword from the log file");
    let log_file = TokioFile::options()
      .read(true)
      .open(&log_path)
      .await
      .map_err(|cause| DataFolderErrorKind::OpenUnityLogFile {
        path: log_path,
        cause,
      })?;

    let log_file_reader = TokioBufReader::new(log_file);
    let mut lines = log_file_reader.lines();
    while let Ok(Some(line)) = lines.next_line().await {
      if line.len() <= keyword_len || !line.contains(keyword) {
        continue;
      }

      if let Some(colon) = line.rfind(':') {
        if let Some(end) = line.find(keyword) {
          // &line[colon - 1..end + keyword_len]; // UNSAFE!
          if let Some(slice) = line.get(colon - 1..end + keyword_len) {
            let data_folder = PathBuf::from(slice);
            info!("Located in the data folder: {data_folder:?}");

            // Test this data folder for validity
            match data_folder.parent() {
              None => return Err(DataFolderErrorKind::Invalid)?,
              Some(parent) => {
                let executable_file = biz.join_executable_file(parent);
                if !executable_file.is_file() {
                  warn!("No valid game executable file found: {executable_file:?}");
                  return Err(DataFolderErrorKind::Invalid)?;
                }
              }
            };

            return Ok(Some(DataFolder {
              business,
              region,
              value: data_folder,
            }));
          }
        }
      }
    }

    warn!("Not locating the data folder from the keyword");
    Ok(None)
  }
}

// endregion

// region: Manual

#[derive(Debug)]
pub struct ManualDataFolderLocator;

#[async_trait]
impl DataFolderLocator for ManualDataFolderLocator {
  #[tracing::instrument]
  async fn locate_data_folder(
    &self,
    business: Business,
    region: BusinessRegion,
  ) -> Result<Option<DataFolder>, DataFolderError> {
    info!("Manually locate the data folder...");

    let biz = BizInternals::mapped(business, region);

    let title = if crate::consts::LOCALE.is_chinese {
      format!(
        "请选择 {} 的游戏数据目录：{}",
        biz.display_name, biz.data_folder_name
      )
    } else {
      format!(
        "Please select the game data folder for {}: {}",
        biz.display_name, biz.data_folder_name
      )
    };

    let mut rfd = AsyncFileDialog::new()
      .set_directory(&consts::PLATFORM.user_home)
      .set_title(title);

    #[cfg(windows)]
    {
      let hwnd = internals::get_tauri_main_window_hwnd();
      if hwnd != 0 {
        let hwnd = NonZeroIsize::new(hwnd).unwrap();
        let raw_window_handle = RawWindowHandle::Win32(Win32WindowHandle::new(hwnd));
        let window_handle = unsafe { WindowHandle::borrow_raw(raw_window_handle) };
        rfd = rfd.set_parent(&window_handle);
      }
    }

    let maybe_data_folder: PathBuf = match rfd.pick_folder().await {
      Some(folder) => folder.into(),
      None => {
        warn!("No data folder is selected");
        return Ok(None);
      }
    };

    // If the game folder is selected, then test if the executable file exists,
    // then just add the data folder
    let executable_file = biz.join_executable_file(&maybe_data_folder);
    if executable_file.is_file() {
      let data_folder = maybe_data_folder.join(biz.data_folder_name);
      info!("Selected data folder: {data_folder:?}");
      return Ok(Some(DataFolder {
        business,
        region,
        value: data_folder,
      }));
    }

    // Otherwise, test for the existence of executable file
    // in the parent folder of this folder. Then it is valid.
    match maybe_data_folder.parent() {
      None => return Err(DataFolderErrorKind::Invalid)?,
      Some(parent) => {
        let executable_file = biz.join_executable_file(parent);
        if !executable_file.is_file() {
          warn!("No valid game executable file found: {executable_file:?}");
          return Err(DataFolderErrorKind::Invalid)?;
        }
      }
    };

    info!("Selected data folder: {maybe_data_folder:?}");
    Ok(Some(DataFolder {
      business,
      region,
      value: maybe_data_folder,
    }))
  }
}

// endregion

// region: Registry

#[cfg(windows)]
#[derive(Debug)]
pub struct RegistryDataFolderLocator;

#[cfg(windows)]
#[async_trait]
impl DataFolderLocator for RegistryDataFolderLocator {
  #[tracing::instrument]
  async fn locate_data_folder(
    &self,
    business: Business,
    region: BusinessRegion,
  ) -> Result<Option<DataFolder>, DataFolderError> {
    // TODO: Locating data folder in the Registry
    unimplemented!()
  }
}

// endreigon

#[derive(Debug, Deserialize)]
pub enum DataFolderLocatorFactory {
  UnityLog,
  Manual,
  #[cfg(windows)]
  Registry,
}

impl From<DataFolderLocatorFactory> for &dyn DataFolderLocator {
  fn from(value: DataFolderLocatorFactory) -> Self {
    match value {
      DataFolderLocatorFactory::UnityLog => &UnityLogDataFolderLocator,
      DataFolderLocatorFactory::Manual => &ManualDataFolderLocator,
      #[cfg(windows)]
      DataFolderLocatorFactory::Registry => &RegistryDataFolderLocator,
    }
  }
}
