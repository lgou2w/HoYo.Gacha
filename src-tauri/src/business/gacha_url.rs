use std::collections::HashMap;
use std::fmt::{self, Debug};
use std::path::{Path, PathBuf};
use std::time::Duration;

use exponential_backoff::Backoff;
use futures_util::future::BoxFuture;
use futures_util::FutureExt;
use once_cell::sync::Lazy;
use regex::Regex;
use serde::de::IntoDeserializer;
use serde::{Deserialize, Deserializer, Serialize};
use time::serde::rfc3339;
use time::OffsetDateTime;
use tracing::{info, warn, Span};
use url::Url;

use super::disk_cache::{BlockFile, IndexFile};
use crate::consts;
use crate::error::declare_error_kinds;
use crate::models::{BizInternals, Business, BusinessRegion, GachaRecord};

declare_error_kinds! {
  GachaUrlError, kinds {
    #[error("Web caches path does not exist: {path}")]
    WebCachesNotFound { path: PathBuf },

    #[error("Error opening web caches: {cause}")]
    OpenWebCaches {
      cause: std::io::Error => serde_json::json!({
        "kind": format_args!("{}", cause.kind()),
        "message": format_args!("{cause}"),
      })
    },

    #[error("Error reading disk cache: {cause}")]
    ReadDiskCache {
      cause: std::io::Error => serde_json::json!({
        "kind": format_args!("{}", cause.kind()),
        "message": format_args!("{cause}"),
      })
    },

    #[error("No gacha url found")]
    NotFound,

    #[error("Illegal gacha url")]
    Illegal { url: String },

    #[error("Invalid gacha url query params: {params:?}")]
    InvalidParams { params: Vec<String> },

    #[error("Failed to parse gacha url: {cause}")]
    Parse {
      cause: url::ParseError => format_args!("{cause}")
    },

    #[error("Error sending http request: {cause}")]
    Reqwest {
      cause: reqwest::Error => format_args!("{cause}")
    },

    #[error("Authkey timeout for gacha url")]
    AuthkeyTimeout,

    #[error("Visit gacha url too frequently")]
    VisitTooFrequently,

    #[error("Unexpected gacha url error response: retcode = {retcode}, message = {message:?}")]
    UnexpectedResponse { retcode: i32, message: String },

    #[error("Owner uid of the gacha url does not match (expected: {expected}, actual: {actual:?})")]
    InconsistentUid { expected: u32, actual: Vec<u32> },
  }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GachaUrl {
  pub business: Business,
  pub region: BusinessRegion,
  pub owner_uid: u32,
  #[serde(with = "rfc3339")]
  pub creation_time: OffsetDateTime,
  // Some important parameters of the Raw gacha url,
  // which are normally essential.
  pub param_game_biz: String,
  pub param_region: String,
  pub param_lang: String,
  pub param_authkey: String,
  pub value: Url,
}

// Dirty url without parsing and validation
type DirtyGachaUrl = (String, OffsetDateTime);

static REGEX_GACHA_URL: Lazy<Regex> = Lazy::new(|| {
  Regex::new(r"(?i)^https:\/\/.*(mihoyo.com|hoyoverse.com).*(\/getGachaLog\?).*(authkey\=).*$")
    .unwrap()
});

static REGEX_WEB_CACHES_VERSION: Lazy<Regex> = Lazy::new(|| {
  Regex::new(r"^(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)(\.(?P<build>\d+))?$").unwrap()
});

/// `Web Caches` version number. For example: `x.y.z` or `x.y.z.a`
#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
struct WebCachesVersion(u8, u8, u8, Option<u8>);

impl fmt::Display for WebCachesVersion {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    if let Some(patch) = self.3 {
      write!(f, "{}.{}.{}.{}", self.0, self.1, self.2, patch)
    } else {
      write!(f, "{}.{}.{}", self.0, self.1, self.2)
    }
  }
}

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

