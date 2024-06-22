use std::collections::HashMap;
use std::fmt;
use std::fs::{read_dir, File};
use std::future::Future;
use std::io::{BufRead, BufReader};
use std::ops::Deref;
use std::path::{Path, PathBuf};
use std::time::Duration;

use async_trait::async_trait;
use exponential_backoff::Backoff;
use futures_util::future::BoxFuture;
use futures_util::FutureExt;
use once_cell::sync::Lazy;
use regex::Regex;
use serde::de::IntoDeserializer;
use serde::ser::SerializeStruct;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use serde_json::json;
use time::serde::rfc3339;
use time::OffsetDateTime;
use tokio::sync::mpsc::{channel, Sender};
use tokio::task::{spawn, JoinHandle};
use tokio::time::sleep;
use tracing::{info, warn};
use url::Url;

use crate::constants;
use crate::diskcache::{BlockFile, IndexFile};
use crate::gacha::dict::embedded as GachaDictionaryEmbedded;
use crate::models::{AccountBusiness, AccountIdentifier, GachaRecord, GachaRecordRank};
use crate::utilities::paths::{cognosphere_dir, mihoyo_dir};

mod plugin;

pub use plugin::*;

// Error

#[derive(Debug, thiserror::Error)]
pub enum GachaBusinessError {
  #[error(transparent)]
  IO(#[from] std::io::Error),

  #[error(transparent)]
  Reqwest(#[from] reqwest::Error),

  #[error("The gacha url is an illegal: {0:?}")]
  IllegalGachaUrl(IllegalGachaUrlKind),

  // Only if retcode is not 0
  #[error("Response error when fetching gacha records: {0:?}")]
  GachaRecordsResponse(GachaRecordsResponseKind),

  #[error("Error while fetcher channel join: {0}")]
  FetcherChannelJoin(String),

  #[error("Error while fetcher channel interrupt: {0}")]
  FetcherChannelInterrupt(Box<dyn std::error::Error + Send + Sync>),
}

// TODO: Optimize
impl GachaBusinessError {
  fn kind(&self) -> impl Serialize {
    match self {
      Self::IO(_) => json!("IO"),
      Self::Reqwest(_) => json!("Reqwest"),
      Self::IllegalGachaUrl(kind) => {
        json!({
          "name": "IllegalGachaUrl",
          "inner": match kind {
            IllegalGachaUrlKind::MissingParameter(params) => format!("MissingParameter({params})"),
            _ => format!("{kind:?}")
          }
        })
      }
      Self::GachaRecordsResponse(kind) => {
        json!({
          "name": "GachaRecordsResponse",
          "inner": match kind {
            GachaRecordsResponseKind::AuthkeyTimeout |
            GachaRecordsResponseKind::VisitTooFrequently => json!(format!("{kind:?}")),
            GachaRecordsResponseKind::Unknown { retcode, message } => json!({
              "retcode": retcode,
              "message": message
            }),
          }
        })
      }
      Self::FetcherChannelJoin(_) => json!("FetcherChannelJoin"),
      Self::FetcherChannelInterrupt(_) => json!("FetcherChannelInterrupt"),
    }
  }
}

impl Serialize for GachaBusinessError {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    let mut state = serializer.serialize_struct("Error", 3)?;
    state.serialize_field("identifier", stringify!(GachaBusinessError))?;
    state.serialize_field("message", &self.to_string())?;
    state.serialize_field("kind", &self.kind())?;
    state.end()
  }
}

#[derive(Debug)]
pub enum IllegalGachaUrlKind {
  Invalid,
  MissingParameter(&'static str),
  ParseFailed,
}

#[derive(Debug)]
pub enum GachaRecordsResponseKind {
  // retcode: -101, message: "authkey timeout"
  AuthkeyTimeout,

  // retcode: -110, message: "visit too frequently"
  VisitTooFrequently,

