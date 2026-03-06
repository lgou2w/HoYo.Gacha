use std::env;
use std::ops::Deref;
use std::path::PathBuf;
use std::sync::OnceLock;

#[cfg(windows)]
use windows_version::OsVersion;

use crate::constants;

/// Fixed and immutable runtime environment values
#[derive(Debug)]
pub struct Environment {
  pub cwd: PathBuf,
  pub hwnd: OnceLock<isize>,
  pub tauri_version: &'static str,
  pub webview_version: OnceLock<String>,
  #[cfg(windows)]
  pub windows_version: OsVersion,
  pub os_info: os_info::Info,
}

impl Default for Environment {
  #[tracing::instrument]
  fn default() -> Self {
    let cwd = env::current_dir().expect("Failed to get current working directory");

    #[cfg(windows)]
    let windows_version = {
      let value = OsVersion::current();
      tracing::info!("Windows version: {:?}", value);
      value
    };

    let os_info = os_info::get();
    tracing::info!("OS Information: {:?}", os_info);

    Self {
      cwd,
      hwnd: OnceLock::new(),
      tauri_version: tauri::VERSION,
      webview_version: OnceLock::new(),
      #[cfg(windows)]
      windows_version,
      os_info,
    }
  }
}

impl Environment {
  #[cfg(windows)]
  pub const fn is_windows_11(&self) -> bool {
    // `Windows 11 . 21H2` Build `22000` and higher. (First Windows 11 release)
    self.windows_version.build >= 22000
  }

  /// Convert to JSON value.
  pub fn to_json(&self) -> serde_json::Value {
    let mut json = serde_json::json!({
      "app": {
        "id": constants::ID,
        "name": constants::APP_NAME,
        "pkgName": constants::PKG_NAME,
        "version": constants::VERSION,
      },
      "git": {
        "commitHash": constants::GIT_COMMIT_HASH,
        "commitDate": constants::GIT_COMMIT_DATE,
        "remoteUrl": constants::GIT_REMOTE_URL,
      },
      "cwd": self.cwd.display().to_string(),
      "hwnd": self.hwnd.get().unwrap_or(&0),
      "locale": *constants::LOCALE,
      "tauriVersion": self.tauri_version,
      "webviewVersion": self.webview_version
        .get()
        .map(String::deref)
        .unwrap_or("0"),
      "os": {
        "edition": self.os_info
          .edition()
          .map(ToOwned::to_owned)
          .unwrap_or_else(|| self.os_info.os_type().to_string()),
        "architecture": self.os_info
          .architecture()
          .map(ToOwned::to_owned)
          .unwrap_or_else(|| self.os_info.bitness().to_string())
      }
    });

    #[cfg(windows)]
    {
      let windows_version_str = {
        let OsVersion {
          major,
          minor,
          pack,
          build,
        } = &self.windows_version;

        format!("{major}.{minor}.{pack}.{build}")
      };

      json.as_object_mut().unwrap().insert(
        "windows".into(),
        serde_json::json!({
          "version": windows_version_str,
          "isWindows11": self.is_windows_11(),
        }),
      );
    }

    json
  }
}
