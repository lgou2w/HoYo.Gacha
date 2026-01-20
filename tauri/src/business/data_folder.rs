use std::io;
use std::path::{Path, PathBuf};

use hg_game_biz::Uid;
use serde::{Deserialize, Serialize};
use snafu::{OptionExt, ResultExt, Snafu};
use tokio::fs::File as TokioFile;
use tokio::io::{AsyncBufReadExt, BufReader as TokioBufReader};
use tracing::{debug, info, warn};

use crate::constants;
use crate::database::schemas::AccountBusiness;
use crate::error::ErrorDetails;

#[derive(Clone, Debug, Serialize)]
pub struct DataFolder {
  pub business: AccountBusiness,
  pub value: PathBuf,
}

#[derive(Debug, Snafu)]
pub enum LocateDataFolderError {
  #[snafu(display("Invalid {business:?} account uid: {value}"))]
  InvalidUid {
    business: AccountBusiness,
    value: u32,
  },

  #[snafu(display("Unity log file not found: {}", path.display()))]
  UnityLogNotFound { path: PathBuf },

  #[snafu(display("Failed to opening Unity log file: '{}', cause: {source}", path.display()))]
  OpenUnityLog { path: PathBuf, source: io::Error },

  #[snafu(display("Invalid data folder"))]
  Invalid,

  #[snafu(display("Data folder is vacant"))]
  Vacant,
}

impl ErrorDetails for LocateDataFolderError {
  fn name(&self) -> &'static str {
    stringify!(LocateDataFolderError)
  }

  fn details(&self) -> Option<serde_json::Value> {
    use serde_json::json;

    Some(match self {
      Self::InvalidUid { business, value } => json!({
        "kind": stringify!(InvalidUid),
        "business": business,
        "value": value,
      }),
      Self::UnityLogNotFound { path } => json!({
        "kind": stringify!(UnityLogNotFound),
        "path": format_args!("{}", path.display())
      }),
      Self::OpenUnityLog { path, source } => json!({
        "kind": stringify!(OpenUnityLog),
        "path": format_args!("{}", path.display()),
        "cause": {
          "kind": format_args!("{:?}", source.kind()),
          "message": source.to_string(),
        }
      }),
      Self::Invalid => json!({
        "kind": stringify!(Invalid)
      }),
      Self::Vacant => json!({
        "kind": stringify!(Vacant)
      }),
    })
  }
}

pub trait DataFolderLocator {
  async fn locate(
    &self,
    business: AccountBusiness,
    uid: u32,
  ) -> Result<DataFolder, LocateDataFolderError>;
}

#[inline]
fn join_executable_file(folder: &Path, bin_name: &str) -> PathBuf {
  let mut executable = folder.join(bin_name);
  executable.set_extension(std::env::consts::EXE_EXTENSION);
  executable
}

// region: UnityLog

#[derive(Debug, Deserialize)]
pub struct UnityLogDataFolderLocator;

