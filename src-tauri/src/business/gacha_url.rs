use std::collections::{HashMap, HashSet};
use std::fmt::{self, Debug};
use std::path::{Path, PathBuf};
use std::str::FromStr;
use std::sync::LazyLock;
use std::time::Duration;

use exponential_backoff::Backoff;
use futures_util::FutureExt;
use futures_util::future::BoxFuture;
use regex::Regex;
use serde::{Deserialize, Deserializer, Serialize};
use time::serde::rfc3339;
use time::{OffsetDateTime, PrimitiveDateTime};
use tracing::{error, info, warn};
use url::Url;

use super::disk_cache::{BlockFile, IndexFile};
use crate::business::gacha_time_format;
use crate::consts;
use crate::error::declare_error_kinds;
use crate::models::{BizInternals, Business, BusinessRegion, GachaRecord, ServerRegion};
use crate::utilities::serde_helper;

declare_error_kinds! {
  #[derive(Debug, thiserror::Error)]
  GachaUrlError {
    #[error("Webcaches path does not exist: {path}")]
    WebCachesNotFound { path: PathBuf },

    #[error("Error opening webcaches: {cause}")]
    OpenWebCaches {
      cause: std::io::Error => serde_json::json!({
        "kind": cause.kind().to_string(),
        "message": cause.to_string(),
      })
    },

    #[error("Error reading disk cache: {cause}")]
    ReadDiskCache {
      cause: std::io::Error => serde_json::json!({
        "kind": cause.kind().to_string(),
        "message": cause.to_string(),
      })
    },

    #[error("Gacha url with empty data")]
    EmptyData,

    #[error("No gacha url found")]
    NotFound,

    #[error("Illegal gacha url")]
    Illegal { url: String },

    #[error("Illegal gacha url game biz (expected: {expected}, actual: {actual}")]
    IllegalBiz { url: String, expected: String, actual: String },

    #[error("Invalid gacha url query params: {params:?}")]
    InvalidParams { params: Vec<String> },

    #[error("Failed to parse gacha url: {cause}")]
    Parse { cause: url::ParseError => cause.to_string() },

    #[error("Error sending http request: {cause}")]
    Reqwest { cause: reqwest::Error => cause.to_string() },

    #[error("Authkey timeout for gacha url")]
    AuthkeyTimeout,

    #[error("Visit gacha url too frequently")]
    VisitTooFrequently,

    #[error("Unexpected gacha url error response: retcode = {retcode}, message = {message:?}")]
    UnexpectedResponse { retcode: i32, message: String },

    #[error("Owner uid of the gacha url does not match (expected: {expected}, actual: {actual:?})")]
    InconsistentUid { expected: u32, actual: HashSet<u32> },
  }
}

static REGEX_GACHA_URL: LazyLock<Regex> = LazyLock::new(|| {
  Regex::new(r"(?i)^https:\/\/.*(mihoyo.com|hoyoverse.com).*(\/getGachaLog\?).*(authkey\=).*$")
    .unwrap()
});

static REGEX_WEBCACHES_VERSION: LazyLock<Regex> = LazyLock::new(|| {
  Regex::new(r"^(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)(\.(?P<build>\d+))?$").unwrap()
});

/// `WebCaches` version number. For example: `x.y.z` or `x.y.z.a`
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

#[derive(Debug)]
pub struct DirtyGachaUrl {
  pub creation_time: Option<OffsetDateTime>,
  pub value: String,
}

impl DirtyGachaUrl {
  #[tracing::instrument]
  pub async fn from_webcaches(
    data_folder: impl AsRef<Path> + Debug,
    skip_expired: bool,
  ) -> Result<Vec<Self>, GachaUrlError> {
    info!("Reading gacha urls from webcaches...");

    let cache_data_folder = Self::combie_cache_data_folder(data_folder).await?;
    let gacha_urls = Self::read_cache_data_gacha_urls(cache_data_folder, skip_expired)
      .map_err(|cause| GachaUrlErrorKind::ReadDiskCache { cause })?;

    Ok(gacha_urls)
  }