impl GachaUrl {
  #[tracing::instrument]
  pub async fn obtain(
    business: &Business,
    region: &BusinessRegion,
    data_folder: impl AsRef<Path> + Debug,
    expected_uid: u32,
  ) -> Result<Self, GachaUrlError> {
    let biz = BizInternals::mapped(business, region);
    let dirty_urls = Self::from_web_caches(data_folder).await?;
    Self::consistency_check(biz, dirty_urls, expected_uid).await
  }

  #[tracing::instrument(fields(?data_folder, web_caches_version))]
  pub async fn from_web_caches(
    data_folder: impl AsRef<Path> + Debug,
  ) -> Result<Vec<DirtyGachaUrl>, GachaUrlError> {
    info!("Reading valid gacha urls from web caches...");
    let span = Span::current();

    let cache_data_folder = {
      let web_caches_folder = data_folder.as_ref().join("webCaches");
      if !web_caches_folder.is_dir() {
        warn!("Web caches folder does not exist: {web_caches_folder:?}");
        return Err(GachaUrlErrorKind::WebCachesNotFound {
          path: web_caches_folder,
        })?;
      }

      let mut walk_dir = tokio::fs::read_dir(&web_caches_folder)
        .await
        .map_err(|cause| GachaUrlErrorKind::OpenWebCaches { cause })?;

      let mut versions = Vec::new();
      while let Ok(Some(entry)) = walk_dir.next_entry().await {
        if !entry.path().is_dir() {
          continue;
        }

        let entry_name = entry.file_name();
        if let Some(version) = WebCachesVersion::parse(entry_name.to_string_lossy()) {
          versions.push(version);
        }
      }

      if versions.is_empty() {
        warn!("List of versions of web caches not found");
        return Err(GachaUrlErrorKind::WebCachesNotFound {
          path: web_caches_folder,
        })?;
      }

      // Sort by version asc
      versions.sort();

      // Get the latest version
      let latest_version = versions.last().unwrap().to_string(); // SAFETY
      info!("Retrieve the latest version of web caches: {latest_version}");
      span.record("web_caches_version", &latest_version);

      web_caches_folder
        .join(latest_version)
        .join("Cache")
        .join("Cache_Data")
    };

    // TODO: Async fs?
    #[inline]
    fn read_disk_cache_gacha_urls(
      cache_data_folder: PathBuf,
    ) -> std::io::Result<Vec<DirtyGachaUrl>> {
      info!("Starting to read disk cache gacha urls...");

      info!("Reading index file...");
      let index_file = IndexFile::from_file(cache_data_folder.join("index"))?;

      info!("Reading block data_1 file...");
      let block_file1 = BlockFile::from_file(cache_data_folder.join("data_1"))?;

      info!("Reading block data_2 file...");
      let block_file2 = BlockFile::from_file(cache_data_folder.join("data_2"))?;

      let mut urls = Vec::new();
      let now_local = OffsetDateTime::now_utc().to_offset(*consts::LOCAL_OFFSET);

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

        // Convert creation time
        let creation_time = {
          let timestamp = (entry_store.creation_time / 1_000_000) as i64 - 11_644_473_600;
          OffsetDateTime::from_unix_timestamp(timestamp)
            .unwrap() // FIXME: SAFETY?
            .to_offset(*consts::LOCAL_OFFSET)
        };

        // By default, this gacha url is valid for 1 day.
        if creation_time + time::Duration::DAY < now_local {
          continue; // It's expired
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

        info!(
          message = "Valid gacha url exist in the cache address",
          ?addr,
          ?entry_store.long_key,
          ?creation_time,
          url
        );

        urls.push((url.to_string(), creation_time));
      }

      // Sort by creation time desc
      urls.sort_by(|a, b| b.1.cmp(&a.1));

      info!("Total number of gacha urls found: {}", urls.len());

      Ok(urls)
    }

    Ok(
      read_disk_cache_gacha_urls(cache_data_folder)
        .map_err(|cause| GachaUrlErrorKind::ReadDiskCache { cause })?,
    )
  }