  // Other error retcodes
  Unknown { retcode: i32, message: String },
}

impl GachaRecordsResponseKind {
  fn from(retcode: i32, message: String) -> Self {
    debug_assert!(retcode != 0, "Zero is not an error retcode");
    match retcode {
      -101 => Self::AuthkeyTimeout,
      -110 => Self::VisitTooFrequently,
      _ => Self::Unknown { retcode, message },
    }
  }
}

// Business

pub trait BusinessDeclare {
  fn business(&self) -> &'static AccountBusiness;
}

/// `Web Caches` version number. For example: `x.y.z` or `x.y.z.a`
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct WebCachesVersion(u8, u8, u8, Option<u8>);

impl fmt::Display for WebCachesVersion {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    if let Some(patch) = self.3 {
      write!(f, "{}.{}.{}.{}", self.0, self.1, self.2, patch)
    } else {
      write!(f, "{}.{}.{}", self.0, self.1, self.2)
    }
  }
}

static REGEX_WEB_CACHES_VERSION: Lazy<Regex> = Lazy::new(|| {
  Regex::new(r"^(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)(\.(?P<build>\d+))?$").unwrap()
});

impl WebCachesVersion {
  fn parse(version: impl AsRef<str>) -> Option<Self> {
    if let Some(captures) = REGEX_WEB_CACHES_VERSION.captures(version.as_ref()) {
      let major = captures["major"].parse().unwrap();
      let minor = captures["minor"].parse().unwrap();
      let patch = captures["patch"].parse().unwrap();
      let build = captures
        .name("build")
        .map(|build| build.as_str().parse::<u8>().unwrap());

      Some(WebCachesVersion(major, minor, patch, build))
    } else {
      None
    }
  }
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DataDirectory {
  pub path: PathBuf,
  pub is_oversea: bool,
  // pub is_cloud: bool, // TODO: Cloud
}

pub trait DataDirectoryFinder: BusinessDeclare {
  fn find_data_dir(&self, is_oversea: bool) -> Result<Option<DataDirectory>, GachaBusinessError>;
  fn find_data_dirs(&self) -> Result<Vec<DataDirectory>, GachaBusinessError> {
    info!(
      "Finding the Business({:?}) data directories...",
      self.business()
    );
    let mut paths = Vec::with_capacity(2);

    // CN Server
    if let Some(cn) = self.find_data_dir(false)? {
      info!("Existing CN Server Data directory: {cn:?}");
      paths.push(cn);
    }

    // Oversea Server
    if let Some(os) = self.find_data_dir(true)? {
      info!("Existing Oversea Server Data directory: {os:?}");
      paths.push(os);
    }

    Ok(paths)
  }

  // ${GAME_DATA_DIR}/webCaches/${VERSION}
  fn find_web_caches_versions(
    &self,
    game_data_dir: &DataDirectory,
  ) -> Result<Vec<WebCachesVersion>, GachaBusinessError> {
    info!(
      "Finding the Business({:?}) webCaches versions: {game_data_dir:?}",
      self.business()
    );

    let web_caches_dir = game_data_dir.path.join("webCaches");
    let mut web_caches_versions = Vec::new();

    for entry in read_dir(web_caches_dir)? {
      let entry_path = entry?.path();
      if !entry_path.is_dir() {
        continue;
      }

      let entry_name = entry_path.file_name().unwrap().to_string_lossy();
      if let Some(version) = WebCachesVersion::parse(&entry_name) {
        info!("Existence of version number: {entry_name}");
        web_caches_versions.push(version);
      }
    }

    Ok(web_caches_versions)
  }