  #[tracing::instrument]
  async fn combie_cache_data_folder(
    data_folder: impl AsRef<Path> + Debug,
  ) -> Result<PathBuf, GachaUrlError> {
    info!("Finding the webcaches data folder from the data folder");

    let webcaches_folder = data_folder.as_ref().join("webCaches");
    if !webcaches_folder.is_dir() {
      warn!("Webcaches folder does not exist: {webcaches_folder:?}");
      return Err(GachaUrlErrorKind::WebCachesNotFound {
        path: webcaches_folder,
      })?;
    }

    let mut walk_dir = tokio::fs::read_dir(&webcaches_folder)
      .await
      .map_err(|cause| GachaUrlErrorKind::OpenWebCaches { cause })?;

    let mut versions = Vec::new();
    while let Ok(Some(entry)) = walk_dir.next_entry().await {
      if entry.path().is_dir() {
        if let Some(Ok(version)) = entry.file_name().to_str().map(WebCachesVersion::from_str) {
          versions.push(version);
        }
      }
    }

    if versions.is_empty() {
      warn!("List of versions of webcaches not found");
      return Err(GachaUrlErrorKind::WebCachesNotFound {
        path: webcaches_folder,
      })?;
    }

    // Sort by version asc
    versions.sort();

    // Get the latest version
    let latest_version = versions.last().unwrap().to_string(); // SAFETY
    info!("Retrieve the latest version of webcaches: {latest_version}");

    Ok(
      webcaches_folder
        .join(latest_version)
        .join("Cache")
        .join("Cache_Data"),
    )
  }

  #[tracing::instrument]
  fn read_cache_data_gacha_urls(
    cache_data_folder: impl AsRef<Path> + Debug,
    skip_expired: bool,
  ) -> std::io::Result<Vec<Self>> {
    info!("Starting to read disk cache gacha urls...");
    let cache_data_folder = cache_data_folder.as_ref();

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
      if skip_expired && creation_time + time::Duration::DAY < now_local {
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

      urls.push(Self {
        creation_time: Some(creation_time),
        value: url.to_owned(),
      });
    }

    // Sort by creation time desc
    urls.sort_by(|a, b| b.creation_time.cmp(&a.creation_time));

    info!("Total number of gacha urls found: {}", urls.len());
    Ok(urls)
  }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GachaUrl {
  pub business: Business,
  pub region: BusinessRegion,
  pub owner_uid: u32,
  #[serde(with = "rfc3339::option")]
  pub creation_time: Option<OffsetDateTime>,
  #[serde(flatten)]
  pub url: ParsedGachaUrl,
}

impl GachaUrl {
  // Read all valid gacha urls from the webcaches data folder
  // and check for timeliness and consistency to get the latest gacha url.
  #[tracing::instrument]
  pub async fn from_webcaches(
    business: Business,
    region: BusinessRegion,
    data_folder: impl AsRef<Path> + Debug,
    expected_uid: u32,
  ) -> Result<Self, GachaUrlError> {
    let biz = BizInternals::mapped(business, region);
    let dirty_urls = DirtyGachaUrl::from_webcaches(
      data_folder,
      true, // No need for expired urls
    )
    .await?;

    Self::consistency_check(biz, dirty_urls, expected_uid).await
  }

  // Verifying timeliness and consistency from a dirty gacha url
  #[tracing::instrument]
  pub async fn from_dirty(
    business: Business,
    region: BusinessRegion,
    dirty_url: String,
    expected_uid: u32,
  ) -> Result<Self, GachaUrlError> {
    let biz = BizInternals::mapped(business, region);
    let dirty_urls = vec![DirtyGachaUrl {
      // Because the creation time is not known from the dirty gacha url.
      // The server will not return the creation time.
      creation_time: None,
      value: dirty_url,
    }];

    Self::consistency_check(biz, dirty_urls, expected_uid).await
  }