impl DataFolderLocator for UnityLogDataFolderLocator {
  #[tracing::instrument]
  async fn locate(
    &self,
    business: AccountBusiness,
    uid: u32,
  ) -> Result<DataFolder, LocateDataFolderError> {
    // First, Verify the uid
    let uid = Uid::validate(business.as_game(), uid).context(InvalidUidSnafu {
      business,
      value: uid,
    })?;

    info!("Locating the data folder form Unity log...");

    // Only Genshin Impact and Miliastra Wonderland use output_log.txt
    const LOG_OUTPUT: &str = "output_log.txt";
    const LOG_PLAYER: &str = "Player.log";
    let log_filename = if matches!(
      business,
      AccountBusiness::GenshinImpact | AccountBusiness::MiliastraWonderland
    ) {
      LOG_OUTPUT
    } else {
      LOG_PLAYER
    };

    // Only Official servers and the following games use miHoYo company folder
    const COMPANY_MIHOYO: &str = "miHoYo";
    const COMPANY_COGNOSPHERE: &str = "Cognosphere";
    let company_dir = if uid.game_biz().is_official()
      || matches!(
        business,
        AccountBusiness::GenshinImpact
          | AccountBusiness::MiliastraWonderland
          | AccountBusiness::ZenlessZoneZero
      ) {
      constants::LOCALLOW_DATA_DIR.join(COMPANY_MIHOYO)
    } else {
      constants::LOCALLOW_DATA_DIR.join(COMPANY_COGNOSPHERE)
    };

    // APPDATA/LocalLow/${company_dir}/${game_dir}
    let company_game_dir =
      if uid.game_biz().is_oversea() && business == AccountBusiness::ZenlessZoneZero {
        // See: https://github.com/lgou2w/HoYo.Gacha/pull/90
        // Thanks @lim1202
        company_dir.join(uid.game_biz().bin_name()) // -> ZenlessZoneZero
      } else {
        company_dir.join(uid.game_biz().display_name()) // Full name of the game
      };

    let log_file = company_game_dir.join(log_filename);
    if !log_file.is_file() {
      warn!(message = "Unity log file not found", ?log_file);
      return Err(UnityLogNotFoundSnafu { path: log_file }.build());
    }

    let keyword = uid.game_biz().data_folder_name();
    let keyword_len = keyword.len();

    debug!(
      message = "Try to find the keyword from the log file",
      ?keyword,
      ?log_file
    );

    let log_file = TokioFile::options()
      .read(true)
      .open(&log_file)
      .await
      .context(OpenUnityLogSnafu { path: log_file })?;

    let mut log_lines = TokioBufReader::new(log_file).lines();
    while let Ok(Some(line)) = log_lines.next_line().await {
      if line.len() <= keyword_len || !line.contains(keyword) {
        continue;
      }

      if let Some(colon) = line.rfind(':')
        && let Some(end) = line.find(keyword)
        && let Some(slice) = line.get(colon - 1..end + keyword_len)
      {
        let data_folder = PathBuf::from(slice);

        // Test this data folder for validity
        match data_folder.parent() {
          None => InvalidSnafu.fail()?,
          Some(parent) => {
            let executable = join_executable_file(parent, uid.game_biz().bin_name());
            if !executable.is_file() {
              warn!("No valid game executable file found: {executable:?}");
              InvalidSnafu.fail()?
            }
          }
        }

        info!("Located in the data folder: {data_folder:?}");
        return Ok(DataFolder {
          business,
          value: data_folder,
        });
      }
    }

    warn!("Not locating the data folder from the keyword: {keyword}");
    VacantSnafu.fail()
  }
}

// endregion

// region: Manual

#[derive(Debug, Deserialize)]
pub struct ManualDataFolderLocator {
  pub title: String,
}

impl DataFolderLocator for ManualDataFolderLocator {
  #[tracing::instrument]
  async fn locate(
    &self,
    business: AccountBusiness,
    uid: u32,
  ) -> Result<DataFolder, LocateDataFolderError> {
    // First, Verify the uid
    let uid = Uid::validate(business.as_game(), uid).context(InvalidUidSnafu {
      business,
      value: uid,
    })?;

    info!("Manually locate the data folder...");
    let rfd = hg_ffi::file_dialog(None)
      .set_directory(&*constants::PROFILE_DIR)
      .set_title(format!(
        "{}: {}",
        self.title,
        uid.game_biz().data_folder_name()
      ));

    let maybe_data_folder: PathBuf = match rfd.pick_folder().await {
      Some(folder) => folder.into(),
      None => {
        warn!("No data folder is selected");
        VacantSnafu.fail()?
      }
    };

    // If the game folder is selected, then test if the executable file exists,
    // then just add the data folder
    let executable = join_executable_file(&maybe_data_folder, uid.game_biz().bin_name());
    if executable.is_file() {
      let data_folder = maybe_data_folder.join(uid.game_biz().data_folder_name());
      info!("Selected data folder: {data_folder:?}");
      return Ok(DataFolder {
        business,
        value: data_folder,
      });
    }

    // Otherwise, test for the existence of executable file
    // in the parent folder of this folder. Then it is valid.
    match maybe_data_folder.parent() {
      None => InvalidSnafu.fail()?,
      Some(parent) => {
        let executable = join_executable_file(parent, uid.game_biz().bin_name());
        if !executable.is_file() {
          warn!("No valid game executable file found: {executable:?}");
          InvalidSnafu.fail()?
        }
      }
    };

    info!("Selected data folder: {maybe_data_folder:?}");
    Ok(DataFolder {
      business,
      value: maybe_data_folder,
    })
  }
}

// endregion

// region: Factory

#[derive(Debug, Deserialize)]
pub enum DataFolderLocatorFactory {
  UnityLog(UnityLogDataFolderLocator),
  Manual(ManualDataFolderLocator),
}

impl DataFolderLocator for DataFolderLocatorFactory {
  async fn locate(
    &self,
    business: AccountBusiness,
    uid: u32,
  ) -> Result<DataFolder, LocateDataFolderError> {
    macro_rules! delegates {
      ($($t:ident),*) => {
        match self {
          $(
            Self::$t(inner) => inner.locate(business, uid).await,
          )*
        }
      }
    }

    delegates! { UnityLog, Manual }
  }
}

// endregion
