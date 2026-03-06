use cfg_if::cfg_if;

cfg_if! {if #[cfg(not(feature = "disable-app-updater"))] {
use std::fmt;
use std::path::{Path, PathBuf};
use std::str::FromStr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, LazyLock};
use std::time::{Duration, Instant};

use exponential_backoff::Backoff;
use regex::Regex;
use reqwest::{Client as Reqwest, Error as ReqwestError, StatusCode};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use snafu::{ResultExt, Snafu};
use tauri::ipc::Channel;
use time::OffsetDateTime;
use time::serde::rfc3339;
use tokio::fs::{self, File as TokioFile};
use tokio::io::AsyncWriteExt;
use tokio::sync::{watch, Mutex};
use tracing::{debug, error, info, trace};

use crate::constants;
use crate::error::{AppError, ErrorDetails};

/// Retries the given asynchronous operation with exponential backoff.
/// The operation will be retried up to `max_attempts` times
/// if it returns an error that satisfies the `should_retry` condition.
/// - `operation`: The asynchronous operation to be retried.
/// - `max_attempts`: The maximum number of retry attempts.
///   If `None`, a default value of 3 will be used. The value will be clamped between 0 and 5.
/// - `should_retry`: A function that takes an error and returns `true`
///   if the operation should be retried, or `false` if it should not be retried.
#[tracing::instrument(skip_all)]
async fn retry<F, Fut, T, E>(
  mut operation: F,
  max_attempts: Option<u8>,
  should_retry: impl Fn(&E) -> bool,
) -> Result<T, E>
where
  F: FnMut() -> Fut,
  Fut: Future<Output = Result<T, E>>,
  E: fmt::Debug,
{
  const MAX_ATTEMPTS: u8 = 3;
  const MIN: Duration = Duration::from_secs(3);
  const MAX: Duration = Duration::from_secs(10);

  let max_attempts = max_attempts.unwrap_or(MAX_ATTEMPTS).clamp(0, 5);
  let backoff = Backoff::new(max_attempts as _, MIN, MAX);
  let mut attempt = 0;

  for duration in backoff {
    attempt += 1;
    match operation().await {
      Ok(value) => {
        trace!("Operation succeeded on attempt {attempt}",);
        return Ok(value);
      }
      Err(err) => {
        if !should_retry(&err) {
          trace!("Non-retriable error on attempt {attempt}, stopping",);
          return Err(err);
        }

        // When `duration` is `Some`, we can retry
        if let Some(d) = duration {
          trace!("Attempt {attempt} failed, retrying after {d:?}, err: {err:?}");
          tokio::time::sleep(d).await;
          continue;
        }

        // No more retries
        trace!("Attempt {attempt} failed, no more retries",);
        return Err(err);
      }
    }
  }

  // The for loop will definitely be entered.
  // This part will not be executed.
  unreachable!()
}

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct TagName(u16, u16, u16);

impl fmt::Display for TagName {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    let Self(major, minor, patch) = self;
    f.write_fmt(format_args!("{major}.{minor}.{patch}"))
  }
}

impl FromStr for TagName {
  type Err = ();

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    static REGEX_TAG_NAME: LazyLock<Regex> =
      LazyLock::new(|| Regex::new(r"^(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)$").unwrap());

    if let Some(captures) = REGEX_TAG_NAME.captures(s) {
      let major = captures["major"].parse().map_err(|_| ())?;
      let minor = captures["minor"].parse().map_err(|_| ())?;
      let patch = captures["patch"].parse().map_err(|_| ())?;

      Ok(Self(major, minor, patch))
    } else {
      Err(())
    }
  }
}

impl Serialize for TagName {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    self.to_string().serialize(serializer)
  }
}

impl<'de> Deserialize<'de> for TagName {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: Deserializer<'de>,
  {
    let s: &str = Deserialize::deserialize(deserializer)?;
    Self::from_str(s).map_err(|_| {
      serde::de::Error::custom(format!(
        "Invalid tag name format: '{s}'. Expected format is 'major.minor.patch'"
      ))
    })
  }
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all(serialize = "camelCase", deserialize = "PascalCase"))]
pub struct LatestRelease {
  pub tag_name: TagName,
  #[serde(with = "rfc3339")]
  pub created_at: OffsetDateTime,
  pub name: String,
  pub size: u64,
  pub download_url: String,
}