  // ${GAME_DATA_DIR}/webCaches/${VERSION}/Cache/Cache_Data
  fn find_web_caches_latest_data_dir(
    &self,
    game_data_dir: &DataDirectory,
  ) -> Result<Option<PathBuf>, GachaBusinessError> {
    info!(
      "Finding the latest version of the Business({:?}) webCaches data directory: {game_data_dir:?}",
      self.business()
    );

    let mut web_caches_versions = self.find_web_caches_versions(game_data_dir)?;
    if web_caches_versions.is_empty() {
      warn!("No WebCaches versions available");
      return Ok(None);
    }

    // Sort by version asc
    web_caches_versions.sort();

    // Get the latest version
    let latest_version = web_caches_versions.last().unwrap();
    let cache_data_dir = game_data_dir
      .path
      .join("webCaches")
      .join(latest_version.to_string())
      .join("Cache")
      .join("Cache_Data");

    info!(
      "WebCaches latest version data directory: {:?}",
      cache_data_dir
    );

    Ok(Some(cache_data_dir))
  }
}

/// The gacha url does not know the owner of the `uid`.
///
/// It can only be learned from a record after a successful request.
/// Provided the record is not an empty list.
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GachaUrl {
  pub addr: u32,     // Disk cache -> index -> Cache address
  pub long_key: u32, // Entry store -> long key -> data_2
  #[serde(with = "rfc3339")]
  pub creation_time: OffsetDateTime, // Url creation time: Generally valid for 1 day
  pub value: String, // Gacha url
}

// gacha_url.value -> &str
impl AsRef<str> for GachaUrl {
  fn as_ref(&self) -> &str {
    &self.value
  }
}

static REGEX_GACHA_URL: Lazy<Regex> = Lazy::new(|| {
  Regex::new(r"^https:\/\/.*(mihoyo.com|hoyoverse.com).*(\/getGachaLog\?).*(authkey\=).*$").unwrap()
});

pub trait GachaUrlFinder: BusinessDeclare + DataDirectoryFinder {
  /// Reads all gacha urls from the `disk cache` and sorts them by creation date `desc`.
  ///
  /// If the `Data directory` or `WebCaches directory` is not available, the result is a `None`.
  fn find_gacha_urls(
    &self,
    game_data_dir: &DataDirectory,
    skip_expired: bool,
  ) -> Result<Option<Vec<GachaUrl>>, GachaBusinessError> {
    info!(
      "Finding the Business({:?}) gacha urls: DataDirectory={game_data_dir:?}, SkipExpired={skip_expired}",
      self.business()
    );

    let cache_data_dir = self.find_web_caches_latest_data_dir(game_data_dir)?;
    if cache_data_dir.is_none() {
      warn!("No WebCaches data directory available");
      return Ok(None);
    }

    // Read index file and data_1, data_2 block files
    info!("Starting to read disk cache data...");
    let cache_data_dir = cache_data_dir.unwrap();

    info!("Reading index file...");
    let index_file = IndexFile::from_file(cache_data_dir.join("index"))?;

    info!("Reading block data_1 file...");
    let block_file1 = BlockFile::from_file(cache_data_dir.join("data_1"))?;

    info!("Reading block data_2 file...");
    let block_file2 = BlockFile::from_file(cache_data_dir.join("data_2"))?;

    let mut urls = Vec::new();
    let now_local = OffsetDateTime::now_utc().to_offset(*constants::CURRENT_LOCAL_OFFSET);

    // Foreach the cache address table of the index file
    info!("Foreach the cache address table of the index file...");
    for addr in index_file.table {
      // The previous places should not print logs.
      // Because the table of cache address is too large.
      //debug!("Read the entry store at cache address: {addr:?}");

      // Read the entry store from the data_1 block file by cache address
      let entry_store = block_file1.read_entry_store(&addr)?;

      // Gacha url must be a long key and stored in the data_2 block file,
      // So the long key of entry store must not be zero.
      if !entry_store.has_long_key() {
        continue;
      }

      // Maybe the long key points to data_3 or something else
      // See: https://github.com/lgou2w/HoYo.Gacha/issues/15
      if entry_store.long_key.file_number() != block_file2.header.this_file as u32 {
        continue;
      }

      // Read the long key of entry store from the data_2 block file
      let url = entry_store.read_long_key(&block_file2)?;

      // These url start with '1/0/', only get the later part
      let url = if let Some(stripped) = url.strip_prefix("1/0/") {
        stripped
      } else {
        &url
      };

      // Verify that the url is the correct gacha url
      if !REGEX_GACHA_URL.is_match(url) {
        continue;
      }

      // Convert creation time
      let creation_time = {
        let timestamp = (entry_store.creation_time / 1_000_000) as i64 - 11_644_473_600;
        OffsetDateTime::from_unix_timestamp(timestamp)
          .unwrap() // FIXME: SAFETY?
          .to_offset(*constants::CURRENT_LOCAL_OFFSET)
      };

      // By default, this gacha url is valid for 1 day.
      if skip_expired && creation_time + time::Duration::DAY < now_local {
        continue; // It's expired
      }

      info!("Valid gacha url exist in the cache address: {addr:?}");
      info!("Long key: {:?}", entry_store.long_key);
      info!("Creation time: {creation_time:?}");
      info!("Url: {url}");
      urls.push(GachaUrl {
        addr: addr.0,
        long_key: entry_store.long_key.0,
        creation_time,
        value: url.to_owned(),
      })
    }

    // Sort by creation time desc
    urls.sort_by(|a, b| b.creation_time.cmp(&a.creation_time));

    info!("Total number of gacha urls found: {}", urls.len());

    Ok(Some(urls))
  }
}

#[derive(Deserialize)]
struct GachaRecordsResponse {
  retcode: i32,
  message: String,
  data: Option<GachaRecordsPagination>,
}

impl GachaRecordsResponse {
  fn is_empty_data(&self) -> bool {
    match &self.data {
      None => true,
      Some(data) => data.list.is_empty(),
    }
  }
}

#[derive(Deserialize)]
struct GachaRecordsPagination {
  // page: String,
  // size: String,
  // total: String, // `Honkai: Star Rail` only
  list: Vec<GachaRecordsPaginationItem>,
  region: String,
  region_time_zone: Option<i8>, // `Honkai: Star Rail` only
}

async fn request_gacha_url(url: Url) -> Result<GachaRecordsResponse, GachaBusinessError> {
  let response: GachaRecordsResponse = constants::REQWEST.get(url).send().await?.json().await?;
  let retcode = response.retcode;
  if retcode != 0 {
    Err(GachaBusinessError::GachaRecordsResponse(
      GachaRecordsResponseKind::from(retcode, response.message),
    ))
  } else {
    Ok(response)
  }
}

fn request_gacha_url_with_retry(
  url: Url,
  retries: Option<u8>,
) -> BoxFuture<'static, Result<GachaRecordsResponse, GachaBusinessError>> {
  // HACK: Default maximum 5 attempts
  const RETRIES: u8 = 5;

