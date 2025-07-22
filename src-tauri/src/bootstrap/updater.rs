use std::env;
use std::error::Error as StdError;
use std::fmt;
use std::str::FromStr;
use std::sync::LazyLock;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use serde::{Deserialize, Deserializer};
use time::OffsetDateTime;
use time::serde::rfc3339;
use tokio::fs::{self, File};
use tokio::io::AsyncWriteExt;
use tracing::info;

use crate::consts;

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct TagName {
  pub major: u16,
  pub minor: u16,
  pub build: u16,
}

impl FromStr for TagName {
  type Err = String;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    let parts: Vec<&str> = s.split('.').collect();
    if parts.len() != 3 {
      return Err(format!(
        "Invalid tag name format: '{s}'. Expected format is 'major.minor.build'"
      ));
    }

    let major = parts[0]
      .parse()
      .map_err(|_| format!("Invalid major version: '{s}'"))?;
    let minor = parts[1]
      .parse()
      .map_err(|_| format!("Invalid minor version: '{s}'"))?;
    let build = parts[2]
      .parse()
      .map_err(|_| format!("Invalid build version: '{s}'"))?;

    Ok(TagName {
      major,
      minor,
      build,
    })
  }
}

impl fmt::Display for TagName {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}.{}.{}", self.major, self.minor, self.build)
  }
}

impl<'de> Deserialize<'de> for TagName {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: Deserializer<'de>,
  {
    let s: &str = Deserialize::deserialize(deserializer)?;
    TagName::from_str(s).map_err(serde::de::Error::custom)
  }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LatestRelease {
  pub tag_name: TagName,
  #[serde(with = "rfc3339")]
  pub created_at: OffsetDateTime,
  pub name: String,
  pub size: u64,
  pub download_url: String,
}

static UPDATING: AtomicBool = AtomicBool::new(false);
static CURRENT_VERSION: LazyLock<TagName> =
  LazyLock::new(|| TagName::from_str(consts::VERSION).unwrap());

pub struct Updater;

impl Updater {
  pub fn current_version() -> &'static TagName {
    &CURRENT_VERSION
  }

  pub fn is_updating() -> bool {
    UPDATING.load(Ordering::SeqCst)
  }

  #[allow(clippy::type_complexity)]
  pub async fn update(
    on_progress: Box<dyn (Fn(f32) -> Result<(), Box<dyn StdError + 'static>>) + Send>,
  ) -> Result<(), Box<dyn StdError + 'static>> {
    if UPDATING.swap(true, Ordering::SeqCst) {
      return Err("Updater is already updating".into());
    }

    struct UpdateGuard;
    impl Drop for UpdateGuard {
      fn drop(&mut self) {
        UPDATING.store(false, Ordering::SeqCst);
      }
    }
    let _update_guard = UpdateGuard;

    let current_exe = env::current_exe().unwrap();
    let current_dir = current_exe.parent().unwrap();
    let before_exe = current_dir.join(format!("{}.HGBAK", consts::APP_NAME));
    if before_exe.is_file() {
      info!(
        "Backup file already exists, removing it: {}",
        before_exe.display()
      );
      fs::remove_file(&before_exe).await?;
    }

    const API_RELEASE: &str = "https://hoyo-gacha-v1.lgou2w.com/release";
    const API_TIMEOUT: Duration = Duration::from_secs(15);

    info!("Checking for updates...");
    let latest_release = consts::REQWEST
      .get(format!("{API_RELEASE}/latest"))
      .timeout(API_TIMEOUT)
      .send()
      .await?
      .error_for_status()?
      .json::<LatestRelease>()
      .await?;

    info!(
      message = "Latest release found",
      tag_name = %latest_release.tag_name,
      created_at = %latest_release.created_at,
      name = %latest_release.name,
    );

    if *Self::current_version() >= latest_release.tag_name {
      info!(
        "Current version {} is up to date with the latest release {}",
        Self::current_version(),
        latest_release.tag_name
      );
      return Ok(());
    }

    // Download update
    on_progress(-1.)?; // Set progress to -1 to indicate download start
    let out_path = current_dir.join(latest_release.name);
    let mut res = consts::REQWEST
      .get(format!("{API_RELEASE}/download"))
      .timeout(API_TIMEOUT)
      .send()
      .await?
      .error_for_status()?;

    let mut downloaded = 0;
    let mut out_file = File::create(&out_path).await?;
    while let Some(chunk) = res.chunk().await? {
      downloaded += chunk.len();
      out_file.write_all(&chunk).await?;
      on_progress(downloaded as f32 / latest_release.size as f32)?;
    }

    if downloaded != latest_release.size as usize {
      fs::remove_file(&out_path).await?;
      return Err(
        format!(
          "Downloaded file size mismatch: expected {}, got {}",
          latest_release.size, downloaded
        )
        .into(),
      );
    }

    fs::rename(&current_exe, before_exe).await?;
    info!("Update downloaded successfully");

    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_tag_name() {
    assert_eq!(
      "1.2.3".parse::<TagName>().unwrap(),
      TagName {
        major: 1,
        minor: 2,
        build: 3
      }
    );
    assert!("1.2".parse::<TagName>().is_err());
    assert!("1".parse::<TagName>().is_err());
  }
}
