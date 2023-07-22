extern crate lazy_static;
extern crate reqwest;
extern crate serde;
extern crate time;
extern crate tokio;
extern crate tracing;
extern crate url;

use std::collections::HashMap;
use std::collections::hash_map::Entry;
use std::fs::File;
use std::io::{prelude::BufRead, BufReader};
use std::path::{Path, PathBuf};
use std::str::FromStr;
use lazy_static::lazy_static;
use reqwest::Client as Reqwest;
use serde::{Deserialize, Serialize};
use serde::de::DeserializeOwned;
use time::{OffsetDateTime, UtcOffset};
use tokio::sync::Mutex;
use tracing::debug;
use url::Url;
use crate::constants;
use crate::disk_cache::{IndexFile, BlockFile, EntryStore};
use crate::error::{Error, Result};
use crate::storage::entity_account::AccountFacet;
use super::{GachaUrl, GachaRecord, GachaRecordFetcher};

pub(super) fn create_default_reqwest() -> Result<reqwest::Client> {
  Ok(reqwest::Client::builder()
    .user_agent(format!("{} v{} by {}", constants::NAME, constants::VERSION, constants::AUTHOR))
    .build()?)
}

pub(super) fn lookup_mihoyo_dir() -> PathBuf {
  if cfg!(windows) {
    const VAR: &str = "USERPROFILE";
    const SUBDIR: &str = "AppData/LocalLow/miHoYo";
    let user_profile = std::env::var(VAR).unwrap();
    Path::new(&user_profile).join(SUBDIR)
  } else {
    // TODO: Other platforms
    todo!()
  }
}

pub(super) fn lookup_cognosphere_dir() -> PathBuf {
  if cfg!(windows) {
    const VAR: &str = "USERPROFILE";
    const SUBDIR: &str = "AppData/LocalLow/Cognosphere";
    let user_profile = std::env::var(VAR).unwrap();
    Path::new(&user_profile).join(SUBDIR)
  } else {
    // TODO: Other platforms
    todo!()
  }
}

pub(super) fn lookup_path_line_from_keyword<P: AsRef<Path>>(
  path: P,
  keyword: &str
) -> Result<Option<PathBuf>> {
  if !path.as_ref().exists() || !path.as_ref().is_file() {
    return Ok(None);
  }

  let file = File::open(path)?;
  let reader = BufReader::new(file);

  for line in reader.lines().map(|l| l.unwrap()) {
    if !line.contains(keyword) {
      continue;
    }

    if let Some(colon) = line.rfind(':') {
      if let Some(end) = line.find(keyword) {
        let path = &line[colon - 1..end + keyword.len()];
        return Ok(Some(Path::new(path).to_path_buf()));
      }
    }
  }

  Ok(None)
}

mod web_caches {
  use std::num::ParseIntError;
  use std::str::FromStr;
  use super::Error;

  #[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
  pub struct WebCachesVersion {
    major: u8,
    minor: u8,
    patch: u8,
    build: u8,
  }

  impl WebCachesVersion {
    pub fn version(&self) -> String {
      format!("{}.{}.{}.{}", self.major, self.minor, self.patch, self.build)
    }
  }

  impl From<ParseIntError> for Error {
    fn from(_: ParseIntError) -> Self {
      Self::WebCaches
    }
  }

  impl FromStr for WebCachesVersion {
    type Err = Error;

    fn from_str(s: &str) -> std::result::Result<Self, Self::Err> {
      let mut s = s.split('.');
      match (s.next(), s.next(), s.next(), s.next()) {
        (Some(major), Some(minor), Some(patch), build_opt) => {
          Ok(WebCachesVersion {
            major: major.parse()?,
            minor: minor.parse()?,
            patch: patch.parse()?,
            build: build_opt.unwrap_or("0").parse()?,
          })
        },
        _ => Err(Error::WebCaches)
      }
    }
  }
}