const API_CONNECT_TIMEOUT: Duration = Duration::from_secs(30);
const API_READ_TIMEOUT: Duration = Duration::from_secs(60);

impl LatestRelease {
  async fn fetch() -> Result<Self, ReqwestError> {
    Reqwest::builder()
      .user_agent(constants::USER_AGENT)
      .connect_timeout(API_CONNECT_TIMEOUT)
      .read_timeout(API_READ_TIMEOUT)
      .build()?
      .get("https://hoyo-gacha-v1.lgou2w.com/Version/Latest.json")
      .send()
      .await?
      .error_for_status()?
      .json()
      .await
  }
}

// App Updater

static UPDATING: AtomicBool = AtomicBool::new(false);
static CURRENT_TAG_NAME: LazyLock<TagName> = LazyLock::new(|| constants::VERSION.parse().unwrap());

// Used to cache the latest release info to avoid making a request every time.
// Default TTL is 10 minutes, which should be a good balance between freshness and reducing unnecessary requests.
const LATEST_RELEASE_CACHE_TTL: Duration = Duration::from_secs(10 * 60);

#[allow(clippy::type_complexity)]
static LATEST_RELEASE_CACHE: LazyLock<Mutex<Option<(Instant, Arc<LatestRelease>)>>> =
  LazyLock::new(Mutex::default);

// Signal for manually cancelling download.
static DOWNLOAD_ABORT: LazyLock<Mutex<Option<watch::Sender<bool>>>> = LazyLock::new(Mutex::default);

pub struct Updater;

#[derive(Debug, Snafu)]
pub enum UpdaterError {
  #[snafu(display("Reqwest error"))]
  Reqwest { source: ReqwestError },

  #[snafu(display("I/O error"))]
  Io { source: std::io::Error },

  #[snafu(display("Downloaded size mismatch"))]
  DownloadedMismatch,

  #[snafu(display("Download aborted by user"))]
  Aborted,
}

impl ErrorDetails for UpdaterError {
  fn name(&self) -> &'static str {
    stringify!(UpdaterError)
  }

  fn details(&self) -> Option<serde_json::Value> {
    use serde_json::json;

    Some(match self {
      Self::Reqwest { source } => json!({
        "kind": stringify!(Reqwest),
        "cause": format_args!("{source:?}"),
      }),
      Self::Io { source } => json!({
        "kind": stringify!(Io),
        "cause": json!({
          "kind": format_args!("{:?}", source.kind()),
          "message": source.to_string(),
        })
      }),
      Self::DownloadedMismatch => json!({
        "kind": stringify!(DownloadedMismatch),
      }),
      Self::Aborted => json!({
        "kind": stringify!(Aborted),
      }),
    })
  }
}

#[derive(Debug, Serialize)]
pub enum UpdaterKind {
  Updating,
  UpToDate,
  Success,
}

impl Updater {
  pub fn is_updating() -> bool {
    UPDATING.load(Ordering::SeqCst)
  }

