use std::fmt::Debug;
use std::path::PathBuf;

use async_trait::async_trait;
use cfg_if::cfg_if;
use serde::{Deserialize, Serialize};
use tokio::fs::File as TokioFile;
use tokio::io::{AsyncBufReadExt, BufReader as TokioBufReader};
use tracing::{Span, info, warn};

use crate::consts;
use crate::error::declare_error_kinds;
use crate::models::{BizInternals, Business, BusinessRegion};
use crate::utilities::file_dialog;

declare_error_kinds! {
  #[derive(Debug, thiserror::Error)]
  DataFolderError {
    #[error("Invalid data folder")]
    Invalid,

    #[error("Unity log file not found: {path}")]
    UnityLogFileNotFound { path: PathBuf },

    #[error("Error opening Unity log file: '{path}', cause: {cause}")]
    OpenUnityLogFile {
      path: PathBuf,
      cause: std::io::Error => serde_json::json!({
        "kind": cause.kind().to_string(),
        "message": cause.to_string(),
      })
    },

    #[error("Data folder is vacant")]
    Vacant,
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
  ) -> Result<DataFolder, DataFolderError>;
}

// region: Unity log

#[derive(Debug, Deserialize)]
pub struct UnityLogDataFolderLocator;

#[async_trait]
impl DataFolderLocator for UnityLogDataFolderLocator {
  #[tracing::instrument(fields(log_path, keyword))]
  async fn locate_data_folder(
    &self,
    business: Business,
    region: BusinessRegion,
  ) -> Result<DataFolder, DataFolderError> {
    info!("Locating the data folder...");

    let biz = BizInternals::mapped(business, region);

    let log_filename = if matches!(
      biz.business,
      Business::GenshinImpact | Business::MiliastraWonderland
    ) {
      "output_log.txt"
    } else {
      "Player.log"
    };

    let appdata_folder = if biz.is_official()
      || matches!(
        biz.business,
        Business::GenshinImpact | Business::MiliastraWonderland | Business::ZenlessZoneZero
      ) {
      &*consts::PLATFORM.appdata_locallow_mihoyo
    } else {
      &*consts::PLATFORM.appdata_locallow_cognosphere
    };

    let span = Span::current();
    let log_path = appdata_folder
      .join(biz.appdata_folder_subname())
      .join(log_filename);

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

            return Ok(DataFolder {
              business,
              region,
              value: data_folder,
            });
          }
        }
      }
    }

    warn!("Not locating the data folder from the keyword");
    Err(DataFolderErrorKind::Vacant)?
  }
}

// endregion

// region: Manual

#[derive(Debug, Deserialize)]
pub struct ManualDataFolderLocator {
  pub title: String,
}

#[async_trait]
impl DataFolderLocator for ManualDataFolderLocator {
  #[tracing::instrument]
  async fn locate_data_folder(
    &self,
    business: Business,
    region: BusinessRegion,
  ) -> Result<DataFolder, DataFolderError> {
    info!("Manually locate the data folder...");

    let biz = BizInternals::mapped(business, region);
    let rfd = file_dialog::create()
      .set_directory(&consts::PLATFORM.user_home)
      .set_title(format!("{}: {}", &self.title, biz.data_folder_name));

    let maybe_data_folder: PathBuf = match rfd.pick_folder().await {
      Some(folder) => folder.into(),
      None => {
        warn!("No data folder is selected");
        return Err(DataFolderErrorKind::Vacant)?;
      }
    };

    // If the game folder is selected, then test if the executable file exists,
    // then just add the data folder
    let executable_file = biz.join_executable_file(&maybe_data_folder);
    if executable_file.is_file() {
      let data_folder = maybe_data_folder.join(biz.data_folder_name);
      info!("Selected data folder: {data_folder:?}");
      return Ok(DataFolder {
        business,
        region,
        value: data_folder,
      });
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
    Ok(DataFolder {
      business,
      region,
      value: maybe_data_folder,
    })
  }
}

// endregion

// region: Registry

cfg_if! {if #[cfg(windows)] {
  #[derive(Debug, Deserialize)]
  pub struct RegistryDataFolderLocator;

  #[async_trait]
  impl DataFolderLocator for RegistryDataFolderLocator {
    #[tracing::instrument]
    async fn locate_data_folder(
      &self,
      _business: Business,
      _region: BusinessRegion,
    ) -> Result<DataFolder, DataFolderError> {
      // TODO: Locating data folder in the Registry
      unimplemented!()
    }
  }
}}

// endreigon

#[derive(Debug, Deserialize)]
pub enum DataFolderLocatorFactory {
  UnityLog(UnityLogDataFolderLocator),
  Manual(ManualDataFolderLocator),
  #[cfg(windows)]
  Registry(RegistryDataFolderLocator),
}

#[async_trait]
impl DataFolderLocator for DataFolderLocatorFactory {
  async fn locate_data_folder(
    &self,
    business: Business,
    region: BusinessRegion,
  ) -> Result<DataFolder, DataFolderError> {
    macro_rules! proxies {
      ($($t:ident),*) => {
        match self {
          $(
            Self::$t(inner) => inner.locate_data_folder(business, region).await,
          )*
        }
      }
    }

    proxies! { UnityLog, Manual, Registry }
  }
}
