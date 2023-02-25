extern crate chrono;
extern crate futures_core;
extern crate serde;

use std::error::Error;
use std::path::Path;
use chrono::{DateTime, Duration, Local, NaiveDateTime, SecondsFormat, Utc};
use futures_core::future::BoxFuture;
use serde::ser::{Serialize, Serializer, SerializeStruct};
use super::gacha_fetcher::GachaLogFetcher;
use crate::disk_cache::{CacheAddr, IndexFile, BlockFile, EntryStore};
use crate::errors;

pub const GACHA_URL_ENDPOINT: &str = "/event/gacha_info/api/getGachaLog?";

#[derive(Debug, Clone)]
pub struct GachaUrl {
  pub addr: CacheAddr,
  pub creation_time: DateTime<Utc>,
  pub url: String
}

impl Serialize for GachaUrl {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where S: Serializer {
    let mut state = serializer.serialize_struct("GachaUrl", 3)?;
    state.serialize_field("addr", &self.addr)?;
    state.serialize_field("creationTime", &self.creation_time.to_rfc3339_opts(SecondsFormat::Millis, true))?;
    state.serialize_field("url", &self.url)?;
    state.end()
  }
}

pub fn find_gacha_urls<P: AsRef<Path>>(game_data_dir: P) -> std::io::Result<Vec<GachaUrl>> {
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
    if !url.contains(GACHA_URL_ENDPOINT) {
      continue;
    }

    let mut url = url.to_string();

    // These url start with '1/0/', only get the later part
    if url.starts_with("1/0/") {
      url = url[4..].to_string();
    }

    // Convert creation time
    let creation_time = creation_time_as_utc(&entry.creation_time);

    result.push(GachaUrl {
      addr,
      creation_time,
      url
    })
  }

  Ok(result)
}

pub fn find_recent_gacha_url<P: AsRef<Path>>(game_data_dir: P) -> Option<GachaUrl> {
  // Find all gacha urls
  let mut gacha_urls = match find_gacha_urls(game_data_dir) {
    Ok(result) => result,
    Err(_) => return None
  };

  // Sort DESC by creation time
  gacha_urls.sort_by(|a, b| b.creation_time.cmp(&a.creation_time));

  // First one is the latest
  gacha_urls.first().cloned()
}

fn windows_ticks_to_unix_timestamps(ticks: u64) -> (i64, u32) {
  let seconds = ticks / 10_000_000 - 11_644_473_600;
  let nano_seconds = ticks % 10_000_000;
  (seconds as i64, nano_seconds as u32)
}

fn creation_time_as_utc(creation_time: &u64) -> DateTime<Utc> {
  let (seconds, nano_seconds) = windows_ticks_to_unix_timestamps(
    // The creation time of the entry store must be multiplied by 10 for correct windows ticks
    *creation_time * 10
  );
  NaiveDateTime
    ::from_timestamp_opt(seconds, nano_seconds)
    .expect("Invalid creation time")
    .and_local_timezone(Utc)
    .unwrap()
}

pub fn find_recent_gacha_url_and_validate<'a, P: AsRef<Path> + Send + 'a>(
  game_data_dir: P,
  expected_uid: u32
) -> BoxFuture<'a, Result<GachaUrl, Box<dyn Error + Send + Sync>>> {
  Box::pin(async move {
    let gacha_url = find_recent_gacha_url(game_data_dir).ok_or(errors::ERR_GACHA_URL_NOT_FOUND)?;

    // First verify the creation time of the current gacha url
    {
      let current_time = Local::now() + Duration::minutes(1); // One minute ahead of time
      let expiration_time = (gacha_url.creation_time + Duration::days(1)).with_timezone(&Local);
      if current_time >= expiration_time {
        return Err(errors::ERR_TIMEOUTD_GACHA_URL.into());
      }
    }

    // Request validation
    {
      let fetcher = GachaLogFetcher::new(&gacha_url.url)?;
      let response = fetcher.fetch_raw().await?;
      let mut current_uid: Option<u32> = None;
      if let Some(data) = response.data {
        if let Some(any) = data.list.first() {
          current_uid = Some(any.uid.parse()?)
        }
      }

      if current_uid != Some(expected_uid) {
        return Err(errors::ERR_INVALID_GACHA_URL.into())
      }
    }

    Ok(gacha_url)
  })
}
