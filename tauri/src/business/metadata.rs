use std::ops::Deref;
use std::path::PathBuf;

use hg_metadata::def::{BakeMetadataError, bake as bake_metadata};
use hg_metadata::raw::RawMetadata;
use snafu::{ResultExt, Snafu};
use tokio::sync::{RwLock, RwLockReadGuard};
use tracing::{debug, info};

use crate::error::ErrorDetails;

#[derive(Debug, Snafu)]
pub enum MetadataError {
  #[snafu(display("Failed to deserialize metadata"))]
  Deserialize { source: serde_json::Error },

  #[snafu(display("Failed to bake metadata"))]
  Bake { source: BakeMetadataError },
}

impl ErrorDetails for MetadataError {
  fn name(&self) -> &'static str {
    stringify!(MetadataError)
  }

  fn details(&self) -> Option<serde_json::Value> {
    use serde_json::json;

    Some(match self {
      Self::Deserialize { source } => json!({
        "kind": stringify!(Deserialize),
        "cause": format_args!("{source:?}"),
      }),
      Self::Bake { source } => json!({
        "kind": stringify!(Bake),
        "cause": format_args!("{source:?}"),
      }),
    })
  }
}

pub struct Metadata {
  inner: RwLock<MetadataInner>,
  #[cfg(not(feature = "disable-metadata-updater"))]
  updating: std::sync::atomic::AtomicBool,
}

impl Metadata {
  #[tracing::instrument]
  pub fn new() -> Result<Self, MetadataError> {
    info!("Initializing gacha metadata...");

    let inner = MetadataInner::new()?;
    info!(message = "Gacha metadata initialized", hash = ?inner.hash);

    Ok(Self {
      inner: RwLock::new(inner),
      #[cfg(not(feature = "disable-metadata-updater"))]
      updating: std::sync::atomic::AtomicBool::new(false),
    })
  }

  /// Get the current metadata hash.
  pub async fn hash(&self) -> String {
    { self.inner.read().await }.hash.clone()
  }

  /// Load metadata, returning an `Self`.
  #[tracing::instrument(skip(self))]
  pub async fn load(self) -> Self {
    // Load caches file if exists
    #[cfg(not(feature = "disable-metadata-updater"))]
    self.load_caches().await;

    // Dump current metadata
    #[cfg(debug_assertions)]
    self.dump().await;

    self
  }

  /// Dump the current baked metadata to a Debug output. (`debug_assertions`)
  #[cfg(debug_assertions)]
  #[tracing::instrument(skip(self))]
  async fn dump(&self) {
    use crate::constants::APP_NAME;
    use std::io::IoSlice;
    use tokio::fs::File;
    use tokio::io::AsyncWriteExt;

    let output =
      PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(format!("{APP_NAME}.Metadata.Dump.txt"));

    tracing::debug!(message = "Dumping metadata...", ?output);
    if let Ok(mut file) = File::create(output).await {
      let inner = { &*self.inner.read().await };
      let _ = file
        .write_vectored(&[
          IoSlice::new(format!("Hash: {:?}\n", inner.hash).as_bytes()),
          IoSlice::new(format!("{:#?}", inner.metadata).as_bytes()),
        ])
        .await;
    }
  }
}

// Inner
struct MetadataInner {
  metadata: Box<dyn hg_metadata::Metadata>,
  hash: String,
}

/// Compute the SHA-1 checksum of the input bytes and return it as a lowercase hexadecimal string.
fn sha1sum(input: &[u8]) -> String {
  use sha1::{Digest, Sha1};

  Sha1::digest(input)
    .into_iter()
    .fold(String::with_capacity(40), |mut output, b| {
      use std::fmt::Write;
      let _ = write!(output, "{b:02x}"); // lowercase
      output
    })
}

impl MetadataInner {
  /// Initialize from embedded metadata.
  fn new() -> Result<Self, MetadataError> {
    debug!("Loading embedded metadata...");
    const EMBEDDED_METADATA: &[u8] = include_bytes!("../assets/GachaMetadata.json");
    Self::from_raw(EMBEDDED_METADATA, None)
  }