  let min = Duration::from_millis(200); // Min: 0.2s
  let max = Duration::from_millis(10_000); // Max: 10s

  let retries = retries.unwrap_or(RETRIES);
  let backoff = Backoff::new(retries as u32, min, max);

  async move {
    for duration in &backoff {
      match request_gacha_url(url.clone()).await {
        // okay
        Ok(response) => return Ok(response),

        // Wait and retry only if the error is VisitTooFrequently.
        Err(GachaBusinessError::GachaRecordsResponse(
          GachaRecordsResponseKind::VisitTooFrequently,
        )) => {
          warn!(
            "Requesting gacha url visit too frequently, wait({}s) and retry...",
            duration.as_secs_f32()
          );
          sleep(duration).await;
          continue;
        }

        // Other errors are returned
        Err(error) => return Err(error),
      }
    }

    // Maximum number of retries reached
    warn!("Maximum number of retries exceeded: {retries}");
    Err(GachaBusinessError::GachaRecordsResponse(
      GachaRecordsResponseKind::VisitTooFrequently,
    ))
  }
  .boxed()
}

fn string_as_number<'de, D, T>(de: D) -> Result<T, D::Error>
where
  D: Deserializer<'de>,
  T: TryFrom<u64>,
  T::Error: fmt::Display,
{
  let str = String::deserialize(de)?;
  let num = str.parse::<u64>().map_err(serde::de::Error::custom)?;
  T::try_from(num).map_err(serde::de::Error::custom)
}

fn empty_string_as_none<'de, D, T>(de: D) -> Result<Option<T>, D::Error>
where
  D: Deserializer<'de>,
  T: Deserialize<'de>,
{
  let opt = Option::<String>::deserialize(de)?;
  match opt.as_deref() {
    None | Some("") => Ok(None),
    Some(s) => T::deserialize(s.into_deserializer()).map(Some),
  }
}

fn gacha_id_de<'de, D>(de: D) -> Result<Option<u32>, D::Error>
where
  D: Deserializer<'de>,
{
  let opt: Option<String> = empty_string_as_none(de)?;
  match opt.as_deref() {
    None => Ok(None),
    Some(str) => {
      let num: u64 = string_as_number(str.into_deserializer())?;
      let res = u32::try_from(num).map_err(serde::de::Error::custom)?;
      Ok(Some(res))
    }
  }
}

#[derive(Deserialize)]
struct GachaRecordsPaginationItem {
  id: String,
  #[serde(deserialize_with = "string_as_number")]
  uid: u32,
  #[serde(deserialize_with = "string_as_number")]
  gacha_type: u32,
  #[serde(deserialize_with = "gacha_id_de", default = "Option::default")]
  gacha_id: Option<u32>, // `Honkai: Star Rail` only
  #[serde(deserialize_with = "string_as_number")]
  rank_type: u8,
  #[serde(deserialize_with = "string_as_number")]
  count: u32,
  time: String,
  lang: String,
  name: String,
  item_type: String,
  #[serde(deserialize_with = "empty_string_as_none", default = "Option::default")]
  item_id: Option<String>, // `Honkai: Star Rail` only
}

fn parse_gacha_url(
  gacha_url: &str,
  gacha_type: Option<&str>,
  end_id: Option<&str>,
) -> Result<Url, GachaBusinessError> {
  let query_start = gacha_url
    .find('?')
    .ok_or(GachaBusinessError::IllegalGachaUrl(
      IllegalGachaUrlKind::Invalid,
    ))?;

  let base_url = &gacha_url[..query_start];
  let query_str = &gacha_url[query_start + 1..];

  let mut queries = url::form_urlencoded::parse(query_str.as_bytes())
    .into_owned()
    .collect::<HashMap<String, String>>();

  let origin_gacha_type = queries
    .get("gacha_type")
    .cloned()
    .or(queries.get("init_type").cloned())
    .ok_or_else(|| {
      warn!("Gacha url missing important 'gacha_type' or 'init_type' parameters: {queries:?}");
      GachaBusinessError::IllegalGachaUrl(IllegalGachaUrlKind::MissingParameter(
        "Missing parameters: 'gacha_type' or 'init_type'",
      ))
    })?;

  let origin_end_id = queries.get("end_id").cloned();
  let gacha_type = gacha_type.unwrap_or(&origin_gacha_type);

  // Deletion and modification of some query parameters
  queries.remove("gacha_type");
  queries.remove("page");
  queries.remove("size");
  queries.remove("begin_id");
  queries.remove("end_id");
  queries.insert("page".into(), "1".into());
  queries.insert("size".into(), "20".into());
  queries.insert("gacha_type".into(), gacha_type.into());
  if let Some(end_id) = end_id.or(origin_end_id.as_deref()) {
    queries.insert("end_id".into(), end_id.into());
  }

  Url::parse_with_params(base_url, queries).map_err(|e| {
    // Normally, this is never reachable here.
    // Unless it's a `url` crate issue.
    warn!("Error parsing gacha url with params: {e}");
    GachaBusinessError::IllegalGachaUrl(IllegalGachaUrlKind::ParseFailed)
  })
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GachaUrlMetadata {
  pub region: String,
  pub region_time_zone: Option<i8>, // 'Honkai: Star Rail' only
  pub lang: Option<String>,         // When the data list is not empty
  pub uid: Option<u32>,             // When the data list is not empty
}

#[async_trait]
pub trait GachaRecordsFetcher: BusinessDeclare + Send + Sync {
  /// If it is an `empty records` data, then it always return `None`.
  #[allow(dead_code)]
  async fn fetch_gacha_records(
    &self,
    gacha_url: &str,
  ) -> Result<Option<Vec<GachaRecord>>, GachaBusinessError> {
    self.fetch_gacha_records_with(gacha_url, None, None).await
  }

  /// If it is an `empty records` data, then it always return `None`.
  async fn fetch_gacha_records_with(
    &self,
    gacha_url: &str,
    gacha_type: Option<&str>,
    end_id: Option<&str>,
  ) -> Result<Option<Vec<GachaRecord>>, GachaBusinessError> {
    info!(
      "Fetching the Business({:?}) gacha records: GachaType={gacha_type:?}, EndId={end_id:?}",
      self.business()
    );

    let gacha_url = parse_gacha_url(gacha_url, gacha_type, end_id)?;
    let pagination = match request_gacha_url_with_retry(gacha_url, None).await {
      Err(error) => {
        warn!("Responded with an error while fetching the gacha records: {error:?}");
        return Err(error);
      }
      Ok(response) => {
        if response.is_empty_data() {
          return Ok(None); // Empty records -> return None
        } else {
          response.data.unwrap() // SAFETY
        }
      }
    };

    let business = self.business();
    let mut records = Vec::with_capacity(pagination.list.len());
    for value in pagination.list {
      // HACK: It's usually fine. When try_from fails,
      //   print the uid details and interrupt the program.
      let uid = AccountIdentifier::try_from(value.uid).expect("Illegal account uid");

      // If `item_id` is not available,
      // then look up the mapping of `name` from the embedded dictionary.
      let item_id = if let Some(item_id) = value.item_id {
        item_id
      } else if let Some(entry) = GachaDictionaryEmbedded::name(business, &value.lang, &value.name)
      {
        entry.item_id.to_owned()
      } else {
        // If the embedded dictionary does not have a mapping for `name`,
        // then a warning is issued and the empty string is used.
        warn!(
          "Missing entry in embedded dictionary: business({business:?}), lang({}), lang({})",
          value.lang, value.name
        );
        String::default()
      };

      records.push(GachaRecord {
        id: value.id,
        business: *business,
        uid,
        gacha_type: value.gacha_type,
        gacha_id: value.gacha_id,
        rank_type: GachaRecordRank::try_from(value.rank_type).unwrap(), // FIXME: SAFETY?
        count: value.count,
        time: value.time,
        lang: value.lang,
        name: value.name,
        item_type: value.item_type,
        item_id,
      })
    }

    Ok(Some(records))
  }

  /// Requests a gacha url and tries to get metadata and the uid owner of a record.
  /// If the response is null, then the result is always `None`.
  async fn fetch_gacha_url_metadata(
    &self,
    gacha_url: &str,
  ) -> Result<Option<GachaUrlMetadata>, GachaBusinessError> {
    let gacha_url = parse_gacha_url(gacha_url, None, None)?;
    let response = request_gacha_url(gacha_url).await?;

    if let Some(pagination) = response.data {
      let lang = pagination.list.first().map(|r| r.lang.clone());
      let uid = pagination.list.first().map(|r| r.uid);

      Ok(Some(GachaUrlMetadata {
        region: pagination.region,
        region_time_zone: pagination.region_time_zone,
        lang,
        uid,
      }))
    } else {
      Ok(None)
    }
  }
}

// Inner

pub trait GachaBusinessInner:
  BusinessDeclare + DataDirectoryFinder + GachaUrlFinder + GachaRecordsFetcher
{
}

// macro generate

fn lookup_path_line_from_keyword(
  log_file: impl AsRef<Path>,
  keyword: impl AsRef<str>,
) -> Result<Option<PathBuf>, GachaBusinessError> {
  if !log_file.as_ref().exists() || !log_file.as_ref().is_file() {
    warn!("Log file does not exist: {:?}", log_file.as_ref());
    return Ok(None);
  }

  let file = File::open(&log_file)?;
  let reader = BufReader::new(file);
  let keyword = keyword.as_ref();
  let keyword_len = keyword.len();

  info!(
    "Starting from the log file: {:?}, look for the keyword: {keyword}",
    log_file.as_ref()
  );

  for line in reader.lines() {
    let line = line?;
    if !line.contains(keyword) {
      continue;
    }

    if let Some(colon) = line.rfind(':') {
      if let Some(end) = line.find(keyword) {
        let path = &line[colon - 1..end + keyword_len];
        info!("Locate the data directory: {path:?}");
        return Ok(Some(Path::new(path).to_path_buf()));
      }
    }
  }

  warn!("No valid keyword found from log file");
  Ok(None)
}

macro_rules! generate_business {
  ($(
    struct $business:ident {
      DataDirectoryFinder {
        cn = $business_cn_log_file:expr => $business_cn_data_dir_keyword:literal,
        os = $business_os_log_file:expr => $business_os_data_dir_keyword:literal
      }
    }
  ),*) => {
    $(
      pub struct $business;

      impl BusinessDeclare for $business {
        #[inline]
        fn business(&self) -> &'static AccountBusiness {
          &AccountBusiness::$business
        }
      }

      impl DataDirectoryFinder for $business {
        fn find_data_dir(&self, is_oversea: bool) -> Result<Option<DataDirectory>, GachaBusinessError> {
          info!("Finding the Business({:?}) data directory: IsOversea={is_oversea}", self.business());

          let path = match is_oversea {
            false => lookup_path_line_from_keyword($business_cn_log_file, $business_cn_data_dir_keyword),
            true  => lookup_path_line_from_keyword($business_os_log_file, $business_os_data_dir_keyword),
          }?;

          if let Some(path) = path {
            Ok(Some(DataDirectory {
              path,
              is_oversea,
            }))
          } else {
            Ok(None)
          }
        }
      }

      impl GachaUrlFinder for $business {}
      impl GachaRecordsFetcher for $business {}

      impl GachaBusinessInner for $business {}
    )*
  };
}

generate_business!(
  struct GenshinImpact {
    DataDirectoryFinder {
      cn = mihoyo_dir().join("原神/output_log.txt")           => "/YuanShen_Data/",
      os = mihoyo_dir().join("Genshin Impact/output_log.txt") => "/GenshinImpact_Data/"
    }
  },
  struct HonkaiStarRail {
    DataDirectoryFinder {
      cn = mihoyo_dir().join("崩坏：星穹铁道/Player.log")   => "/StarRail_Data/",
      os = cognosphere_dir().join("Star Rail/Player.log") => "/StarRail_Data/"
    }
  }
);

// Wrapper

pub struct GachaBusiness(Box<dyn GachaBusinessInner>);

impl fmt::Debug for GachaBusiness {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.debug_tuple("GachaBusiness")
      .field(self.0.business())
      .finish()
  }
}

