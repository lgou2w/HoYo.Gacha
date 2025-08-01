use std::env;
use std::path::PathBuf;
use std::sync::LazyLock;

use cfg_if::cfg_if;
use os_info::{Info as OsInfo, get as get_os_info};
use reqwest::Client as Reqwest;
use time::UtcOffset;
use time::format_description::FormatItem;
use time::macros::format_description;
use tracing_appender::rolling::Rotation;

// App

// See: src-tauri/Tauri.toml - identifier
// pub const ID: &str = "com.lgou2w.hoyo.gacha"; // Legacy
pub const ID: &str = "com.lgou2w.hoyo.gacha.v1";

cfg_if! {if #[cfg(any(debug_assertions, test))] {
  // for Development
  pub const APP_NAME: &str = "__DEV__HoYo.Gacha";
  pub const DATABASE: &str = "__DEV__HoYo.Gacha.v1.db";
} else {
  // for Production
  pub const APP_NAME: &str = "HoYo.Gacha";
  pub const DATABASE: &str = "HoYo.Gacha.v1.db";
}}

#[deprecated = "Legacy"]
pub const LEGACY_DATABASE: &str = "HoYo.Gacha.db";

// Package info
pub const PKG_NAME: &str = env!("CARGO_PKG_NAME");
pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const VERSION_WITH_PREFIX: &str = concat!("v", env!("CARGO_PKG_VERSION"));
pub const AUTHORS: &str = env!("CARGO_PKG_AUTHORS");
pub const DESCRIPTION: &str = env!("CARGO_PKG_DESCRIPTION");
pub const HOMEPAGE: &str = env!("CARGO_PKG_HOMEPAGE");
pub const REPOSITORY: &str = env!("CARGO_PKG_REPOSITORY");

// Embedded Environment Variables
// See: src-tauri/build.rs
pub const GIT_COMMIT_HASH: &str = env!("GIT_COMMIT_HASH");
pub const GIT_COMMIT_DATE: &str = env!("GIT_COMMIT_DATE");
pub const GIT_REMOTE_URL: &str = env!("GIT_REMOTE_URL");

// Crashs