  #[tracing::instrument(skip(biz, dirty_urls), fields(urls = dirty_urls.len(), ?expected_uid))]
  async fn consistency_check(
    biz: &BizInternals,
    dirty_urls: Vec<DirtyGachaUrl>,
    expected_uid: u32,
  ) -> Result<GachaUrl, GachaUrlError> {
    info!("Find owner consistency gacha url...");

    let mut actual = Vec::with_capacity(dirty_urls.len());
    for (dirty, creation_time) in dirty_urls {
      let ParsedGachaUrl {
        param_game_biz,
        param_region,
        param_lang,
        param_authkey,
        value: gacha_url,
      } = match parse_gacha_url(biz, &dirty, None, None) {
        Ok(parsed) => parsed,
        Err(error) => {
          warn!("Error parsing gacha url: {error:?}");
          continue;
        }
      };

      match request_gacha_url_with_retry(gacha_url.clone(), None).await {
        Err(error) => {
          warn!("Error requesting gacha url: {error:?}");
          continue;
        }
        Ok(response) => match response.data.as_ref().and_then(|page| page.list.first()) {
          None => {
            // It's possible. For example:
            //   There are no gacha records.
            //   Server is not synchronising data (1 hour delay or more)
            warn!("Gacha url responded with empty record data");
            continue;
          }
          Some(record) => {
            if record.uid == expected_uid {
              info!(
                message = "Capture the gacha url with the expected uid",
                expected_uid,
                ?creation_time,
                url = ?dirty,
              );

              return Ok(GachaUrl {
                business: *biz.business,
                region: *biz.region,
                owner_uid: expected_uid,
                creation_time,
                param_game_biz,
                param_region,
                param_lang,
                param_authkey,
                value: gacha_url,
              });
            } else {
              // The gacha url does not match the expected uid
              actual.push(record.uid);
            }
          }
        },
      }
    }

    if actual.is_empty() {
      warn!("No gacha urls exist");
      Err(GachaUrlErrorKind::NotFound)?
    } else {
      warn!(
        message = "The expected uid does not match the owner of the existing gacha urls",
        %expected_uid,
        ?actual
      );
      Err(GachaUrlErrorKind::InconsistentUid {
        expected: expected_uid,
        actual,
      })?
    }
  }
}

#[derive(Deserialize)]
struct GachaRecordsResponse {
  retcode: i32,
  message: String,
  data: Option<GachaRecordsPagination>,
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
  // `Honkai: Star Rail`, `Zenless Zone Zero` only
  #[serde(deserialize_with = "gacha_id_de", default = "Option::default")]
  gacha_id: Option<u32>,
  #[serde(deserialize_with = "string_as_number")]
  rank_type: u32,
  #[serde(deserialize_with = "string_as_number")]
  count: u32,
  time: String,
  lang: String,
  name: String,
  item_type: String,
  // `Honkai: Star Rail`, `Zenless Zone Zero` only
  #[serde(deserialize_with = "empty_string_as_none", default = "Option::default")]
  item_id: Option<String>,
}

#[allow(dead_code)]
#[derive(Deserialize)]
struct GachaRecordsPagination {
  page: String,
  size: String,
  // `Honkai: Star Rail`, `Zenless Zone Zero` only
  total: Option<String>,
  list: Vec<GachaRecordsPaginationItem>,
  region: String,
  // `Honkai: Star Rail`, `Zenless Zone Zero` only
  region_time_zone: Option<i8>,
}

#[derive(Debug)]
struct ParsedGachaUrl {
  // Some important parameters of the Raw gacha url,
  // which are normally essential.
  pub param_game_biz: String,
  pub param_region: String,
  pub param_lang: String,
  pub param_authkey: String,
  // Gacha url
  pub value: Url,
}