impl Deref for GachaBusiness {
  type Target = dyn GachaBusinessInner;

  fn deref(&self) -> &Self::Target {
    &*self.0
  }
}

static GACHA_BUSINESS: Lazy<HashMap<&AccountBusiness, GachaBusiness>> = Lazy::new(|| {
  let mut m = HashMap::with_capacity(2);
  m.insert(
    &AccountBusiness::GenshinImpact,
    GachaBusiness(Box::new(GenshinImpact)),
  );
  m.insert(
    &AccountBusiness::HonkaiStarRail,
    GachaBusiness(Box::new(HonkaiStarRail)),
  );
  m
});

impl GachaBusiness {
  fn ref_by(business: &AccountBusiness) -> &'static Self {
    // `unwrap` Make sure there is a corresponding mapping for `GACHA_BUSINESS`.
    GACHA_BUSINESS.get(business).unwrap()
  }
}

// Fetcher Channel

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum GachaRecordsFetcherChannelFragment {
  Sleeping,
  Ready(String),
  Pagination(usize),
  Data(Vec<GachaRecord>),
  Completed(String),
  ///  0 ~  10: Initial. \
  /// 10 ~  90: Gacha type and Last end id Mappings. \
  /// 90 ~ 100: Finished.
  Progress(usize),
  Finished,
}

