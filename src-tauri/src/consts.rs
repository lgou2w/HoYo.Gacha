use std::env;
use std::path::PathBuf;

use once_cell::sync::Lazy;
use tauri::Theme;
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
pub const TAURI_MAIN_WINDOW_THEME: Option<Theme> = Some(Theme::Dark);

pub const TAURI_PLUGIN_DATABASE: &str = "HG_DATABASE";
pub const TAURI_PLUGIN_BUSINESS: &str = "HG_BUSINESS";

// Environment variables

pub const ENV_DEVTOOLS: &str = "HG_DEVTOOLS";

// Lazy

#[cfg(windows)]
pub static WINDOWS_VERSION: Lazy<windows_version::OsVersion> =
  Lazy::new(windows_version::OsVersion::current);

pub static LOCAL_OFFSET: Lazy<UtcOffset> = Lazy::new(|| UtcOffset::current_local_offset().unwrap());

pub static USER_HOME: Lazy<PathBuf> = Lazy::new(|| {
  env::var(if cfg!(windows) {
    "USERPROFILE"
  } else if cfg!(target_os = "macos") {
    "HOME"
  } else {
    unimplemented!()
  })
  .map(PathBuf::from)
  .unwrap()
});

pub static APPDATA_LOCAL: Lazy<PathBuf> = Lazy::new(|| {
  if cfg!(windows) {
    USER_HOME.join("AppData\\Local")
  } else if cfg!(target_os = "macos") {
    USER_HOME.join("Library/Caches")
  } else {
    unimplemented!()
  }
});

pub static APPDATA_LOCALLOW_MIHOYO: Lazy<PathBuf> = Lazy::new(|| {
  if cfg!(windows) {
    USER_HOME.join("AppData\\LocalLow\\miHoYo")
  } else if cfg!(target_os = "macos") {
    USER_HOME.join("Library/Caches/miHoYo") // TODO: untested
  } else {
    unimplemented!()
  }
});

pub static APPDATA_LOCALLOW_COGNOSPHERE: Lazy<PathBuf> = Lazy::new(|| {
  if cfg!(windows) {
    USER_HOME.join("AppData\\LocalLow\\Cognosphere")
  } else if cfg!(target_os = "macos") {
    USER_HOME.join("Library/Caches/Cognosphere") // TODO: untested
  } else {
    unimplemented!()
  }
});