pub(super) fn lookup_valid_cache_data_dir<P: AsRef<Path>>(game_data_dir: P) -> Result<PathBuf> {
  use std::fs::read_dir;
  use self::web_caches::WebCachesVersion;

  let mut web_caches_versions = Vec::new();

  // Read webCaches directory
  let web_caches_dir = game_data_dir.as_ref().join("webCaches");
  for entry in read_dir(&web_caches_dir)? {
    let entry = entry?;
    let entry_path = entry.path();
    if !entry_path.is_dir() {
      continue;
    }

    let entry_name = entry_path.file_name().unwrap().to_string_lossy();
    if let Ok(version) = WebCachesVersion::from_str(&entry_name) {
      // Matches version: `x.y.z.a` or `x.y.z`
      web_caches_versions.push(version);
    }
  }

  // Sort by version asc
  web_caches_versions.sort();

  // Get the latest version
  let latest = web_caches_versions.last().ok_or(Error::WebCaches)?;
  let cache_data_dir = web_caches_dir
    .join(latest.version())
    .join("Cache")
    .join("Cache_Data");

  Ok(cache_data_dir)
}

pub(super) fn lookup_gacha_urls_from_endpoint<P: AsRef<Path>>(
  cache_data_dir: P,
  endpoint: &str
) -> Result<Vec<GachaUrl>> {
  let cache_data_dir = cache_data_dir.as_ref();

  // Read index file and data_1, data_2 block files
  let index_file = IndexFile::from_file(cache_data_dir.join("index"))?;
  let block_file1 = BlockFile::from_file(cache_data_dir.join("data_1"))?;
  let block_file2 = BlockFile::from_file(cache_data_dir.join("data_2"))?;

  let mut result = Vec::new();
  let current_local_offset = UtcOffset::current_local_offset().map_err(time::Error::from)?;

  // Foreach the cache address table of the index file
  for addr in index_file.table {
    // Read the entry store from the data_1 block file by cache address
    let entry = EntryStore::from_block_file(&block_file1, &addr)?;

    // Gacha url must be a long key and stored in the data_2 block file,
    // So the long key of entry must not be zero.
    if !entry.is_long_url() {
      continue;
    }

    // Read the long url of entry store from the data_2 block file
    let url = entry.read_long_url(&block_file2)?;

    // Get only valid gacha url
    if !url.contains(endpoint) && !url.contains("&gacha_type=") {
      continue;
    }

    let mut url = url.to_string();

    // These url start with '1/0/', only get the later part
    if url.starts_with("1/0/") {
      url = url[4..].to_string();
    }

    // Convert creation time
    let creation_time = {
      let timestamp = (entry.creation_time / 1_000_000) as i64 - 11_644_473_600;
      let offset_datetime = OffsetDateTime::from_unix_timestamp(timestamp).map_err(time::Error::from)?;
      offset_datetime.to_offset(current_local_offset)
    };

    result.push(GachaUrl {
      addr: addr.into(),
      creation_time,
      value: url
    })
  }

  // Sort by creation time desc
  result.sort_by(|a, b| b.creation_time.cmp(&a.creation_time));

  Ok(result)
}

#[derive(Deserialize)]
pub(super) struct GachaResponse<T> {
  pub retcode: i32,
  pub message: String,
  pub data: Option<T>
}

pub(super) async fn fetch_gacha_records<T: Sized + DeserializeOwned>(
  reqwest: &Reqwest,
  endpoint: &str,
  gacha_url: &str,
  gacha_type: Option<&str>,
  end_id: Option<&str>
) -> Result<GachaResponse<T>> {
  let endpoint_start = gacha_url.find(endpoint).ok_or(Error::IllegalGachaUrl)?;
  let base_url = &gacha_url[0..endpoint_start + endpoint.len()];
  let query_str = &gacha_url[endpoint_start + endpoint.len()..];

  let mut queries: HashMap<String, String> = form_urlencoded::parse(query_str.as_bytes())
    .into_owned()
    .collect();

  let origin_gacha_type = queries.get("gacha_type").cloned().ok_or(Error::IllegalGachaUrl)?;
  let origin_end_id = queries.get("end_id").cloned();
  let gacha_type = gacha_type.unwrap_or(&origin_gacha_type);

  queries.remove("gacha_type");
  queries.remove("page");
  queries.remove("size");
  queries.remove("begin_id");
  queries.remove("end_id");

  let mut url = Url::parse_with_params(base_url, queries)
    .map_err(|_| Error::IllegalGachaUrl)?;

  url
    .query_pairs_mut()
    .append_pair("page", "1")
    .append_pair("size", "20")
    .append_pair("gacha_type", gacha_type);

  if let Some(end_id) = end_id.or(origin_end_id.as_deref()) {
    url
      .query_pairs_mut()
      .append_pair("end_id", end_id);
  }

  let response: GachaResponse<T> = reqwest
    .get(url)
    .send()
    .await?
    .json()
    .await?;

  if response.retcode != 0 {
    if response.retcode == -101 {
      Err(Error::TimeoutdGachaUrl)
    } else {
      Err(Error::GachaRecordRetcode {
        retcode: response.retcode,
        message: response.message
      })
    }
  } else {
    Ok(response)
  }
}