pub async fn create_gacha_records_fetcher_channel<Fut, F>(
  business: &'static GachaBusiness,
  gacha_url: String,
  gacha_type_and_last_end_id_mappings: Vec<(String, Option<String>)>,
  receiver_fn: F,
) -> Result<(), GachaBusinessError>
where
  Fut: Future<Output = Result<(), Box<dyn std::error::Error + Send + Sync>>>,
  F: Fn(GachaRecordsFetcherChannelFragment) -> Fut,
{
  if gacha_type_and_last_end_id_mappings.is_empty() {
    return Ok(());
  }

  info!("Creating a Gacha Records Fetcher Channel:");
  info!("Gacha url: {gacha_url}");
  info!("Gacha type and Last end id mappings: {gacha_type_and_last_end_id_mappings:?}");

  // Internal Abbreviations
  type Fragment = GachaRecordsFetcherChannelFragment;

  let (sender, mut receiver) = channel(1);
  let task: JoinHandle<Result<(), GachaBusinessError>> = spawn(async move {
    // Progress: Initial
    let mut progress = 10;
    sender.send(Fragment::Progress(progress)).await.unwrap();

    // Progress: Mappings step
    //   80 = 0.1 ~ 0.9
    let step = 80 / gacha_type_and_last_end_id_mappings.len();

    for (gacha_type, last_end_id) in gacha_type_and_last_end_id_mappings {
      pull_gacha_records(
        business,
        &sender,
        &gacha_url,
        &gacha_type,
        last_end_id.as_deref(),
        (progress, progress + step),
      )
      .await?;

      progress += step;
      sender.send(Fragment::Progress(progress)).await.unwrap();
    }

    // Progress: Finished
    sender.send(Fragment::Progress(100)).await.unwrap();
    sender.send(Fragment::Finished).await.unwrap();
    Ok(())
  });

  while let Some(fragment) = receiver.recv().await {
    if let Err(error) = receiver_fn(fragment).await {
      warn!("Error while fetcher channel interrupt: {error}");
      return Err(GachaBusinessError::FetcherChannelInterrupt(error));
    }
  }

  match task.await {
    Ok(result) => {
      info!("Fetcher channel execution is finished");
      result
    }
    Err(error) => {
      warn!("Error while fetcher channel join: {error}");
      Err(GachaBusinessError::FetcherChannelJoin(error.to_string()))
    }
  }
}