  #[tracing::instrument(skip_all)]
  pub async fn update<P>(
    progress_reporter: Option<P>,
    max_attempts: Option<u8>,
  ) -> Result<UpdaterKind, UpdaterError>
  where
    P: Fn(f32) + Send + Sync + 'static,
  {
    if UPDATING.swap(true, Ordering::SeqCst) {
      debug!("App update already in progress...");
      return Ok(UpdaterKind::Updating);
    }

    // region: UpdateGuard
    // Ensure the updating flag is reset on function exit
    struct UpdateGuard;
    impl Drop for UpdateGuard {
      fn drop(&mut self) {
        UPDATING.store(false, Ordering::SeqCst);
      }
    }
    let _update_guard = UpdateGuard;
    // endregion

    let start = std::time::Instant::now();

    // First: ensure the update directory exists
    let update_dir = constants::APP_LOCAL_DATA_DIR.join("Update");
    if !update_dir.exists() {
      fs::create_dir(&update_dir).await.context(IoSnafu)?;
    }

    // Delete the old version exe file after the previous update.
    let current_exe_bak_path = update_dir.join(format!("{}.HGBAK", constants::APP_NAME));
    if current_exe_bak_path.exists() {
      debug!("Removing old backup file: {current_exe_bak_path:?}",);
      let _ = fs::remove_file(&current_exe_bak_path).await;
    }

    // Create a cancellation channel that can be used to signal the download task
    // to stop if the user initiates another update while a download is in progress.
    let (abort_tx, abort_rx) = watch::channel(false);
    {
      let mut guard = DOWNLOAD_ABORT.lock().await;
      *guard = Some(abort_tx);
    }

    // region: CancelGuard
    // Ensure the cancellation channel is reset on function exit, so that it doesn't affect future updates.
    struct AbortGuard;
    impl Drop for AbortGuard {
      fn drop(&mut self) {
        tokio::spawn(async {
          let mut guard = DOWNLOAD_ABORT.lock().await;
          *guard = None;
        });
      }
    }
    let _abort_guard = AbortGuard;
    // endregion

    // 1. Check if the latest cached version exists
    //   to avoid making a request every time.
    let latest = Self::latest_release(max_attempts)
      .await
      .context(ReqwestSnafu)?;

    // 2. if greater than or equal to, return early
    debug!(
      message = "Current version",
      current = ?*CURRENT_TAG_NAME,
      ?latest.tag_name,
      ?latest.created_at
    );

    if *CURRENT_TAG_NAME >= latest.tag_name {
      info!(
        message = "App version is already up-to-date",
        current = ?*CURRENT_TAG_NAME,
        latest = ?latest.tag_name
      );
      return Ok(UpdaterKind::UpToDate);
    }

    // 3. Start download latest release
    debug!(message = "Starting download of latest release...", ?latest.download_url);
    let downloaded = Self::download(
      &update_dir,
      &latest,
      Arc::new(progress_reporter),
      max_attempts,
      Arc::new(Mutex::new(abort_rx)),
    ).await?;

    // 4. Replace current exe
    //   Move the current exe to a backup file, then move the downloaded file to the exe path.
    cfg_if! {if #[cfg(not(debug_assertions))] {
      // (Production only)
      debug!("Replacing current exe...");
      fs::rename(&*constants::EXE_PATH, &current_exe_bak_path)
        .await
        .context(IoSnafu)?;

      // Rollback to the original exe if renaming the downloaded file fails,
      // to avoid leaving the app in a broken state.
      if let Err(e) = fs::rename(downloaded, &*constants::EXE_PATH).await {
        use snafu::IntoError;
        let _ = fs::rename(&current_exe_bak_path, &*constants::EXE_PATH).await;
        return Err(IoSnafu.into_error(e))
      }
    } else {
      // (Debug only)
      let _ = fs::remove_file(downloaded).await;
    }}

    // 5. Reset cache to force reload the latest release info on next update check
    {
      let mut guard = LATEST_RELEASE_CACHE.lock().await;
      guard.take();
      debug!("Cleared latest release cache");
    }

    info!(
      message = "App updated successfully",
      elapsed = ?start.elapsed(),
      ?latest,
    );