pub const CRASHS_DIRECTORY: &str = "Crashs";
pub const CRASHS_TIME_FORMAT: &[FormatItem<'_>] =
  format_description!("[year][month][day]_[hour][minute][second]");

// Tracing

pub const TRACING_TIME_FORMAT: &[FormatItem<'_>] =
  format_description!("[year]-[month]-[day] [hour]:[minute]:[second].[subsecond digits:9]");
pub const TRACING_LOGS_DIRECTORY: &str = "Logs";
pub const TRACING_LOGS_ROTATION: Rotation = Rotation::DAILY;
pub const TRACING_LOGS_MAX_FILES: usize = 30;
pub const TRACING_LOGS_FILE_NAME_PREFIX: &str = APP_NAME;
pub const TRACING_LOGS_FILE_NAME_SUFFIX: &str = "log";

// Tauri app

pub const TAURI_MAIN_WINDOW_LABEL: &str = "main";
pub const TAURI_MAIN_WINDOW_ENTRYPOINT: &str = "index.html";
pub const TAURI_MAIN_WINDOW_CLASSNAME: &str = ID;
pub const TAURI_MAIN_WINDOW_TITLE: &str = APP_NAME;
pub const TAURI_MAIN_WINDOW_WIDTH: f64 = 1280.;
pub const TAURI_MAIN_WINDOW_HEIGHT: f64 = 720.;
pub const TAURI_MAIN_WINDOW_FULLSCREEN: bool = false;
pub const TAURI_MAIN_WINDOW_RESIZABLE: bool = true;
pub const TAURI_MAIN_WINDOW_DECORATIONS: bool = false;

// Environment variables

pub const ENV_DEVTOOLS: &str = "HG_DEVTOOLS";

// Known database kvs

pub const KV_THEME_DATA: &str = "HG_THEME_DATA";
pub const KV_WINDOW_STATE: &str = "HG_WINDOW_STATE";

// Lazy

pub static OS_INFO: LazyLock<OsInfo> = LazyLock::new(get_os_info);

pub static LOCAL_OFFSET: LazyLock<UtcOffset> =
  LazyLock::new(|| UtcOffset::current_local_offset().unwrap());

pub static REQWEST: LazyLock<Reqwest> = LazyLock::new(|| {
  Reqwest::builder()
    .user_agent(format!("{APP_NAME}/{VERSION}"))
    .build()
    .unwrap()
});

// region: Locale

pub struct Locale {
  pub value: Option<String>,
  pub is_english: bool,
  pub is_chinese: bool,
}

impl Locale {
  pub const ENGLISH: &'static str = "en";
  pub const CHINESE: &'static str = "zh";

  fn new() -> Self {
    let value = sys_locale::get_locale();
    let value_ref = value.as_deref().unwrap_or(Self::ENGLISH);
    let is_english = value_ref.starts_with(Self::ENGLISH);
    let is_chinese = value_ref.starts_with(Self::CHINESE);

    Self {
      value,
      is_english,
      is_chinese,
    }
  }
}

pub static LOCALE: LazyLock<Locale> = LazyLock::new(Locale::new);

// endregion

// region: Windows

cfg_if! {if #[cfg(windows)] {
  pub struct Windows {
    // https://en.wikipedia.org/wiki/Windows_10_version_history
    // https://en.wikipedia.org/wiki/Windows_11_version_history
    pub version: windows_version::OsVersion,
    /// `Windows 10 . 1507` Build `10240` and higher. (First Windows 10 release)
    pub is_1507_and_higher: bool,
    /// `Windows 10 . 1809` Build `17763` and higher.
    pub is_1809_and_higher: bool,
    /// `Windows 10 . 19H1` Build `18362` and higher.
    pub is_19h1_and_higher: bool,
    /// `Windows 11 . 21H2` Build `22000` and higher. (First Windows 11 release)
    pub is_21h2_and_higher: bool,
    /// `Windows 11 . 22H2` Build `22621` and higher.
    pub is_22h2_and_higher: bool,
  }

  impl Windows {
    fn new() -> Self {
      let version = windows_version::OsVersion::current();
      Self {
        version,
        is_1507_and_higher: version.build >= 10240,
        is_1809_and_higher: version.build >= 17763,
        is_19h1_and_higher: version.build >= 18362,
        is_21h2_and_higher: version.build >= 22000,
        is_22h2_and_higher: version.build >= 22621,
      }
    }
  }

  pub static WINDOWS: LazyLock<Windows> = LazyLock::new(Windows::new);
}}

// endregion

// region: Platform

pub struct Platform {
  pub user_home: PathBuf,
  pub desktop: PathBuf,
  pub appdata_local: PathBuf,
  pub appdata_locallow_mihoyo: PathBuf,
  pub appdata_locallow_cognosphere: PathBuf,
}

impl Platform {
  pub const FOLDER_MIHOYO: &'static str = "miHoYo";
  pub const FOLDER_COGNOSPHERE: &'static str = "Cognosphere";

  cfg_if! {if #[cfg(windows)] {
    fn new() -> Self {
      let user_home = env::var("USERPROFILE")
        .map(PathBuf::from)
        .expect("Failed to get user home directory");
      let desktop = user_home.join("Desktop");
      let appdata = user_home.join("AppData");
      let appdata_local = appdata.join("Local");
      let appdata_locallow = appdata.join("LocalLow");
      Self {
        user_home,
        desktop,
        appdata_local,
        appdata_locallow_mihoyo: appdata_locallow.join(Self::FOLDER_MIHOYO),
        appdata_locallow_cognosphere: appdata_locallow.join(Self::FOLDER_COGNOSPHERE),
      }
    }
  } else if #[cfg(target_os = "macos")] {
    fn new() -> Self {
      let user_home = env::var("HOME")
        .map(PathBuf::from)
        .expect("Failed to get user home directory");
      let desktop = user_home.join("Desktop");
      let appdata = user_home.join("Library");
      let appdata_local = appdata.join("Caches");
      Self {
        user_home,
        desktop,
        appdata_locallow_mihoyo: appdata_local.join(Self::FOLDER_MIHOYO),
        appdata_locallow_cognosphere: appdata_local.join(Self::FOLDER_COGNOSPHERE),
        appdata_local: appdata_local,
      }
    }
  } else {
    fn new() -> Self {
      unimplemented!()
    }
  }}
}

pub static PLATFORM: LazyLock<Platform> = LazyLock::new(Platform::new);

// endregion