  /// Initialize from raw bytes.
  ///
  /// `hash` should be the SHA-1 hash of the bytes, if known.
  /// Avoid multiple calculations.
  #[tracing::instrument(fields(bytes = bytes.len()))]
  fn from_raw(bytes: &[u8], hash: Option<String>) -> Result<Self, MetadataError> {
    debug!("Deserializing metadata...");
    let raw = RawMetadata::from_slice(bytes).context(DeserializeSnafu)?;

    debug!(message = "Baking metadata...", len = raw.as_ref().len());
    let metadata = bake_metadata(raw).context(BakeSnafu)?;

    Ok(Self {
      metadata,
      // Compute hash if not provided
      hash: hash.unwrap_or(sha1sum(bytes)),
    })
  }
}

// Read guard
pub struct MetadataReadGuard<'a> {
  guard: RwLockReadGuard<'a, MetadataInner>,
}

impl<'a> Deref for MetadataReadGuard<'a> {
  type Target = dyn hg_metadata::Metadata;

  fn deref(&self) -> &Self::Target {
    &*self.guard.metadata
  }
}

impl Metadata {
  pub async fn read(&self) -> MetadataReadGuard<'_> {
    MetadataReadGuard {
      guard: self.inner.read().await,
    }
  }
}

// Updater
#[cfg(not(feature = "disable-metadata-updater"))]
#[derive(Debug, Snafu)]
pub enum MetadataUpdateError {
  #[snafu(display("Failed to fetch metadata"))]
  Reqwest { source: reqwest::Error },

  #[snafu(display("Downloaded metadata hash mismatch"))]
  DownloadedMismatch,

  #[snafu(display("Failed to process metadata"))]
  Process { source: MetadataError },
}

#[cfg(not(feature = "disable-metadata-updater"))]
impl ErrorDetails for MetadataUpdateError {
  fn name(&self) -> &'static str {
    match self {
      Self::Process { source } => source.name(),
      _ => stringify!(MetadataUpdateError),
    }
  }

  fn details(&self) -> Option<serde_json::Value> {
    use serde_json::json;

    match self {
      Self::Reqwest { source } => Some(json!({
        "kind": stringify!(Reqwest),
        "cause": format_args!("{source:?}"),
      })),
      Self::DownloadedMismatch => Some(json!({
        "kind": stringify!(DownloadedMismatch)
      })),
      Self::Process { source } => source.details(),
    }
  }
}

#[cfg(not(feature = "disable-metadata-updater"))]
#[derive(Debug, serde::Serialize, PartialEq, Eq)]
pub enum MetadataUpdateKind {
  Updating,
  UpToDate,
  Success(String),
}

#[cfg(not(feature = "disable-metadata-updater"))]
impl Metadata {
  const API_BASE_URL: &str = "https://hoyo-gacha-v1.lgou2w.com/GachaMetadata/v2";
  const API_TIMEOUT: std::time::Duration = std::time::Duration::from_secs(15);
  const OUT_DIRECTORY: &str = "GachaMetadata";
  const OUT_CACHES: &str = "LatestV2.json";

  // FIXME: Panics if directory creation fails
  fn caches_file() -> PathBuf {
    let dir = crate::constants::APP_LOCAL_DATA_DIR.join(Self::OUT_DIRECTORY);
    std::fs::create_dir_all(&dir).expect("Failed to create gacha metadata directory");
    dir.join(Self::OUT_CACHES)
  }