  #[tracing::instrument(skip(biz, dirty_urls), fields(urls = dirty_urls.len(), ?expected_uid))]
  async fn consistency_check(
    biz: &BizInternals,
    dirty_urls: Vec<DirtyGachaUrl>,
    expected_uid: u32,
  ) -> Result<GachaUrl, GachaUrlError> {
    info!("Find owner consistency gacha url...");

    let mut actuals = HashSet::with_capacity(dirty_urls.len());
    let mut contains_empty = false;

    for dirty in dirty_urls {
      let parsed = match ParsedGachaUrl::parse(
        biz,
        &dirty.value,
        None,    // Keep the value of dirty url
        None,    // Keep the value of dirty url
        Some(1), // Just one piece of data is enough
      ) {
        Ok(parsed) => parsed,
        Err(error) => {
          warn!("Error parsing gacha url: {error:?}");
          continue;
        }
      };

      let response = match request_gacha_url_with_retry(parsed.value.clone(), None).await {
        Ok(response) => response,
        Err(error) => {
          warn!("Error requesting gacha url: {error:?}");
          continue;
        }
      };

      let Some(record) = response.data.as_ref().and_then(|page| page.list.first()) else {
        // It's possible. For example:
        //   There are no gacha records.
        //   Server is not synchronising data (1 hour delay or more)
        warn!("Gacha url responded with empty record data");
        contains_empty = true;

        // FIXME: continue may not be secure.
        //   If the account is not record data and there are hundreds of cached gacha urls
        //   (when gacha record are constantly opened in game)
        continue;
      };

      if record.uid == expected_uid {
        info!(
          message = "Capture the gacha url with the expected uid",
          expected_uid,
          creation_time = ?dirty.creation_time,
          url = ?dirty.value,
        );

        return Ok(GachaUrl {
          business: biz.business,
          region: biz.region,
          creation_time: dirty.creation_time,
          url: parsed,
          owner_uid: expected_uid,
        });
      } else {
        // The gacha url does not match the expected uid
        actuals.insert(record.uid);
      }
    }

    if actuals.is_empty() {
      // No matching uid found from gacha urls
      if contains_empty {
        // HACK: If the account's record data has not been
        //   synchronised, then a special error kind is returned.
        //   When the record is empty, it is impossible to determine whether
        //   the URL is consistent with the expected UID. This is a necessary measure.
        warn!("Gacha url exists for empty record data.");
        Err(GachaUrlErrorKind::EmptyData)?
      } else {
        warn!("No gacha url found");
        Err(GachaUrlErrorKind::NotFound)?
      }
    } else {
      // Apparently, these actual gacha urls do not match the expected uid
      warn!(
        message = "The expected uid does not match the owner of the existing gacha urls",
        %expected_uid,
        ?actuals
      );
      Err(GachaUrlErrorKind::InconsistentUid {
        expected: expected_uid,
        actuals,
      })?
    }
  }
}

// A gacha url that has been parsed and validated,
// but may be expired as it needs to be requested to be known.
#[derive(Debug, Serialize)]
pub struct ParsedGachaUrl {
  // Some important parameters of the Raw gacha url,
  // which are normally essential.
  pub param_game_biz: String,
  pub param_region: String,
  pub param_lang: String,
  pub param_authkey: String,
  // Valid gacha url
  pub value: Url,
}

impl ParsedGachaUrl {
  #[tracing::instrument(skip(biz))]
  pub fn parse(
    biz: &BizInternals,
    gacha_url: &str,
    gacha_type: Option<&str>,
    end_id: Option<&str>,
    page_size: Option<u8>, // 1 - 20, None Default is 20
  ) -> Result<Self, GachaUrlError> {
    if !REGEX_GACHA_URL.is_match(gacha_url) {
      return Err(GachaUrlErrorKind::Illegal {
        url: gacha_url.to_owned(),
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

    // Verify that the game biz matches
    if param_game_biz != biz.codename {
      return Err(GachaUrlErrorKind::IllegalBiz {
        url: gacha_url.into(),
        expected: biz.codename.into(),
        actual: param_game_biz,
      })?;
    }

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
    queries.insert("size".into(), page_size.unwrap_or(20).to_string());
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

    Ok(Self {
      param_game_biz,
      param_region,
      param_lang,
      param_authkey,
      value: url,
    })
  }
}

#[derive(Deserialize)]
struct GachaRecordsResponse {
  retcode: i32,
  message: String,
  data: Option<GachaRecordsPagination>,
}

fn gacha_id_de<'de, D>(de: D) -> Result<Option<u32>, D::Error>
where
  D: Deserializer<'de>,
{
  use serde::de::IntoDeserializer;

  let opt: Option<String> = serde_helper::de::empty_string_as_none(de)?;
  match opt.as_deref() {
    None => Ok(None),
    Some(str) => {
      let num: u64 = serde_helper::string_number_into::deserialize(str.into_deserializer())?;
      let res = u32::try_from(num).map_err(serde::de::Error::custom)?;
      Ok(Some(res))
    }
  }
}

#[derive(Deserialize)]
struct GachaRecordsPaginationItem {
  id: String,
  #[serde(with = "serde_helper::string_number_into")]
  uid: u32,
  #[serde(with = "serde_helper::string_number_into")]
  gacha_type: u32,
  // `Honkai: Star Rail`, `Zenless Zone Zero` only
  #[serde(deserialize_with = "gacha_id_de", default = "Option::default")]
  gacha_id: Option<u32>,
  #[serde(with = "serde_helper::string_number_into")]
  rank_type: u32,
  #[serde(with = "serde_helper::string_number_into")]
  count: u32,
  #[serde(with = "gacha_time_format")]
  time: PrimitiveDateTime,
  lang: String,
  name: String,
  item_type: String,
  // `Honkai: Star Rail`, `Zenless Zone Zero` only
  #[serde(
    deserialize_with = "serde_helper::de::empty_string_as_none",
    default = "Option::default"
  )]
  item_id: Option<String>,
}

#[derive(Deserialize)]
struct GachaRecordsPagination {
  list: Vec<GachaRecordsPaginationItem>,
  region: String,
}

#[tracing::instrument(skip(url))]
async fn request_gacha_url(
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
fn request_gacha_url_with_retry(
  url: Url,
  retries: Option<u8>,
) -> BoxFuture<'static, Result<GachaRecordsResponse, GachaUrlError>> {
  // HACK: Default maximum 5 attempts
  const RETRIES: u8 = 5;
  const MIN: Duration = Duration::from_millis(200); // Min: 0.2s
  const MAX: Duration = Duration::from_millis(5000); // Max: 5s

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
          warn!("Requesting gacha url visit too frequently, retry...");
          if let Some(duration) = duration {
            tokio::time::sleep(duration).await;
          }
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
  business: Business,
  region: BusinessRegion,
  gacha_url: &str,
  gacha_type: Option<&str>,
  end_id: Option<&str>,
  page_size: Option<u8>,
) -> Result<Option<Vec<GachaRecord>>, GachaUrlError> {
  info!("Fetching the gacha records...");
  let biz = BizInternals::mapped(business, region);

  let parsed = ParsedGachaUrl::parse(biz, gacha_url, gacha_type, end_id, page_size)?;
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

  let uid = pagination.list.first().map(|item| item.uid).unwrap(); // SAFETY: See above
  let server_region = ServerRegion::from_uid(business, uid).unwrap_or_else(|| {
    // Unless there is an extra digit, see FIXME of `from_uid` for details
    error!(message = "Failed to get server region from uid", %business, %uid, %pagination.region);
    ServerRegion::Official
  });

  let records = pagination
    .list
    .into_iter()
    .map(|item| GachaRecord {
      business,
      uid: item.uid,
      id: item.id,
      gacha_type: item.gacha_type,
      gacha_id: item.gacha_id,
      rank_type: item.rank_type,
      count: item.count,
      // HACK: This is already the server time, just need to set the server time zone according to uid
      time: item.time.assume_offset(server_region.time_zone()),
      lang: item.lang,
      name: item.name,
      item_type: item.item_type,
      item_id: item.item_id,
    })
    .collect();

  Ok(Some(records))
}

#[cfg(test)]
mod tests {
  use crate::error::Error;
  use crate::models::BIZ_GENSHIN_IMPACT_OFFICIAL;