#[tracing::instrument(skip(biz))]
pub fn parse_gacha_url(
  biz: &BizInternals,
  gacha_url: &str,
  gacha_type: Option<&str>,
  end_id: Option<&str>,
) -> Result<ParsedGachaUrl, GachaUrlError> {
  if !REGEX_GACHA_URL.is_match(gacha_url) {
    Err(GachaUrlErrorKind::Illegal {
      url: gacha_url.into(),
    })?;
  }

  // SAFETY
  let query_start = gacha_url.find('?').unwrap();
  let base_url = &gacha_url[..query_start];
  let query_str = &gacha_url[query_start + 1..];

  let mut queries = url::form_urlencoded::parse(query_str.as_bytes())
    .into_owned()
    .collect::<HashMap<String, String>>();

  macro_rules! required_param {
    ($name:literal) => {
      queries
        .get($name)
        .filter(|s| !s.is_empty())
        .ok_or(GachaUrlErrorKind::InvalidParams {
          params: vec![$name.into()],
        })?
    };
  }

  let param_game_biz = required_param!("game_biz").to_owned();
  let param_region = required_param!("region").to_owned();
  let param_lang = required_param!("lang").to_owned();
  let param_authkey = required_param!("authkey").to_owned();

  let (gacha_type_field, init_type_field) = match biz.business {
    Business::GenshinImpact => ("gacha_type", "init_type"),
    Business::HonkaiStarRail => ("gacha_type", "default_gacha_type"),
    Business::ZenlessZoneZero => ("real_gacha_type", "init_log_gacha_base_type"),
  };

  let origin_gacha_type = queries
    .get(gacha_type_field)
    .cloned()
    .or(queries.get(init_type_field).cloned())
    .ok_or_else(|| {
      warn!(
        "Gacha url missing important '{gacha_type_field}' or '{init_type_field}' parameters: {queries:?}"
      );

      GachaUrlErrorKind::InvalidParams {
        params: vec![gacha_type_field.into(), init_type_field.into()],
      }
    })?;

  let origin_end_id = queries.get("end_id").cloned();
  let gacha_type = gacha_type.unwrap_or(&origin_gacha_type);

  // Deletion and modification of some query parameters
  queries.remove(gacha_type_field);
  queries.remove("page");
  queries.remove("size");
  queries.remove("begin_id");
  queries.remove("end_id");
  queries.insert("page".into(), "1".into());
  queries.insert("size".into(), "20".into());
  queries.insert(gacha_type_field.into(), gacha_type.into());

  if let Some(end_id) = end_id.or(origin_end_id.as_deref()) {
    queries.insert("end_id".into(), end_id.into());
  }

  let url = Url::parse_with_params(base_url, queries).map_err(|cause| {
    // Normally, this is never reachable here.
    // Unless it's a `url` crate issue.
    warn!("Error parsing gacha url with params: {cause}");
    GachaUrlErrorKind::Parse { cause }
  })?;

  Ok(ParsedGachaUrl {
    param_game_biz,
    param_region,
    param_lang,
    param_authkey,
    value: url,
  })
}

#[tracing::instrument(skip(url))]
pub async fn request_gacha_url(
  url: Url,
  timeout: Option<Duration>,
) -> Result<GachaRecordsResponse, GachaUrlError> {
  let response: GachaRecordsResponse = consts::REQWEST
    .get(url)
    .timeout(timeout.unwrap_or(Duration::from_secs(10)))
    .send()
    .await
    .map_err(|cause| GachaUrlErrorKind::Reqwest { cause })?
    .json()
    .await
    .map_err(|cause| GachaUrlErrorKind::Reqwest { cause })?;

  if response.retcode != 0 {
    let retcode = response.retcode;
    let message = &response.message;

    if retcode == -101 || message.contains("authkey") || message.contains("auth key") {
      Err(GachaUrlErrorKind::AuthkeyTimeout)?
    } else if retcode == -110 || message.contains("visit too frequently") {
      Err(GachaUrlErrorKind::VisitTooFrequently)?
    } else {
      Err(GachaUrlErrorKind::UnexpectedResponse {
        retcode,
        message: response.message,
      })?
    }
  } else {
    Ok(response)
  }
}