    Ok(UpdaterKind::Success)
  }

  #[tracing::instrument(skip_all)]
  pub async fn latest_release(
    max_attempts: Option<u8>,
  ) -> Result<Arc<LatestRelease>, ReqwestError> {
    // First, use cached
    {
      let mut guard = LATEST_RELEASE_CACHE.lock().await;
      if let Some((fetch_time, cached)) = guard.as_ref() {
        if fetch_time.elapsed() < LATEST_RELEASE_CACHE_TTL {
          debug!(
            "Using cached latest release (Age: {:?})",
            fetch_time.elapsed()
          );
          return Ok(Arc::clone(cached));
        } else {
          debug!("Cached expired, will fetch");
          guard.take();
        }
      } else {
        debug!("No cached latest release found");
      }
    }

    info!("Checking for app updates...");
    let latest_release = retry(LatestRelease::fetch, max_attempts, |err| {
      // Retry on Reqwest errors
      error!(
        message = "Failed to fetch the latest release, retrying...",
        ?err
      );

      true
    })
    .await?;

    let arc = Arc::new(latest_release);

    // Update cached
    {
      let mut guard = LATEST_RELEASE_CACHE.lock().await;
      guard.replace((Instant::now(), Arc::clone(&arc)));
    }

    Ok(arc)
  }

  // region: private
  #[tracing::instrument(skip_all)]
  async fn download<P>(
    update_dir: &Path,
    latest_release: &LatestRelease,
    progress_reporter: Arc<Option<P>>,
    max_attempts: Option<u8>,
    abort_rx: Arc<Mutex<watch::Receiver<bool>>>,
  ) -> Result<PathBuf, UpdaterError>
  where
    P: Fn(f32) + Send + Sync + 'static,
  {
    retry(
      || {
        let progress_reporter = Arc::clone(&progress_reporter);
        let abort_rx = Arc::clone(&abort_rx);
        async move {
          let mut rx = abort_rx.lock().await;
          Self::download_with_resume(update_dir, latest_release, progress_reporter, &mut rx).await
        }
      },
      max_attempts,
      |err| {
        let should_retry = matches!(err, UpdaterError::Reqwest { .. });
        if should_retry {
          error!(
            message = "Latest release downloaded failed, retrying...",
            ?err
          );
        }

        should_retry
      },
    )
    .await
  }

  #[tracing::instrument(skip_all)]
  async fn download_with_resume<P>(
    update_dir: &Path,
    latest_release: &LatestRelease,
    progress_reporter: Arc<Option<P>>,
    abort_rx: &mut watch::Receiver<bool>,
  ) -> Result<PathBuf, UpdaterError>
  where
    P: Fn(f32) + Send + Sync + 'static,
  {
    // Helper macro to report progress if the callback is provided
    macro_rules! progress {
      ($value:expr) => {
        if let Some(f) = progress_reporter.as_ref() {
          f($value);
        }
      };
    }

    // Use a temporary file to support resuming downloads and
    // avoid leaving a corrupted file if the download is interrupted.
    let temp_path = update_dir.join(format!("{}.tmp", &latest_release.name));
    let target_path = update_dir.join(&latest_release.name);
    let total_size = latest_release.size;

    trace!(
      message = "Starting download...",
      ?target_path,
      ?temp_path,
      total_size
    );

    // If the target file already exists and has the expected size, return it immediately.
    if target_path.exists() {
      let meta = fs::metadata(&target_path).await.context(IoSnafu)?;
      trace!("Target file exists, size={}", meta.len());

      if meta.len() == total_size {
        trace!("Target file already complete, returning");
        progress! { 1.0 };
        return Ok(target_path);
      } else {
        trace!("Target file incomplete, removing");
        fs::remove_file(&target_path).await.context(IoSnafu)?;
      }
    }

    // Check if a temporary file exists from a previous download attempt.
    let mut downloaded: u64 = 0;
    if temp_path.exists() {
      let len = fs::metadata(&temp_path).await.context(IoSnafu)?.len();
      trace!("Temp file exists, size={len}");

      if len > total_size {
        trace!("Temp file larger than expected, removing");
        fs::remove_file(&temp_path).await.context(IoSnafu)?;
      } else {
        downloaded = len;
      }
    } else {
      trace!("Temp file does not exist");
    }

    // If the downloaded size matches the total size,
    // rename the temp file to the target file and return it.
    if downloaded == total_size {
      trace!("Temp file already complete, renaming to target");
      fs::rename(&temp_path, &target_path)
        .await
        .context(IoSnafu)?;

      progress! { 1.0 };
      return Ok(target_path);
    }

    // Start or resume downloading the file. If the server does not support range requests,
    // we will retry without the Range header.
    trace!("Resuming download from byte {downloaded}");
    let mut current = downloaded;
    let mut retry_without_range = false;
    loop {
      // Check if the download has been cancelled by the user before making each request.
      if *abort_rx.borrow_and_update() {
        trace!("Download aborted by user");
        // Don't remove the temp file here to allow resuming later, but we could also choose to remove it to free up space.
        // if temp_path.exists() {
        //   let _ = fs::remove_file(&temp_path).await;
        // }
        return Err(UpdaterError::Aborted);
      }

      trace!(message = "Building request", current, retry_without_range);
      let mut request = Reqwest::builder()
        .user_agent(constants::USER_AGENT)
        .connect_timeout(API_CONNECT_TIMEOUT)
        .read_timeout(API_READ_TIMEOUT)
        .build()
        .context(ReqwestSnafu)?
        .get(&latest_release.download_url);

      // If we have already downloaded some bytes, add the Range header to request the remaining bytes.
      if current > 0 && !retry_without_range {
        request = request.header(reqwest::header::RANGE, format!("bytes={current}-"));
        trace!("Added Range header: bytes={current}-");
      }

      let mut response = request
        .send()
        .await
        .context(ReqwestSnafu)?
        .error_for_status()
        .context(ReqwestSnafu)?;

      // Check if the server supports range requests by looking at the response status code.
      // If the server does not support range requests and we have already downloaded some bytes,
      // we need to delete the temporary file and start the download from the beginning.
      let supports_range = response.status() == StatusCode::PARTIAL_CONTENT;
      trace!(
        message = "Response status",
        response.status = ?response.status(),
        supports_range
      );

      if current > 0 && !supports_range && !retry_without_range {
        trace!("Server does not support range, restarting download from scratch");
        fs::remove_file(&temp_path).await.context(IoSnafu)?;
        retry_without_range = true;
        current = 0;
        continue;
      }

      trace!(
        "Opening temp file for writing (append={})",
        !retry_without_range
      );
      let mut temp_file = TokioFile::options()
        .create(true)
        .append(!retry_without_range)
        .open(&temp_path)
        .await
        .context(IoSnafu)?;

      // If we are retrying without the Range header, we need to truncate the temporary file
      // to remove the previously downloaded bytes, since the server will send the entire file again.
      if retry_without_range {
        trace!("Truncating temp file to 0");
        temp_file.set_len(0).await.context(IoSnafu)?;
      }

      // Stream the response body and write it to the temporary file, while reporting progress.
      trace!("Starting body stream");
      while let Some(chunk) = response.chunk().await.context(ReqwestSnafu)? {
        // Check if the download has been aborted by the user during streaming.
        if *abort_rx.borrow_and_update() {
          trace!("Download aborted by user during streaming");
          // Don't remove the temp file here to allow resuming later, but we could also choose to remove it to free up space.
          // let _ = fs::remove_file(&temp_path).await;
          return Err(UpdaterError::Aborted);
        }

        // Write the chunk to the temporary file and update the progress.
        temp_file.write_all(&chunk).await.context(IoSnafu)?;
        current += chunk.len() as u64;
        progress! { current as f32 / total_size as f32 };

        // // For debug
        // #[cfg(debug_assertions)]
        // trace!(
        //   "Received chunk: {} bytes, total={current}/{total_size}",
        //   chunk.len()
        // )
      }

      // Ensure all data is flushed to disk before renaming the file.
      // and break the loop to finish the download process.
      temp_file.flush().await.context(IoSnafu)?;
      trace!("Download completed, final size={current}");
      break;
    }

    // Check if the downloaded size matches the expected total size.
    // If not, delete the temporary file and return an error.
    if current != total_size {
      error!(
        "Size mismatch: expected {}, got {}. Removing temp file.",
        total_size, current
      );
      fs::remove_file(&temp_path).await.context(IoSnafu)?;
      return Err(UpdaterError::DownloadedMismatch);
    }

    // Rename the temporary file to the target file, replacing it if it already exists.
    trace!("Renaming temp file to target");
    fs::rename(temp_path, &target_path).await.context(IoSnafu)?;
    Ok(target_path)
  }
  // endregion
}
}}

