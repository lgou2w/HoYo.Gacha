use std::env;
use std::path::PathBuf;
use std::sync::LazyLock;

use cfg_if::cfg_if;
use time::UtcOffset;

// See: src-tauri/Tauri.toml - identifier
// pub const ID: &str = "com.lgou2w.hoyo.gacha"; // Legacy
pub const ID: &str = "com.lgou2w.hoyo.gacha.v1";

// App name and database name
cfg_if! {if #[cfg(any(debug_assertions, test))] {
  // for Development
  pub const APP_NAME: &str = "__DEV__HoYo.Gacha";
  pub const DATABASE: &str = "__DEV__HoYo.Gacha.v1.db";
  pub const USER_AGENT: &str = concat!("__DEV__HoYo.Gacha/v", env!("CARGO_PKG_VERSION"));
} else {
  // for Production
  pub const APP_NAME: &str = "HoYo.Gacha";
  pub const DATABASE: &str = "HoYo.Gacha.v1.db";
  pub const USER_AGENT: &str = concat!("__DEV__HoYo.Gacha/v", env!("CARGO_PKG_VERSION"));
}}

#[deprecated = "Legacy"]
pub const DATABASE_LEGACY: &str = "HoYo.Gacha.db";

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

/// The user's profile directory.
pub static PROFILE_DIR: LazyLock<PathBuf> =
  LazyLock::new(|| hg_ffi::profile_dir().expect("Failed to get user profile directory"));

/// The local low data directory. (`APPDATA/LocalLow`)
pub static LOCALLOW_DATA_DIR: LazyLock<PathBuf> =
  LazyLock::new(|| hg_ffi::data_locallow_dir().expect("Failed to get locallow data directory"));

/// The local data directory. (`APPDATA/Local`)
pub static LOCAL_DATA_DIR: LazyLock<PathBuf> =
  LazyLock::new(|| hg_ffi::data_local_dir().expect("Failed to get local data directory"));

/// Like Tauri `app_local_data_dir`, Returns the path to the local data directory for the application. (`APPDATA/Local/${bundle_identifier}`)
pub static APP_LOCAL_DATA_DIR: LazyLock<PathBuf> = LazyLock::new(|| {
  LOCAL_DATA_DIR.join(ID) // ${bundle_identifier}
});

/// The current executable path.
pub static EXE_PATH: LazyLock<PathBuf> =
  LazyLock::new(|| env::current_exe().expect("Failed to get current executable path"));

/// The working directory of the current executable.
pub static EXE_WORKING_DIR: LazyLock<PathBuf> =
  LazyLock::new(|| EXE_PATH.parent().unwrap().to_path_buf());

/// The local UTC offset of the system.
pub static LOCAL_OFFSET: LazyLock<UtcOffset> =
  LazyLock::new(|| UtcOffset::current_local_offset().expect("Failed to get local UTC offset"));

/// The first user preferred UI language. e.g. `en-US`
pub static LOCALE: LazyLock<String> = LazyLock::new(|| {
  hg_ffi::locale().unwrap_or_else(|| {
    tracing::warn!("Failed to get system locale, using default 'en-US'");
    String::from("en-US")
  })
});