  #[tracing::instrument(skip(self))]
  async fn load_caches(&self) {
    debug!("Loading metadata caches file...");

    let caches_file = Self::caches_file();
    if !caches_file.exists() {
      debug!("No metadata caches file found");
      return;
    }

    let bytes = match tokio::fs::read(&caches_file).await {
      Err(err) => {
        // IO error, possibly caused by permission issues.
        tracing::error!(message = "Failed to read caches file", ?err);
        return;
      }
      Ok(bytes) => bytes,
    };

    // If the hash matches, no need to load
    let hash = sha1sum(&bytes);
    {
      let guard = self.inner.read().await;
      if guard.hash == hash {
        info!(message = "Metadata caches file is up-to-date", ?hash);
        return;
      }
    }

    // Only `Deserialize` or `Bake` errors will occur; see `from_raw` for details.
    match MetadataInner::from_raw(&bytes, Some(hash)) {
      Err(err) => {
        // JSON syntax error, possibly caused by manual modification by the user.
        // Remove this caches file
        tracing::error!(message = "Failed to parse or bake, removing", ?err);
        let _ = tokio::fs::remove_file(&caches_file).await;
      }
      Ok(inner) => {
        info!(message = "Loaded metadata caches file", hash = ?inner.hash);
        *self.inner.write().await = inner;
      }
    }
  }

  pub fn is_updating(&self) -> bool {
    self.updating.load(std::sync::atomic::Ordering::SeqCst)
  }

  #[tracing::instrument(skip(self))]
  pub async fn update(&self) -> Result<MetadataUpdateKind, MetadataUpdateError> {
    if self
      .updating
      .swap(true, std::sync::atomic::Ordering::SeqCst)
    {
      debug!("Metadata update already in progress...");
      return Ok(MetadataUpdateKind::Updating);
    }

    // region: UpdateGuard
    // Ensure the updating flag is reset on function exit
    struct UpdateGuard<'a>(&'a std::sync::atomic::AtomicBool);
    impl<'a> Drop for UpdateGuard<'a> {
      fn drop(&mut self) {
        debug!("Dropping update guard, resetting updating flag");
        self.0.store(false, std::sync::atomic::Ordering::SeqCst);
      }
    }
    let _update_guard = UpdateGuard(&self.updating);
    // endregion

    let start = std::time::Instant::now();

    // 1. Fetch latest metadata index and compare hash
    //   if matches, return early
    let latest_hash = Self::fetch_metadata_index().await.context(ReqwestSnafu)?;
    {
      let guard = self.inner.read().await;
      if guard.hash == latest_hash {
        info!(message = "Metadata is already up-to-date", ?latest_hash);
        return Ok(MetadataUpdateKind::UpToDate);
      }
    }

    // 2. Fetch latest metadata data and verify hash
    //   if mismatched, retry fetch ?
    let downloaded_data = Self::fetch_metadata_data(&latest_hash)
      .await
      .context(ReqwestSnafu)?
      .bytes()
      .await
      .context(ReqwestSnafu)?;

    let downloaded_hash = sha1sum(&downloaded_data);
    if downloaded_hash != latest_hash {
      tracing::error!(
        message = "Downloaded metadata hash mismatch",
        expected = ?latest_hash,
        actual = ?downloaded_hash,
      );
      return DownloadedMismatchSnafu.fail();
    }

    // 3. Bake metadata and write
    let inner =
      MetadataInner::from_raw(&downloaded_data, Some(downloaded_hash)).context(ProcessSnafu)?;
    {
      *self.inner.write().await = inner;
    }

    // 4. Write to caches file
    let caches_file = Self::caches_file();
    if let Err(err) = tokio::fs::write(&caches_file, &downloaded_data).await {
      // This is not a critical error, just log it
      tracing::error!(
        message = "Failed to write metadata caches file",
        ?caches_file,
        ?err,
      );
    }

    // 5. Done
    info!(
      message = "Metadata update completed",
      elapsed = ?start.elapsed(),
      new_hash = ?latest_hash,
    );

