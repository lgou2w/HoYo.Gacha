use std::io;
use std::path::{Path, PathBuf};

use snafu::{ResultExt, Snafu};
use tokio::fs;
use tracing::error;

use crate::constants;
use crate::database::schemas::AccountBusiness;

#[derive(Debug, Snafu)]
#[snafu(context(suffix(false)))]
pub enum ImageResolveError {
  #[snafu(display("{source}"))]
  CreateDir { source: io::Error },

  #[snafu(display("{source}"))]
  ReadFile { source: io::Error },

  #[snafu(display("{source}"))]
  Reqwest { source: reqwest::Error },
}

pub const MIME_TYPE: &str = "image/avif";
pub const MIME_SUFFIX: &str = "avif";

/// Resolve an image for a given business, category, and item ID.
///
/// The resolution process follows these steps:
/// 1. Check the local cache for the image.
/// 2. If not found or corrupt, and if `online` is true, fetch the image from the remote server.
/// 3. Cache the fetched image (best-effort).
///
/// Returns `Ok(Some(data))` if the image is found or fetched successfully,
/// `Ok(None)` if not found and offline, or an error if any step fails.
#[tracing::instrument]
pub async fn resolve(
  business: AccountBusiness,
  item_category: String,
  mut item_id: u32,
  online: Option<bool>,
) -> Result<Option<Vec<u8>>, ImageResolveError> {
  // Miliastra Wonderland: CosmeticCatalog items outside the reserved range
  // reuse CosmeticComponent icons. See: previous HACK comment.
  let mut item_category = item_category.as_str();
  if business == AccountBusiness::MiliastraWonderland
    && item_category == "CosmeticCatalog"
    && !(275000..=275999).contains(&item_id)
  {
    item_category = "CosmeticComponent";
    item_id = item_id.saturating_sub(10_000);
  }

  let image_dir = cache_dir(business, item_category);
  let image_file = image_dir.join(format!("{item_id}.{MIME_SUFFIX}"));

  // 1. Local cache — read once, validate, and remove on corruption.
  match read_cached_avif(&image_file).await? {
    CacheOutcome::Hit(data) => return Ok(Some(data)),
    CacheOutcome::Missing | CacheOutcome::Corrupt => {}
  }

  // 2. Offline and no valid cache.
  if online != Some(true) {
    return Ok(None);
  }

  // 3. Fetch, cache (best-effort), and return.
  let url = build_url(business, item_category, item_id);
  let data = fetch_remote(&url).await?;

  // Write to local cache
  fs::create_dir_all(&image_dir).await.context(CreateDir)?;
  if let Err(err) = fs::write(&image_file, &data).await {
    // A cache write failure is not fatal — return the data anyway.
    error!(message = "Failed to write image cache", path = ?image_file, ?err);
  }

  Ok(Some(data))
}

// helpers

const CACHES_DIR: &str = "GachaImages";
const AVIF_HEADER_LEN: usize = 8;
const AVIF_FTYP: &[u8; 4] = b"ftyp";

// APPDATA/Local/${bundle_identifier}/${CACHES_DIR}/${business}/${category}
fn cache_dir(business: AccountBusiness, item_category: &str) -> PathBuf {
  constants::APP_LOCAL_DATA_DIR
    .join(CACHES_DIR)
    .join(business.as_str())
    .join(item_category)
}

// {API_URL}/{business}/{category}/{id}.avif
fn build_url(business: AccountBusiness, item_category: &str, item_id: u32) -> String {
  format!(
    "{base}/{keyof}/{category}/{id}.{suffix}",
    base = constants::API_URL,
    keyof = business.as_str(),
    category = item_category,
    id = item_id,
    suffix = MIME_SUFFIX,
  )
}

enum CacheOutcome {
  Hit(Vec<u8>),
  Missing,
  Corrupt,
}

/// Read and validate the cached AVIF.
///
/// Corrupt files are removed from disk so the next call can re-fetch them.
async fn read_cached_avif(path: &Path) -> Result<CacheOutcome, ImageResolveError> {
  let data = match fs::read(path).await {
    Ok(data) => data,
    Err(err) if err.kind() == io::ErrorKind::NotFound => return Ok(CacheOutcome::Missing),
    Err(err) => return Err(ImageResolveError::ReadFile { source: err }),
  };

  if !is_valid_avif(&data) {
    error!(message = "Bad avif image; removing cache entry", ?path);
    let _ = fs::remove_file(path).await;
    return Ok(CacheOutcome::Corrupt);
  }

  Ok(CacheOutcome::Hit(data))
}

/// Validate the AVIF header per the AV1-AVIF spec.
///
/// Checks that the first ISOBMFF box is `ftyp` and at least 8 bytes long.
/// https://aomediacodec.github.io/av1-avif/v1.0.0.html
fn is_valid_avif(data: &[u8]) -> bool {
  if data.len() < AVIF_HEADER_LEN {
    return false;
  }

  let box_size = u32::from_be_bytes([data[0], data[1], data[2], data[3]]) as usize;
  let box_type = &data[4..8];

  box_size >= AVIF_HEADER_LEN && box_type == AVIF_FTYP
}

async fn fetch_remote(url: &str) -> Result<Vec<u8>, ImageResolveError> {
  let response = constants::REQWEST
    .get(url)
    .send()
    .await
    .context(Reqwest)?
    .error_for_status()
    .context(Reqwest)?
    .bytes()
    .await
    .context(Reqwest)?;

  Ok(response.into())
}