  use super::*;

  #[test]
  fn test_parse_gacha_url() {
    let biz = &BIZ_GENSHIN_IMPACT_OFFICIAL;

    assert!(matches!(
      ParsedGachaUrl::parse(biz, "", None, None, None).map_err(Error::into_inner),
      Err(GachaUrlErrorKind::Illegal { url }) if url.is_empty()
    ));

    assert!(matches!(
      ParsedGachaUrl::parse(biz, "?", None, None, None).map_err(Error::into_inner),
      Err(GachaUrlErrorKind::Illegal { url }) if url == "?"
    ));

    assert!(matches!(
      ParsedGachaUrl::parse(biz, "https://.mihoyo.com/getGachaLog?", None, None, None).map_err(Error::into_inner),
      Err(GachaUrlErrorKind::Illegal { url }) if url == "https://.mihoyo.com/getGachaLog?"
    ));

    assert!(matches!(
      ParsedGachaUrl::parse(
        biz,
        "https://fake-test.mihoyo.com/getGachaLog?authkey=",
        None,
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
    } = ParsedGachaUrl::parse(biz, &format!("https://fake-test.mihoyo.com/getGachaLog?game_biz={game_biz}&region=region&lang=lang&authkey=authkey&gacha_type=gacha_type", game_biz = biz.codename), None, None, None).unwrap();

    assert_eq!(param_game_biz, biz.codename);
    assert_eq!(param_region, "region");
    assert_eq!(param_lang, "lang");
    assert_eq!(param_authkey, "authkey");
  }
}
