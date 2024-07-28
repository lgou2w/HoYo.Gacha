use std::env;
use std::path::PathBuf;

use once_cell::sync::Lazy;
use time::format_description::FormatItem;
use time::macros::format_description;
use time::UtcOffset;
use tracing_appender::rolling::Rotation;

// App

pub const ID: &str = "com.lgou2w.hoyo.gacha";
pub const NAME: &str = "HoYo.Gacha";
pub const DATABASE: &str = "HoYo.Gacha.db";

pub const PKG_NAME: &str = env!("CARGO_PKG_NAME");
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const AUTHORS: &str = env!("CARGO_PKG_AUTHORS");
pub const DESCRIPTION: &str = env!("CARGO_PKG_DESCRIPTION");
pub const HOMEPAGE: &str = env!("CARGO_PKG_HOMEPAGE");
pub const REPOSITORY: &str = env!("CARGO_PKG_REPOSITORY");

// Crashs

pub const CRASHS_DIRECTORY: &str = "crashs";
pub const CRASHS_TIME_FORMAT: &[FormatItem<'_>] =
  format_description!("[year][month][day]_[hour][minute][second]");

// Tracing

pub const TRACING_TIME_FORMAT: &[FormatItem<'_>] =
  format_description!("[year]-[month]-[day] [hour]:[minute]:[second].[subsecond digits:9]");
pub const TRACING_LOGS_DIRECTORY: &str = "logs";
pub const TRACING_LOGS_ROTATION: Rotation = Rotation::DAILY;
pub const TRACING_LOGS_MAX_FILES: usize = 30;
pub const TRACING_LOGS_FILE_NAME_PREFIX: &str = NAME;
pub const TRACING_LOGS_FILE_NAME_SUFFIX: &str = "log";

// Tauri app

pub const TAURI_MAIN_WINDOW_LABEL: &str = "main";
pub const TAURI_MAIN_WINDOW_ENTRYPOINT: &str = "index.html";
pub const TAURI_MAIN_WINDOW_TITLE: &str = NAME;
pub const TAURI_MAIN_WINDOW_WIDTH: f64 = 1152.;
pub const TAURI_MAIN_WINDOW_HEIGHT: f64 = 864.;
pub const TAURI_MAIN_WINDOW_FULLSCREEN: bool = false;
pub const TAURI_MAIN_WINDOW_RESIZABLE: bool = true;
pub const TAURI_MAIN_WINDOW_DECORATIONS: bool = false;
pub const TAURI_MAIN_WINDOW_TRANSPARENT: bool = true;

// Environment variables

pub const ENV_DEVTOOLS: &str = "HG_DEVTOOLS";

// Known database kvs

pub const KV_THEME_DATA: &str = "HG_THEME_DATA";

// Lazy

pub static LOCAL_OFFSET: Lazy<UtcOffset> = Lazy::new(|| UtcOffset::current_local_offset().unwrap());

// region: Platform

#[cfg(windows)]
pub struct Windows {
  // https://en.wikipedia.org/wiki/Windows_10_version_history
  // https://en.wikipedia.org/wiki/Windows_11_version_history
  pub version: windows_version::OsVersion,
  /// `Windows 10 . 1809` Build `17763` and higher.
  pub is_1809_and_higher: bool,
  /// `Windows 11 . 21H2` Build `22000` and higher. (First Windows 11 release)
  pub is_21h2_and_higher: bool,
  /// `Windows 11 . 22H2` Build `22621` and higher.
  pub is_22h2_and_higher: bool,
}

#[cfg(windows)]
impl Windows {
  pub fn new() -> Self {
    let version = windows_version::OsVersion::current();
    Self {
      version,
      is_1809_and_higher: version.build >= 17763,
      is_21h2_and_higher: version.build >= 22000,
      is_22h2_and_higher: version.build >= 22621,
    }
  }
}

pub struct Platform {
  #[cfg(windows)]
  pub windows: Windows,
  pub user_home: PathBuf,
  pub appdata_local: PathBuf,
  pub appdata_locallow_mihoyo: PathBuf,
  pub appdata_locallow_cognosphere: PathBuf,
}

pub static PLATFORM: Lazy<Platform> = Lazy::new(|| {
  let (user_home, appdata_local, appdata_locallow) = if cfg!(windows) {
    let user_home = env::var("USERPROFILE").map(PathBuf::from).unwrap();
    let appdata = env::var("APPDATA").map(PathBuf::from).unwrap();
    let appdata_local = appdata.join("Local");
    let appdata_locallow = appdata.join("LocalLow");
    (user_home, appdata_local, appdata_locallow)
  } else if cfg!(target_os = "macos") {
    let user_home = env::var("HOME").map(PathBuf::from).unwrap();
    let appdata = user_home.join("Library");
    let appdata_local = appdata.join("Caches");
    (user_home, appdata_local.clone(), appdata_local)
  } else {
    unimplemented!()
  };

  Platform {
    #[cfg(windows)]
    windows: Windows::new(),
    user_home,
    appdata_local,
    appdata_locallow_mihoyo: appdata_locallow.join("miHoYo"),
    appdata_locallow_cognosphere: appdata_locallow.join("Cognosphere"),
  }
});

// endregion