//- Find the Gacha url and validate consistency
//  Hashmap<String, GachaUrl> GACHA_URL_CACHED
//    key: facet + uid + addr
//    value: GachaUrl

lazy_static! {
  static ref GACHA_URL_CACHED: Mutex<HashMap<String, GachaUrl>> = Default::default();
}

pub(crate) async fn find_gacha_url_and_validate_consistency<Record, Fetcher>(
  fetcher: &Fetcher,
  facet: &AccountFacet,
  uid: &str,
  gacha_urls: &[GachaUrl]
) -> Result<GachaUrl>
where
  Record: GachaRecord + Sized + Serialize + Send + Sync,
  Fetcher: GachaRecordFetcher<Target = Record>
{
  debug!("Find gacha url and validate consistency: facet={}, uid={}", facet, uid);
  let mut cached = GACHA_URL_CACHED.lock().await;


  let reqwest = create_default_reqwest()?;
  let local_datetime = OffsetDateTime::now_local().map_err(time::Error::from)?;
  let valid_gacha_urls: Vec<&GachaUrl> = gacha_urls
    .iter()
    .filter(|item| item.creation_time + time::Duration::DAY > local_datetime)
    .collect();

  debug!("Local datetime: {}", local_datetime);
  debug!("Total gacha urls: {}", valid_gacha_urls.len());

  fn combine_key(facet: &AccountFacet, uid: &str, gacha_url: &GachaUrl) -> String {
    format!("{}-{}-{}", facet, uid, gacha_url.addr)
  }

  for (counter, gacha_url) in valid_gacha_urls.into_iter().enumerate() {
    let key = combine_key(facet, uid, gacha_url);
    debug!("Validate gacha url with key: {}", key);

    // Hit cache
    if let Entry::Occupied(entry) = cached.entry(key.to_owned()) {
      let value = entry.get();
      if value.creation_time + time::Duration::DAY > local_datetime {
        debug!("Hit gacha url cache: key={}, creation_time={}", entry.key(), value.creation_time);
        return Ok(value.clone());
      } else {
        debug!("Remove expired gacha url cache: key={}", entry.key());
        entry.remove_entry();
      }
    }

    // Else validate consistency
    if counter != 0 && counter % 5 == 0 {
      debug!("Sleep 3 seconds");
      tokio::time::sleep(std::time::Duration::from_secs(3)).await;
    }

    let result = fetcher.fetch_gacha_records_any_uid(&reqwest, gacha_url).await;
    match result {
      Err(Error::GachaRecordRetcode { retcode, message }) => {
        // TODO: always retcode = -101 authkey timeout?
        debug!("Gacha record retcode: retcode={}, message={}", retcode, message);
        return Err(Error::VacantGachaUrl);
      },
      Err(err) => return Err(err),
      Ok(gacha_url_uid) => {
        // Always cache the result
        if let Some(gacha_url_uid) = gacha_url_uid.as_deref() {
          let key = combine_key(facet, gacha_url_uid, gacha_url);
          debug!("Cache gacha url: key={}, url={}", key, gacha_url.value);
          cached.insert(key.to_owned(), gacha_url.clone());
        }

        // Consistency check
        if gacha_url_uid.as_deref() == Some(uid) {
          return Ok(gacha_url.clone());
        } else {
          debug!("Gacha url uid mismatch: expected={}, actual={}", uid, gacha_url_uid.unwrap_or_default());
          continue;
        }
      }
    }
  }

  Err(Error::VacantGachaUrl)
}
