extern crate reqwest;
extern crate serde;
extern crate time;
extern crate tokio;
extern crate url;

use std::collections::HashMap;
use std::fs::File;
use std::io::{prelude::BufRead, BufReader};
use std::path::{Path, PathBuf};
use reqwest::Client as Reqwest;
use serde::Deserialize;
use serde::de::DeserializeOwned;
use time::OffsetDateTime;
use time::macros::offset;
use url::Url;
use crate::constants;
use crate::disk_cache::{IndexFile, BlockFile, EntryStore};
use crate::error::{Error, Result};
use super::GachaUrl;

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

pub(super) fn lookup_gacha_urls_from_endpoint<P: AsRef<Path>>(
  game_data_dir: P,
  endpoint: &str
) -> Result<Vec<GachaUrl>> {
  // Join the path to the web cache data directory
  let cache_dir = game_data_dir.as_ref().join("webCaches/Cache/Cache_Data");

  // Read index file and data_1, data_2 block files
  let index_file = IndexFile::from_file(cache_dir.join("index"))?;
  let block_file1 = BlockFile::from_file(cache_dir.join("data_1"))?;
  let block_file2 = BlockFile::from_file(cache_dir.join("data_2"))?;

  let mut result = Vec::new();

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
    if !url.contains(endpoint) {
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
      OffsetDateTime::from_unix_timestamp(timestamp)
        .unwrap()
        .to_offset(offset!(+8)) // TODO: International
    };

    result.push(GachaUrl {
      addr: Some(addr.into()),
      creation_time: Some(creation_time),
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
  gacha_url: &GachaUrl,
  gacha_type: &str,
  end_id: &str,
  endpoint: &str
) -> Result<GachaResponse<T>> {
  let endpoint_start = gacha_url.find(endpoint).ok_or(Error::IllegalGachaUrl)?;
  let base_url = &gacha_url[0..endpoint_start + endpoint.len()];
  let query_str = &gacha_url[endpoint_start + endpoint.len()..];

  let mut queries: HashMap<String, String> = form_urlencoded::parse(query_str.as_bytes())
    .into_owned()
    .collect();
  queries.remove("gacha_type");
  queries.remove("page");
  queries.remove("size");
  queries.remove("begin_id");
  queries.remove("end_id");

  let mut url = Url::parse_with_params(base_url, queries)
    .map_err(|_| Error::IllegalGachaUrl)?;
  url
    .query_pairs_mut()
    .append_pair("gacha_type", gacha_type)
    .append_pair("page", "1")
    .append_pair("size", "20")
    .append_pair("end_id", end_id);

  let response: GachaResponse<T> = reqwest
    .get(url)
    .send()
    .await?
    .json()
    .await?;

  if response.retcode != 0 {
    Err(Error::GachaRecordRetcode {
      retcode: response.retcode,
      message: response.message
    })
  } else {
    Ok(response)
  }
}
