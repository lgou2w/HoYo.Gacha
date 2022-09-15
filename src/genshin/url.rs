extern crate chrono;
extern crate regex;

use std::io::{Error, ErrorKind, Result};
use chrono::{DateTime, Utc};
use regex::Regex;
use crate::disk_cache;
use crate::genshin;

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

    let creation_time = entry.get_creation_time_as_utc();
    let mut url = disk_cache.read_entry_key_as_url(&entry)?;

    // These url start with '0/1/', only get the later part
    if url.starts_with("1/0/") {
      url = url[4..].to_string();
    }

    records.push((creation_time, url));
  }

  // Sort by creation time desc
  records.sort_by(|a, b| b.0.cmp(&a.0));

  // Find first gacha url
  let regex = Regex::new(r"(event/gacha_info/api/getGachaLog)").unwrap();
  for record in records {
    if regex.is_match(&record.1) {
      return Ok(record)
    }
  }

  Err(Error::new(ErrorKind::NotFound, "Gacha url not found"))
}
