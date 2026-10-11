use std::path::Path;
use std::str::FromStr;
use std::sync::LazyLock;
use std::{fmt, fs, io};

use hg_diskcache::KeyCollector;
use regex::Regex;
use snafu::{ResultExt, Snafu, ensure};
use time::{Duration, UtcDateTime};

#[derive(Debug, Snafu)]
#[snafu(context(suffix(false)))]
pub enum GachaUrlFindError {
  #[snafu(display("Failed to opening disk cache"))]
  OpenDiskCache { source: io::Error },

  #[snafu(display("Failed to reading disk cache"))]
  ReadDiskCache { source: io::Error },

  #[snafu(display("Failed to opening webcaches"))]
  OpenWebcaches { source: io::Error },

  #[snafu(display("No valid webcaches version found"))]
  EmptyWebcaches,
}

#[derive(Debug)]
pub enum CreationTimePolicy {
  /// Collect all matches.
  All,
  /// Only collect non-expired.
  Valid,
  /// Only collect those created before the specified duration.
  ///
  /// # Panics
  /// * If the duration cannot be converted into `time::Duration`
  Before(std::time::Duration),
}

/// This is a dirty Gacha URL; you still need to validate it
/// to ensure it correctly matches the required parameters.
///
/// See the regular expression above for details.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DirtyGachaUrl {
  // The creation time of this Gacha URL can only be determined
  // and its expiration date inferred when retrieved from the disk cache.
  pub creation_time: Option<UtcDateTime>,
  // Dirty URL, unverified.
  pub value: String,
}

impl DirtyGachaUrl {
  /// Collect dirty Gacha URLs from a disk cache folder.
  ///
  /// Returns a list of dirty Gacha URLs sorted by creation time DESC.
  pub fn from_disk_cache<P: AsRef<Path>>(
    data_folder: P,
    policy: CreationTimePolicy,
  ) -> Result<Vec<Self>, GachaUrlFindError> {
    from_disk_cache(data_folder.as_ref(), policy)
  }

  /// Collect the latest version of the dirty Gacha URL from a webcaches folder.
  ///
  /// # Example:
  ///   * Input: `/foo/bar/webCaches`
  ///   * Ouput: `/foo/bar/webCaches/x.y.z.a/Cache/Cache_Data`
  ///
  /// Returns a list of dirty Gacha URLs sorted by creation time DESC.
  pub fn from_webcaches<P: AsRef<Path>>(
    webcaches_folder: P,
    policy: CreationTimePolicy,
  ) -> Result<Vec<Self>, GachaUrlFindError> {
    from_webcaches(webcaches_folder.as_ref(), policy)
  }
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
struct WebcachesVersion(u16, u16, u16, Option<u16>);

impl fmt::Display for WebcachesVersion {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    let Self(major, minor, patch, build) = self;

    write!(f, "{major}.{minor}.{patch}")?;
    if let Some(build) = build {
      write!(f, ".{build}")?;
    }

    Ok(())
  }
}

impl FromStr for WebcachesVersion {
  type Err = ();

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    /// `Webcaches` version number. For example: `x.y.z` or `x.y.z.a`
    static REGEX_WEBCACHES_VERSION: LazyLock<Regex> = LazyLock::new(|| {
      Regex::new(r"^(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)(\.(?P<build>\d+))?$").unwrap()
    });

    if let Some(captures) = REGEX_WEBCACHES_VERSION.captures(s) {
      let major = captures["major"].parse().map_err(|_| ())?;
      let minor = captures["minor"].parse().map_err(|_| ())?;
      let patch = captures["patch"].parse().map_err(|_| ())?;
      let build = captures
        .name("build")
        .map(|build| build.as_str().parse::<_>().map_err(|_| ()))
        .transpose()?;

      Ok(Self(major, minor, patch, build))
    } else {
      Err(())
    }
  }
}

fn from_disk_cache(
  data_folder: &Path,
  policy: CreationTimePolicy,
) -> Result<Vec<DirtyGachaUrl>, GachaUrlFindError> {
  let duration = match policy {
    CreationTimePolicy::All => Duration::MAX,
    CreationTimePolicy::Valid => Duration::DAY, // By default, this Gacha URL is valid for 1 day.
    CreationTimePolicy::Before(d) => d.try_into().expect("duration"), // User input error
  };

  // The Gacha URL in disk cache must be a long key data
  let now = UtcDateTime::now();
  let mut results = KeyCollector::long_key_only(data_folder)
    .context(OpenDiskCache)?
    .collect(|key| {
      let creation_time = UtcDateTime::from_unix_timestamp(key.timestamp as _).ok()?;

      // Check expiration
      if now - creation_time > duration {
        return None;
      }

      // Trim any leading data before "http".
      // For example: "1/0/https://foo.bar/path?query"
      let data = if let Some(n) = key.data.find("http") {
        &key.data[n..]
      } else {
        &key.data
      };

      // Verify that the url is the correct gacha url
      if !crate::REGEX_GACHA_URL.is_match(data) {
        return None;
      }

      Some(DirtyGachaUrl {
        creation_time: Some(creation_time),
        value: data.to_owned(),
      })
    })
    .context(ReadDiskCache)?;

  // Sort by creation time DESC
  // If valid, then the first one is the latest.
  results.sort_by_key(|b| std::cmp::Reverse(b.creation_time));

  Ok(results)
}

fn from_webcaches(
  webcaches_folder: &Path,
  policy: CreationTimePolicy,
) -> Result<Vec<DirtyGachaUrl>, GachaUrlFindError> {
  // Traverse all valid version number subdir under the Webcaches folder and collect them.
  let mut walk_dir = fs::read_dir(webcaches_folder).context(OpenWebcaches)?;
  let mut versions = Vec::new();
  while let Some(Ok(entry)) = walk_dir.next() {
    if entry.path().is_dir()
      && let Some(Ok(version)) = entry.file_name().to_str().map(WebcachesVersion::from_str)
    {
      versions.push(version);
    }
  }

  // Ensure we found at least one version
  ensure!(!versions.is_empty(), EmptyWebcaches);

  // Sort by version asc
  versions.sort();

  // The last one is the latest version
  let latest_version = versions.last().unwrap().to_string(); // SAFETY
  let data_folder = webcaches_folder
    .join(latest_version)
    .join("Cache")
    .join("Cache_Data");

  from_disk_cache(&data_folder, policy)
}

// Tests
#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  #[ignore = "Hard-code unit test"]
  fn find_valid() {
    let results = DirtyGachaUrl::from_webcaches(
      r"D:\miHoYo Launcher\games\Star Rail Game\StarRail_Data\webCaches",
      CreationTimePolicy::Valid,
    );

    println!("{results:?}")
  }
}