// Handlers

cfg_if! {if #[cfg(not(feature = "disable-app-updater"))] {
  #[tauri::command]
  pub async fn updater_is_updating() -> bool {
    Updater::is_updating()
  }

  #[tauri::command]
  pub async fn updater_update(
    progress_channel: Channel<f32>,
    max_attempts: Option<u8>,
  ) -> Result<UpdaterKind, AppError<UpdaterError>> {
    Updater::update(
      Some(move |progress| {
        let _ = progress_channel.send(progress);
      }),
      max_attempts
    )
      .await
      .map_err(AppError::from)
  }

  #[tauri::command]
  pub async fn updater_update_abort() {
    let mut guard = DOWNLOAD_ABORT.lock().await;
    if let Some(tx) = guard.as_ref() {
      let _ = tx.send(true);
      *guard = None;
      trace!("Sent abort signal for ongoing update");
    }
  }

  #[tauri::command]
  pub async fn updater_latest_release(
    max_attempts: Option<u8>,
  ) -> Result<(Arc<LatestRelease>, bool), AppError<UpdaterError>> {
    let latest = Updater::latest_release(max_attempts)
      .await
      .context(ReqwestSnafu)
      .map_err(AppError::from)?;

    let can_update = latest.tag_name > *CURRENT_TAG_NAME;
    Ok((latest, can_update))
  }
} else {
  // Feature disabled

  #[tauri::command]
  pub fn updater_is_updating() -> bool { false }

  #[tauri::command]
  pub fn updater_update() {}

  #[tauri::command]
  pub async fn updater_update_abort() {}

  #[tauri::command]
  pub async fn updater_latest_release() {}
}}
