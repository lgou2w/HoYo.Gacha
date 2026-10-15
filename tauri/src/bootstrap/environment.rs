use std::ops::Deref;
use std::path::Path;
use std::sync::{Arc, OnceLock};

use tracing::info;

use crate::constants;

#[derive(Debug)]
pub struct Environment {
  pub cwd: &'static Path,
  pub tauri_version: &'static str,
  pub webview_version: OnceLock<String>,
  pub windows_version: windows_version::OsVersion,
  pub os_info: os_info::Info,
}

pub type TauriEnvState<'r> = tauri::State<'r, Arc<Environment>>;

impl Environment {
  #[tracing::instrument]
  pub fn new() -> Self {
    let windows_version = windows_version::OsVersion::current();
    let os_info = os_info::get();

    info!("Windows version: {windows_version:?}");
    info!("OS Information: {os_info:?}");

    Self {
      cwd: &*constants::EXE_WORKING_DIR,
      tauri_version: tauri::VERSION,
      webview_version: OnceLock::new(),
      windows_version,
      os_info,
    }
  }

  pub fn windows_version_into(&self) -> String {
    let windows_version::OsVersion {
      major,
      minor,
      pack,
      build,
    } = &self.windows_version;

    format!("{major}.{minor}.{pack}.{build}")
  }

  #[inline]
  pub const fn is_windows_11(&self) -> bool {
    // `Windows 11 . 21H2` Build `22000` and higher. (First Windows 11 release)
    self.windows_version.build >= 22000
  }

  pub fn to_json(&self) -> serde_json::Value {
    serde_json::json!({
      "app": {
        "id": constants::ID,
        "name": constants::APP_NAME,
        "pkgName": constants::PKG_NAME,
        "version": constants::VERSION,
      },
      "cwd": self.cwd,
      "locale": &*constants::LOCALE,
      "tauriVersion": self.tauri_version,
      "webviewVersion": self.webview_version.get().map(String::deref).unwrap_or("0"),
      "osInfo": {
        "edition": self.os_info.edition()
          .map(ToOwned::to_owned)
          .unwrap_or_else(|| self.os_info.os_type().to_string()),
        "architecture": self.os_info.architecture()
          .map(ToOwned::to_owned)
          .unwrap_or_else(|| self.os_info.bitness().to_string()),
      },
      "windowsVersion": self.windows_version_into(),
      "isWindows11": self.is_windows_11(),
    })
  }
}
