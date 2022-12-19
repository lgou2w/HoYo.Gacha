extern crate chrono;
extern crate disk_cache;

use std::io::{Error, ErrorKind, Result};
use std::path::PathBuf;
use chrono::{DateTime, NaiveDateTime, Utc};
use disk_cache::index_file::IndexFile;
use disk_cache::block_file::BlockFile;
use disk_cache::entry_store::EntryStore;

pub const ENDPOINT: &'static str = "/event/gacha_info/api/getGachaLog?";

pub fn find_recent_gacha_url(genshin_data_dir: &PathBuf) -> Result<(DateTime<Utc>, String)> {
  let cache_dir = genshin_data_dir.join("webCaches/Cache/Cache_Data");
  let index_file = IndexFile::from_file(cache_dir.join("index"))?;
  let block_file1 = BlockFile::from_file(cache_dir.join("data_1"))?;
  let block_file2 = BlockFile::from_file(cache_dir.join("data_2"))?;

  let mut records: Vec<(DateTime<Utc>, String)> = Vec::new();
  for addr in *index_file.table {

    let entry = EntryStore::from_block_file(&block_file1, addr)?;
    if !entry.is_long_url() {
      // Gacha url must be a long key and stored in the data_2 block file,
      // So the long key of entry must not be zero.
      continue;
    }

    let url = entry.get_long_url(&block_file2)?;

    // Get only valid gacha url
    if !url.contains(ENDPOINT) {
      continue;
    }

    let mut url = url.to_string();

    // These url start with '1/0/', only get the later part
    if url.starts_with("1/0/") {
      url = url[4..].to_string();
    }

    let creation_time = entry_store_creation_time_as_utc(&entry);
    records.push((creation_time, url));
  }

  // Sort by creation time desc
  records.sort_by(|a, b| b.0.cmp(&a.0));

  // Find first gacha url
  match records.first() {
    Some(record) => Ok(record.clone()),
    None => Err(Error::new(ErrorKind::NotFound, "Gacha url not found"))
  }
}

fn windows_ticks_to_unix_timestamps(ticks: u64) -> (i64, u32) {
  let seconds = ticks / 10_000_000 - 11_644_473_600;
  let nano_seconds = ticks % 10_000_000;
  (seconds as i64, nano_seconds as u32)
}

fn entry_store_creation_time_as_utc(entry: &EntryStore) -> DateTime<Utc> {
  let creation_time = entry.creation_time;
  let (seconds, nano_seconds) = windows_ticks_to_unix_timestamps(
    // The creation time of the entry store must be multiplied by 10 for correct windows ticks
    creation_time * 10
  );
  NaiveDateTime
    ::from_timestamp_opt(seconds, nano_seconds)
    .expect("Invalid creation time")
    .and_local_timezone(Utc)
    .unwrap()
}
