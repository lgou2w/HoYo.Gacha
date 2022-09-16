extern crate chrono;
extern crate form_urlencoded;

use std::collections::HashMap;
use std::io::{Error, ErrorKind, Result};
use chrono::{DateTime, Utc};
use crate::disk_cache;
use crate::genshin;

const GACHA_URL_ENDPOINT: &'static str = "/event/gacha_info/api/getGachaLog?";
const GACHA_URL_ENDPOINT_LEN: usize = GACHA_URL_ENDPOINT.len();

pub fn find_recent_gacha_url() -> Result<(DateTime<Utc>, String)> {
  let genshin_data_dir = genshin::path::get_data_dir_path()?;
  let cache_dir = genshin_data_dir.join("webCaches/Cache/Cache_Data");
  let disk_cache = disk_cache::structs::DiskCache::from_dir(cache_dir)?;

  let mut records: Vec<(DateTime<Utc>, String)> = Vec::new();
  for addr in disk_cache.index_file.table.iter().cloned() {
    let entry = disk_cache.read_entry(addr)?;
    if entry.long_key == 0 {
      // Gacha url must be a long key and stored in the data_2 block file,
      // So the long key of entry must not be zero.
      continue;
    }

    let mut url = disk_cache.read_entry_key_as_url(&entry)?;

    // Get only valid gacha url
    if !url.contains(GACHA_URL_ENDPOINT) {
      continue;
    }

    // These url start with '1/0/', only get the later part
    if url.starts_with("1/0/") {
      url = url[4..].to_string();
    }

    let creation_time = entry.get_creation_time_as_utc();
    records.push((creation_time, url));
  }

  // Sort by creation time desc
  records.sort_by(|a, b| b.0.cmp(&a.0));

  // Find first gacha url
  match records.first() {
    Some(record) => Ok(record.to_owned()),
    None => Err(Error::new(ErrorKind::NotFound, "Gacha url not found"))
  }
}

pub fn parse_gacha_url_queries(gacha_url: &String) -> HashMap<String, String> {
  let start = gacha_url.find(GACHA_URL_ENDPOINT).expect("Invalid gacha url");
  let query = &gacha_url[start + GACHA_URL_ENDPOINT_LEN..];
  form_urlencoded::parse(query.as_bytes()).into_owned().collect()
}
