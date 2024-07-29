use std::env;
use std::fmt::Debug;
use std::path::PathBuf;

use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use tokio::fs::File as TokioFile;
use tokio::io::{AsyncBufReadExt, BufReader as TokioBufReader};
use tracing::{info, warn, Span};

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
        "message": cause.to_string(),
      })
    },
  }
}

#[derive(Debug, Serialize)]
pub struct DataFolder {
  pub business: Business,
  pub region: BusinessRegion,
  pub folder: PathBuf,
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

    let biz = BizInternals::mapped(&business, &region);

    let log_filename = if biz.business == &Business::GenshinImpact {
      "output_log.txt"
    } else {
      "Player.log"
    };

    let appdata_folder = if biz.business == &Business::GenshinImpact || biz.is_official() {
      &*consts::PLATFORM.appdata_locallow_mihoyo
    } else {
      &*consts::PLATFORM.appdata_locallow_cognosphere
    };

    let span = Span::current();
    let log_path = appdata_folder.join(biz.displayname).join(log_filename);
    span.record("log_path", log_path.to_str());

    if !log_path.exists() || !log_path.is_file() {
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

            match data_folder.parent() {
              None => return Err(DataFolderErrorKind::Invalid)?,
              Some(parent) => {
                let mut executable = parent.join(biz.executable_name);
                executable.set_extension(env::consts::EXE_EXTENSION);

                if !executable.exists() || !executable.is_file() {
                  warn!("No valid game executable file found");
                  return Err(DataFolderErrorKind::Invalid)?;
                }
              }
            };

            return Ok(Some(DataFolder {
              business,
              region,
              folder: data_folder,
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
  #[cfg(windows)]
  Registry,
}

impl From<DataFolderLocatorFactory> for &dyn DataFolderLocator {
  fn from(value: DataFolderLocatorFactory) -> Self {
    match value {
      DataFolderLocatorFactory::UnityLog => &UnityLogDataFolderLocator,
      #[cfg(windows)]
      DataFolderLocatorFactory::Registry => &RegistryDataFolderLocator,
    }
  }
}