    Ok(MetadataUpdateKind::Success(latest_hash))
  }

  #[tracing::instrument(skip(self))]
  pub fn update_with_retry(
    self: std::sync::Arc<Self>,
    max_attempts: Option<u8>,
  ) -> tokio::task::JoinHandle<Result<MetadataUpdateKind, MetadataUpdateError>> {
    const MAX_ATTEMPTS: u8 = 3;
    const MIN: std::time::Duration = std::time::Duration::from_secs(3);
    const MAX: std::time::Duration = std::time::Duration::from_secs(10);

    let max_attempts = max_attempts.unwrap_or(MAX_ATTEMPTS).max(5);
    let backoff = exponential_backoff::Backoff::new(max_attempts as _, MIN, MAX);
    let f = async move {
      'retry: {
        for duration in backoff {
          let result = self.update().await;

          match result {
            Ok(kind) => {
              // On success, dump the metadata
              // only for successful updates
              #[cfg(debug_assertions)]
              if matches!(kind, MetadataUpdateKind::Success(_)) {
                self.dump().await;
              }

              break 'retry Ok(kind);
            }
            // Retry on reqwest errors
            Err(MetadataUpdateError::Reqwest { ref source }) => {
              // When `duration` is `Some`, we can retry
              if let Some(d) = duration {
                tracing::error!(
                  message = "Metadata update failed due to network error, will retry...",
                  err = ?source,
                );

                tokio::time::sleep(d).await;
                continue;
              }

              // No more retries
              debug!("Metadata update max attempts reached, giving up");
              break 'retry result;
            }
            // Other errors are not retriable
            _ => break 'retry result,
          }
        }

        // The for loop will definitely be entered.
        // This part will not be executed.
        unreachable!()
      }
    };

    tokio::spawn(f)
  }

  #[inline]
  async fn fetch_api(pathname: &str) -> reqwest::Result<reqwest::Response> {
    use crate::constants;

    reqwest::Client::builder()
      .user_agent(constants::USER_AGENT)
      .build()?
      .get(format!("{}/{pathname}", Self::API_BASE_URL))
      .timeout(Self::API_TIMEOUT)
      .send()
      .await?
      .error_for_status()
  }

  #[tracing::instrument]
  async fn fetch_metadata_index() -> reqwest::Result<String> {
    #[derive(serde::Deserialize)]
    #[serde(rename_all = "PascalCase")]
    struct MetadataIndex {
      latest: String,
    }

    debug!("Checking for latest metadata version...");
    const PATHNAME: &str = "index.json";
    let index: MetadataIndex = Self::fetch_api(PATHNAME).await?.json().await?;
    info!("Latest metadata version: {:?}", index.latest);

    Ok(index.latest)
  }

  #[tracing::instrument]
  async fn fetch_metadata_data(hash: &str) -> reqwest::Result<reqwest::Response> {
    debug!(message = "Fetching metadata data...");
    let pathname = format!("{hash}.json");
    let data = Self::fetch_api(&pathname).await?;
    info!(
      message = "Metadata data fetched",
      len = data.content_length()
    );

    Ok(data)
  }
}

// Test only embedded metadata
#[cfg(test)]
static EMBEDDED: std::sync::LazyLock<MetadataInner> =
  std::sync::LazyLock::new(|| MetadataInner::new().expect("Failed to load embedded metadata"));

#[cfg(test)]
impl Metadata {
  pub fn embedded() -> &'static dyn hg_metadata::Metadata {
    &*EMBEDDED.metadata
  }
}

#[cfg(test)]
mod tests {
  use std::sync::Arc;

  use super::*;

  #[test]
  fn test_embedded() {
    let _ = Metadata::embedded();
  }

  #[cfg(not(feature = "disable-metadata-updater"))]
  #[test]
  fn test_update_error_serialize() {
    use crate::error::AppError;

    let error = MetadataUpdateError::Process {
      source: MetadataError::Bake {
        source: BakeMetadataError::MismatchedEntriesI18nLength {
          business_id: 0,
          locale: Arc::from("locale"),
          category: Arc::from("category"),
          entries: 1,
          item_names: 0,
        },
      },
    };

    let error = AppError::from(error);
    assert!(serde_json::to_string(&error).is_ok());
  }
}
