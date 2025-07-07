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
use serde::ser::SerializeStruct;
use serde::{Deserialize, Deserializer, Serialize};
use time::format_description::well_known::Rfc3339;
use time::{OffsetDateTime, PrimitiveDateTime};
use tracing::{error, info, warn};
use url::Url;

use crate::business::disk_cache::{BlockFile, IndexFile};
use crate::business::{GachaMetadata, gacha_time_format};
use crate::consts;
use crate::error::declare_error_kinds;
use crate::models::{BizInternals, Business, BusinessRegion, GachaRecord, ServerRegion};
use crate::utilities::serde_helper;

declare_error_kinds! {
  #[derive(Debug, thiserror::Error)]
  GachaUrlError {
    #[error("Webcaches path does not exist: {path}")]
    WebCachesNotFound {
      path: PathBuf
    },

    #[error("Error opening webcaches '{path}': {cause}")]
    OpenWebCaches {
      path: PathBuf,
      cause: std::io::Error => serde_json::json!({
        "kind": cause.kind().to_string(),
        "message": cause.to_string(),
      })
    },

    #[error("Error reading disk cache '{path}': {cause}")]
    ReadDiskCache {
      path: PathBuf,
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
    IllegalUrl {
      url: String
    },

    #[error("Illegal gacha url game biz: {value}")]
    IllegalGameBiz {
      url: String,
      value: String
    },

    #[error("Invalid gacha url query params: {params:?}")]
    InvalidParams {
      params: Vec<String>
    },

    #[error("Error sending http request: {cause}")]
    Reqwest {
      cause: reqwest::Error => cause.to_string()
    },

    #[error("Authkey timeout for gacha url")]
    AuthkeyTimeout,

    #[error("Visit gacha url too frequently")]
    VisitTooFrequently,

    #[error("Unexpected gacha url error response: retcode: {retcode}, message: {message}")]
    UnexpectedResponse {
      retcode: i32,
      message: String
    },

    #[error("Missing metadata entry: {business}, locale: {locale}, name: {name}")]
    MissingMetadataEntry {
      business: Business,
      locale: String,
      name: String
    },

    #[error("Owner uid of the gacha url does not match: {actuals:?} (Expected: {expected})")]
    InconsistentUid {
      expected: u32,
      actuals: HashSet<u32>
    },
  }
}

// https://webstatic.mihoyo.com/xxx/event/xxx/index.html?params
// https://public-operation-xxx.mihoyo.com/gacha_info/api/getGachaLog?params
static REGEX_GACHA_URL: LazyLock<Regex> = LazyLock::new(|| {
  Regex::new(r"(?i)^https:\/\/.*(mihoyo.com|hoyoverse.com).*(authkey\=.+).*$").unwrap()
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
    let gacha_urls = Self::read_cache_data_gacha_urls(cache_data_folder, skip_expired)?;

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
      .map_err(|cause| GachaUrlErrorKind::OpenWebCaches {
        path: webcaches_folder.clone(),
        cause,
      })?;

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
  ) -> Result<Vec<Self>, GachaUrlError> {
    info!("Starting to read disk cache gacha urls...");
    let cache_data_folder = cache_data_folder.as_ref();

    info!("Reading index file...");
    let index_file = cache_data_folder.join("index");
    let index_file =
      IndexFile::from_file(&index_file).map_err(|cause| GachaUrlErrorKind::ReadDiskCache {
        path: index_file,
        cause,
      })?;

    info!("Reading block data_1 file...");
    let block_file1_path = cache_data_folder.join("data_1");
    let block_file1 = BlockFile::from_file(&block_file1_path).map_err(|cause| {
      GachaUrlErrorKind::ReadDiskCache {
        path: block_file1_path.clone(),
        cause,
      }
    })?;

    info!("Reading block data_2 file...");
    let block_file2_path = cache_data_folder.join("data_1");
    let block_file2 = BlockFile::from_file(&block_file2_path).map_err(|cause| {
      GachaUrlErrorKind::ReadDiskCache {
        path: block_file2_path.clone(),
        cause,
      }
    })?;

    let mut urls = Vec::new();
    let now_local = OffsetDateTime::now_utc().to_offset(*consts::LOCAL_OFFSET);

    info!("Foreach the cache address table of the index file...");
    for addr in index_file.table {
      // The previous places should not print logs.
      // Because the table of cache address is too large.
      //debug!("Read the entry store at cache address: {addr:?}");

      // Read the entry store from the data_1 block file by cache address
      let entry_store =
        block_file1
          .read_entry_store(&addr)
          .map_err(|cause| GachaUrlErrorKind::ReadDiskCache {
            path: block_file1_path.join(format!("{addr:?}")),
            cause,
          })?;

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
      let url = entry_store.read_long_key(&block_file2).map_err(|cause| {
        GachaUrlErrorKind::ReadDiskCache {
          path: block_file2_path.join(format!("{:?}", entry_store.long_key)),
          cause,
        }
      })?;

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

#[derive(Debug)]
pub struct GachaUrl {
  pub url: ParsedGachaUrl,
  pub owner_uid: u32,
  pub creation_time: Option<OffsetDateTime>,
}

impl Serialize for GachaUrl {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::Serializer,
  {
    use serde::ser::Error;

    let mut state = serializer.serialize_struct("GachaUrl", 5)?;

    state.serialize_field("business", &self.url.biz.0)?;
    state.serialize_field("region", &self.url.biz.1)?;
    state.serialize_field("ownerUid", &self.owner_uid)?;

    let creation_time = self
      .creation_time
      .map(|odt| odt.format(&Rfc3339))
      .transpose()
      .map_err(S::Error::custom)?;

    state.serialize_field("creationTime", &creation_time)?;
    state.serialize_field("value", &self.url.to_url(None, None, None))?;
    state.end()
  }
}

impl GachaUrl {
  // Read all valid gacha urls from the webcaches data folder
  // and check for timeliness and consistency to get the latest gacha url.
  #[tracing::instrument]
  pub async fn from_webcaches(
    data_folder: impl AsRef<Path> + Debug,
    expected_uid: u32,
  ) -> Result<Self, GachaUrlError> {
    let dirty_urls = DirtyGachaUrl::from_webcaches(
      data_folder,
      true, // No need for expired urls
    )
    .await?;

    Self::consistency_check(dirty_urls, expected_uid, false).await
  }

  // Verifying timeliness and consistency from a dirty gacha url
  #[tracing::instrument]
  pub async fn from_dirty(dirty_url: String, expected_uid: u32) -> Result<Self, GachaUrlError> {
    let dirty_urls = vec![DirtyGachaUrl {
      // Because the creation time is not known from the dirty gacha url.
      // The server will not return the creation time.
      creation_time: None,
      value: dirty_url,
    }];

    Self::consistency_check(dirty_urls, expected_uid, true).await
  }

  #[tracing::instrument(skip(dirty_urls), fields(urls = dirty_urls.len(), ?expected_uid))]
  async fn consistency_check(
    dirty_urls: Vec<DirtyGachaUrl>,
    expected_uid: u32,
    spread: bool,
  ) -> Result<GachaUrl, GachaUrlError> {
    info!("Find owner consistency gacha url...");

    let mut actuals = HashSet::with_capacity(dirty_urls.len());
    let mut contains_empty = false;

    for dirty in dirty_urls {
      let parsed = match ParsedGachaUrl::from_str(&dirty.value) {
        Ok(parsed) => parsed,
        Err(error) => {
          warn!("Error parsing gacha url: {error:?}");
          if spread {
            return Err(error);
          } else {
            continue;
          }
        }
      };

      let url = parsed.to_url(None, None, Some(1));
      let response = match request_gacha_url_with_retry(url, None).await {
        Ok(response) => response,
        Err(error) => {
          warn!("Error requesting gacha url: {error:?}");
          if spread {
            return Err(error);
          } else {
            continue;
          }
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
          url: parsed,
          owner_uid: expected_uid,
          creation_time: dirty.creation_time,
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

#[derive(Debug, PartialEq, Eq, Serialize)]
pub struct ParsedGachaUrl {
  pub biz: (Business, BusinessRegion),
  // Required params
  pub sign_type: String,
  pub authkey_ver: String,
  pub authkey: String,
  pub game_biz: String,
  pub region: String,
  pub lang: String,
  pub gacha_type: (&'static str, String), // key:val
}

impl FromStr for ParsedGachaUrl {
  type Err = GachaUrlError;

  fn from_str(dirty: &str) -> Result<Self, Self::Err> {
    if !REGEX_GACHA_URL.is_match(dirty) {
      return Err(GachaUrlErrorKind::IllegalUrl {
        url: dirty.to_owned(),
      })?;
    }

    let query_start = dirty.find('?').unwrap();
    let queries_str = &dirty[query_start + 1..];
    let queries = url::form_urlencoded::parse(queries_str.as_bytes())
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

    // Required params
    let sign_type = required_param!("sign_type").to_owned();
    let authkey_ver = required_param!("authkey_ver").to_owned();
    let authkey = required_param!("authkey").to_owned();
    let game_biz = required_param!("game_biz").to_owned();
    let region = required_param!("region").to_owned();
    let lang = required_param!("lang").to_owned();

    // Game Business
    let biz = BizInternals::from_codename(&game_biz).ok_or(GachaUrlErrorKind::IllegalGameBiz {
      url: dirty.to_owned(),
      value: game_biz.clone(),
    })?;

    let (gacha_type_field, init_gacha_type_field) = biz.gacha_type_fields();
    let gacha_type = queries
      .get(gacha_type_field)
      .cloned()
      .or(queries.get(init_gacha_type_field).cloned())
      .ok_or_else(|| {
        warn!(
          "Gacha url missing important '{gacha_type_field}' or '{init_gacha_type_field}' parameters: {queries:?}"
        );

        GachaUrlErrorKind::InvalidParams {
          params: vec![gacha_type_field.into(), init_gacha_type_field.into()],
        }
      })?;

    Ok(Self {
      biz: (biz.business, biz.region),
      sign_type,
      authkey_ver,
      authkey,
      game_biz,
      region,
      lang,
      gacha_type: (gacha_type_field, gacha_type),
    })
  }
}

impl ParsedGachaUrl {
  pub fn to_url(
    &self,
    gacha_type: Option<&str>,
    end_id: Option<&str>,
    page_size: Option<u8>,
  ) -> Url {
    let Self {
      biz,
      sign_type,
      authkey_ver,
      authkey,
      game_biz,
      region,
      lang,
      gacha_type: (gacha_type_field, original_gacha_type),
    } = self;

    let biz = BizInternals::mapped(biz.0, biz.1);

    Url::parse_with_params(
      biz.base_gacha_url,
      &[
        ("sign_type", sign_type.as_str()),
        ("authkey_ver", authkey_ver.as_str()),
        ("authkey", authkey.as_str()),
        ("game_biz", game_biz.as_str()),
        ("region", region.as_str()),
        ("lang", lang.as_str()),
        (gacha_type_field, gacha_type.unwrap_or(original_gacha_type)),
        ("end_id", end_id.unwrap_or("0")),
        ("page", "1"),
        ("size", page_size.unwrap_or(20).to_string().as_str()),
      ],
    )
    // HACK: This error will not occur
    .expect("Failed to parse base gacha URL")
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
  gacha_url: &str,
  gacha_type: Option<&str>,
  end_id: Option<&str>,
  page_size: Option<u8>,
) -> Result<Option<Vec<GachaRecord>>, GachaUrlError> {
  info!("Fetching the gacha records...");

  let parsed = ParsedGachaUrl::from_str(gacha_url)?;
  let url = parsed.to_url(gacha_type, end_id, page_size);
  let business = parsed.biz.0;

  let pagination = match request_gacha_url_with_retry(url, None).await {
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

  let metadata = GachaMetadata::current();
  let mut records = Vec::with_capacity(pagination.list.len());

  for item in pagination.list {
    let item_id = match item.item_id {
      Some(v) => v,
      // HACK: Genshin Impact only
      //   Mandatory mapping of item ids.
      //   If metadata is outdated, this error will be thrown.
      None => metadata
        .obtain(business, &item.lang)
        .and_then(|map| map.entry_from_name_first(&item.name))
        .ok_or_else(|| GachaUrlErrorKind::MissingMetadataEntry {
          business,
          locale: item.lang.clone(),
          name: item.name.clone(),
        })?
        .id
        .to_owned(),
    };

    records.push(GachaRecord {
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
      item_id,
    });
  }

  Ok(Some(records))
}

#[cfg(test)]
mod tests {
  use crate::error::Error;

  use super::*;

  #[test]
  fn test_parse_error_dirty_gacha_url() {
    assert!(matches!(
      ParsedGachaUrl::from_str("").map_err(Error::into_inner),
      Err(GachaUrlErrorKind::IllegalUrl { url }) if url.is_empty()
    ));

    assert!(matches!(
      ParsedGachaUrl::from_str("https://test.mihoyo.com?").map_err(Error::into_inner),
      Err(GachaUrlErrorKind::IllegalUrl { url }) if url == "https://test.mihoyo.com?"
    ));

    assert!(matches!(
      ParsedGachaUrl::from_str("https://test.mihoyo.com?authkey=123").map_err(Error::into_inner),
      Err(GachaUrlErrorKind::InvalidParams { params }) if params.contains(&String::from("sign_type"))
    ));

    assert!(matches!(
      ParsedGachaUrl::from_str("https://test.mihoyo.com?authkey=123&sign_type=xxx").map_err(Error::into_inner),
      Err(GachaUrlErrorKind::InvalidParams { params }) if params.contains(&String::from("authkey_ver"))
    ));

    assert!(matches!(
      ParsedGachaUrl::from_str("https://test.mihoyo.com?authkey=123&sign_type=xxx&authkey_ver=1").map_err(Error::into_inner),
      Err(GachaUrlErrorKind::InvalidParams { params }) if params.contains(&String::from("game_biz"))
    ));

    assert!(matches!(
      ParsedGachaUrl::from_str("https://test.mihoyo.com?authkey=123&sign_type=xxx&authkey_ver=1&game_biz=xxx").map_err(Error::into_inner),
      Err(GachaUrlErrorKind::InvalidParams { params }) if params.contains(&String::from("region"))
    ));

    assert!(matches!(
      ParsedGachaUrl::from_str("https://test.mihoyo.com?authkey=123&sign_type=xxx&authkey_ver=1&game_biz=xxx&region=cn").map_err(Error::into_inner),
      Err(GachaUrlErrorKind::InvalidParams { params }) if params.contains(&String::from("lang"))
    ));
  }

  #[test]
  fn test_parse_dirty_gacha_url() {
    let gacha_url = ParsedGachaUrl::from_str("https://webstatic.mihoyo.com/nap/event/e20230424gacha/index.html?authkey_ver=1&sign_type=2&auth_appid=webview_gacha&win_mode=fullscreen&gacha_id=ab661a7ad928f17ee22a87f9b1f959b49ef58175&timestamp=1749165432&font_thickness_mode=1&init_log_gacha_type=2001&init_log_gacha_base_type=2&ui_layout=&button_mode=default&plat_type=pc&is_gacha=1&no_joypad_close=1&authkey=123456&lang=zh-cn&region=prod_gf_cn&game_biz=nap_cn&from_cloud=1#/info.").unwrap();

    assert_eq!(
      gacha_url,
      ParsedGachaUrl {
        biz: (Business::ZenlessZoneZero, BusinessRegion::Official),
        sign_type: "2".into(),
        authkey_ver: "1".into(),
        authkey: "123456".into(),
        game_biz: "nap_cn".into(),
        region: "prod_gf_cn".into(),
        lang: "zh-cn".into(),
        gacha_type: ("real_gacha_type", "2".into())
      }
    );
  }
}