#[tracing::instrument(skip(url))]
pub fn request_gacha_url_with_retry(
  url: Url,
  retries: Option<u8>,
) -> BoxFuture<'static, Result<GachaRecordsResponse, GachaUrlError>> {
  // HACK: Default maximum 5 attempts
  const RETRIES: u8 = 5;
  const MIN: Duration = Duration::from_millis(200); // Min: 0.2s
  const MAX: Duration = Duration::from_millis(10_000); // Max: 10s

  let retries = retries.unwrap_or(RETRIES);
  let backoff = Backoff::new(retries as u32, MIN, MAX);
  let timeout = MAX + Duration::from_secs(3);

  async move {
    for duration in &backoff {
      match request_gacha_url(url.clone(), Some(timeout)).await {
        // okay
        Ok(response) => return Ok(response),

        // Wait and retry only if the error is VisitTooFrequently.
        Err(error) if matches!(error.as_ref(), GachaUrlErrorKind::VisitTooFrequently) => {
          warn!(
            "Requesting gacha url visit too frequently, wait({}s) and retry...",
            duration.as_secs_f32()
          );
          tokio::time::sleep(duration).await;
          continue;
        }

        // Other errors are returned
        Err(error) => return Err(error),
      }
    }

    // Maximum number of retries reached
    warn!("Maximum number of retries exceeded: {retries}");
    Err(GachaUrlErrorKind::VisitTooFrequently)?
  }
  .boxed()
}

#[tracing::instrument(skip_all)]
pub async fn fetch_gacha_records(
  business: &Business,
  region: &BusinessRegion,
  gacha_url: &str,
  gacha_type: Option<&str>,
  end_id: Option<&str>,
) -> Result<Option<Vec<GachaRecord>>, GachaUrlError> {
  info!("Fetching the gacha records...");
  let biz = BizInternals::mapped(business, region);

  let parsed = parse_gacha_url(biz, gacha_url, gacha_type, end_id)?;
  let pagination = match request_gacha_url_with_retry(parsed.value, None).await {
    Err(error) => {
      warn!("Responded with an error while fetching the gacha records: {error:?}");
      return Err(error);
    }
    Ok(response) => {
      if response
        .data
        .as_ref()
        .is_some_and(|data| !data.list.is_empty())
      {
        response.data.unwrap() // SAFETY
      } else {
        // Empty records -> return None
        return Ok(None);
      }
    }
  };

  let mut records = Vec::with_capacity(pagination.list.len());
  for value in pagination.list {
    records.push(GachaRecord {
      business: *business,
      uid: value.uid,
      id: value.id,
      gacha_type: value.gacha_type,
      gacha_id: value.gacha_id,
      rank_type: value.rank_type,
      count: value.count,
      time: value.time,
      lang: value.lang,
      name: value.name,
      item_type: value.item_type,
      item_id: value.item_id.unwrap_or_default(), // TODO: Dictionary
    })
  }

  Ok(Some(records))
}

#[cfg(test)]
mod tests {
  use crate::error::Error;

  use super::*;

  #[test]
  fn test_parse_gacha_url() {
    let biz = BizInternals::GENSHIN_IMPACT_OFFICIAL;

    assert!(matches!(
      parse_gacha_url(biz, "", None, None).map_err(Error::into_inner),
      Err(GachaUrlErrorKind::Illegal { url }) if url.is_empty()
    ));

    assert!(matches!(
      parse_gacha_url(biz, "?", None, None).map_err(Error::into_inner),
      Err(GachaUrlErrorKind::Illegal { url }) if url == "?"
    ));

    assert!(matches!(
      parse_gacha_url(biz, "https://.mihoyo.com/getGachaLog?", None, None).map_err(Error::into_inner),
      Err(GachaUrlErrorKind::Illegal { url }) if url == "https://.mihoyo.com/getGachaLog?"
    ));

    assert!(matches!(
      parse_gacha_url(
        biz,
        "https://fake-test.mihoyo.com/getGachaLog?authkey=",
        None,
        None
      )
      .map_err(Error::into_inner),
      Err(GachaUrlErrorKind::InvalidParams { .. })
    ));

    // See: REGEX_GACHA_URL
    let ParsedGachaUrl {
      param_game_biz,
      param_region,
      param_lang,
      param_authkey,
      value: _value,
    } = parse_gacha_url(biz, "https://fake-test.mihoyo.com/getGachaLog?game_biz=biz&region=region&lang=lang&authkey=authkey&gacha_type=gacha_type", None, None).unwrap();

    assert_eq!(param_game_biz, "biz");
    assert_eq!(param_region, "region");
    assert_eq!(param_lang, "lang");
    assert_eq!(param_authkey, "authkey");
  }
}
