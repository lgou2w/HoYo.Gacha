use std::path::Path;
use std::str::FromStr;
use std::sync::LazyLock;
use std::{fmt, fs, io};

use hg_diskcache::KeyCollector;
use regex::Regex;
use snafu::{ResultExt, Snafu, ensure};
use time::{Duration, UtcDateTime};

use crate::REGEX_GACHA_URL;

#[derive(Debug, Snafu)]
pub enum DirtyGachaUrlError {
  #[snafu(display("Failed to opening disk cache"))]
  OpenDiskCache { source: io::Error },

  #[snafu(display("Failed to reading disk cache"))]
  ReadDiskCache { source: io::Error },

  #[snafu(display("Failed to opening webcaches"))]
  OpenWebcaches { source: io::Error },

  #[snafu(display("No valid webCaches version found"))]
  EmptyWebCaches,
}

/// This is a dirty Gacha URL; you still need to validate it
/// to ensure it correctly matches the required parameters.
///
/// See the regular expression above for details.
#[derive(Clone, Debug)]
pub struct DirtyGachaUrl {
  // The creation time of this Gacha URL can only be determined
  // and its expiration date inferred when retrieved from the disk cache.
  pub creation_time: Option<UtcDateTime>,
  // Dirty URL, unverified.
  pub value: String,
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

impl DirtyGachaUrl {
  /// Collect dirty Gacha URLs from a disk cache folder.
  ///
  /// Returns a list of dirty Gacha URLs sorted by creation time DESC.
  pub fn from_disk_cache<P: AsRef<Path>>(
    data_folder: P,
    policy: CreationTimePolicy,
  ) -> Result<Vec<Self>, DirtyGachaUrlError> {
    // By default, this Gacha URL is valid for 1 day.
    const DISKCACHE_KEY_TIMEOUT: Duration = Duration::DAY;
    let duration = match policy {
      CreationTimePolicy::All => Duration::MAX,
      CreationTimePolicy::Valid => DISKCACHE_KEY_TIMEOUT,
      CreationTimePolicy::Before(d) => d.try_into().expect("duration"), // User input error
    };

    // The Gacha URL in disk cache must be a long key data
    let now = UtcDateTime::now();
    let mut results = KeyCollector::long_key_only(data_folder)
      .context(OpenDiskCacheSnafu)?
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
        if !REGEX_GACHA_URL.is_match(data) {
          return None;
        }

        Some(DirtyGachaUrl {
          creation_time: Some(creation_time),
          value: data.to_owned(),
        })
      })
      .context(ReadDiskCacheSnafu)?;

    // Sort by creation time DESC
    // If valid, then the first one is the latest.
    results.sort_by(|a, b| b.creation_time.cmp(&a.creation_time));

    Ok(results)
  }
}

impl DirtyGachaUrl {
  /// Find the latest version of the dirty Gacha URL from a webcaches directory.
  ///
  /// # Example:
  ///   * Input: `/foo/bar/webCaches`
  ///   * Ouput: `/foo/bar/webCaches/x.y.z.a/Cache/Cache_Data`
  ///
  /// Returns a list of dirty Gacha URLs sorted by creation time DESC.
  pub fn from_webcaches<P: AsRef<Path>>(
    webcaches_folder: P,
    policy: CreationTimePolicy,
  ) -> Result<Vec<Self>, DirtyGachaUrlError> {
    /// `webCaches` version number. For example: `x.y.z` or `x.y.z.a`
    static REGEX_WEBCACHES_VERSION: LazyLock<Regex> = LazyLock::new(|| {
      Regex::new(r"^(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)(\.(?P<build>\d+))?$").unwrap()
    });

    #[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
    struct WebCachesVersion(u8, u8, u8, Option<u8>);

    impl fmt::Display for WebCachesVersion {
      fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let Self(major, minor, patch, build) = self;

        write!(f, "{major}.{minor}.{patch}")?;
        if let Some(build) = build {
          write!(f, ".{build}")?;
        }

        Ok(())
      }
    }

    impl FromStr for WebCachesVersion {
      type Err = ();

      fn from_str(s: &str) -> Result<Self, Self::Err> {
        if let Some(captures) = REGEX_WEBCACHES_VERSION.captures(s) {
          let major = captures["major"].parse().unwrap();
          let minor = captures["minor"].parse().unwrap();
          let patch = captures["patch"].parse().unwrap();
          let build = captures
            .name("build")
            .map(|build| build.as_str().parse::<u8>().unwrap());

          Ok(Self(major, minor, patch, build))
        } else {
          Err(())
        }
      }
    }

    // Traverse all valid version number subdir under the webCaches directory and collect them.
    let mut walk_dir = fs::read_dir(&webcaches_folder).context(OpenWebcachesSnafu)?;
    let mut versions = Vec::new();
    while let Some(Ok(entry)) = walk_dir.next() {
      if entry.path().is_dir()
        && let Some(Ok(version)) = entry.file_name().to_str().map(WebCachesVersion::from_str)
      {
        versions.push(version);
      }
    }

    // Ensure we found at least one version
    ensure!(!versions.is_empty(), EmptyWebCachesSnafu);

    // Sort by version asc
    versions.sort();

    let latest_version = versions.last().unwrap().to_string(); // SAFETY
    let data_folder = webcaches_folder
      .as_ref()
      .join(latest_version)
      .join("Cache")
      .join("Cache_Data");

    Self::from_disk_cache(data_folder, policy)
  }
}