async fn pull_gacha_records(
  business: &'static GachaBusiness,
  sender: &Sender<GachaRecordsFetcherChannelFragment>,
  gacha_url: &str,
  gacha_type: &str,
  last_end_id: Option<&str>,
  (progress_min, progress_max): (usize, usize),
) -> Result<(), GachaBusinessError> {
  // Internal Abbreviations
  type Fragment = GachaRecordsFetcherChannelFragment;

  info!("Start pulling {gacha_type} Gacha type, Last end id: {last_end_id:?}");
  sender
    .send(Fragment::Ready(gacha_type.to_owned()))
    .await
    .unwrap();

  let progress_tolerance = progress_max - progress_min;
  let mut progress = progress_tolerance;

  const THRESHOLD: usize = 5;
  const WAIT_MOMENT_MILLIS: u64 = 500;

  let mut end_id = String::from("0");
  let mut pagination: usize = 0;
  loop {
    // Avoid visit too frequently
    if pagination > 1 && pagination % THRESHOLD == 0 {
      info!("One continuous request reached. Wait a moment...");
      sender.send(Fragment::Sleeping).await.unwrap();
      sleep(Duration::from_millis(WAIT_MOMENT_MILLIS)).await;
    }

    pagination += 1;
    info!("Start fetching page {pagination} data...");
    sender.send(Fragment::Pagination(pagination)).await.unwrap();

    // Progress:
    // Because it is impossible to determine the total number of pages.
    // Can only increase the progress in an interval.
    // When the upper limit of the interval is reached,
    // then the progress is no longer updated.
    // Until this Step is completed
    if progress > 0 && pagination <= progress_tolerance {
      progress -= 1;
      sender
        .send(Fragment::Progress(progress_max - progress))
        .await
        .unwrap();
    }

    if let Some(gacha_records) = business
      .fetch_gacha_records_with(gacha_url, Some(gacha_type), Some(&end_id))
      .await?
    {
      // The gacha records is always not empty.
      // See: `GachaRecordsFetcher::fetch_gacha_records`
      end_id.clone_from(&gacha_records.last().as_ref().unwrap().id);

      let mut should_break = false;
      let data = if let Some(last) = last_end_id {
        let mut temp = Vec::with_capacity(gacha_records.len());
        for record in gacha_records {
          if last.cmp(&record.id).is_lt() {
            temp.push(record);
          } else {
            should_break = true;
          }
        }
        temp
      } else {
        gacha_records
      };

      info!("Send {} pieces of data to the channel...", data.len());
      sender.send(Fragment::Data(data)).await.unwrap();

      if should_break {
        info!("Break loop. Data reaches the last end id: {last_end_id:?}");
        break;
      } else {
        continue;
      }
    }

    // None gacha records. break loop
    break;
  }

  // Completed gacha type
  info!("Gacha type {gacha_type} completed");
  sender
    .send(Fragment::Completed(gacha_type.to_owned()))
    .await
    .unwrap();

  Ok(())
}

// Tests

#[cfg(test)]
mod tests {
  use super::{create_gacha_records_fetcher_channel, GachaBusiness, GachaBusinessError, GachaUrl};
  use crate::models::AccountBusiness;

  fn install_tracing() {
    tracing_subscriber::fmt()
      .pretty()
      .with_ansi(true)
      .with_env_filter(
        tracing_subscriber::EnvFilter::from_default_env()
          .add_directive("hyper=warn".parse().unwrap())
          .add_directive(tracing::level_filters::LevelFilter::TRACE.into()),
      )
      .init();
  }

  fn find_gacha_urls(
    business: &GachaBusiness,
  ) -> Result<Option<Vec<GachaUrl>>, GachaBusinessError> {
    let skip_expired_gacha_urls = true;
    let is_oversea = false;
    Ok(
      business
        .find_data_dir(is_oversea)?
        .map(|game_data_dir| business.find_gacha_urls(&game_data_dir, skip_expired_gacha_urls))
        .transpose()?
        .flatten(),
    )
  }

  #[ignore = "This is a test with unknown results. For manual testing only"]
  #[tokio::test]
  async fn test_fetch_gacha_records() -> Result<(), Box<dyn std::error::Error>> {
    install_tracing();
    let business = GachaBusiness::ref_by(&AccountBusiness::GenshinImpact);
    if let Some(gacha_urls) = find_gacha_urls(business)? {
      let gacha_url = gacha_urls.first().expect("No valid Gacha url available");
      println!(
        "{:?}",
        business.fetch_gacha_records(gacha_url.as_ref()).await?
      );
      println!(
        "{:?}",
        business
          .fetch_gacha_url_metadata(gacha_url.as_ref())
          .await?
      );
    }

    Ok(())
  }

  #[ignore = "This is a test with unknown results. For manual testing only"]
  #[tokio::test]
  async fn test_fetcher_channel() -> Result<(), Box<dyn std::error::Error>> {
    install_tracing();
    let business = GachaBusiness::ref_by(&AccountBusiness::GenshinImpact);
    if let Some(gacha_urls) = find_gacha_urls(business)? {
      let gacha_url = gacha_urls.first().expect("No valid Gacha url available");
      create_gacha_records_fetcher_channel(
        business,
        gacha_url.value.clone(),
        vec![
          (String::from("100"), None),
          // (String::from("200"), None),
          // (String::from("301"), None),
          // (String::from("400"), None),
        ],
        move |fragment| async move {
          println!("{fragment:?}");
          Ok(())
        },
      )
      .await?;
    }

    Ok(())
  }
}
