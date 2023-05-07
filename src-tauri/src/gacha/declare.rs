extern crate async_trait;
extern crate form_urlencoded;
extern crate reqwest;
extern crate serde;
extern crate time;
extern crate tokio;
extern crate url;

use std::any::Any;
use std::collections::HashMap;
use std::fs::File;
use std::io::{prelude::BufRead, BufReader};
use std::path::{Path, PathBuf};
use async_trait::async_trait;
use reqwest::Client as Reqwest;
use serde::{Deserialize, Serialize};
use serde::de::DeserializeOwned;
use time::OffsetDateTime;
use time::macros::offset;
use url::Url;
use crate::disk_cache::{IndexFile, BlockFile, EntryStore};
use crate::error::{Error, Result};

/// Game Directory

// TODO:
//    International

pub trait GameDataDirectoryFinder {
  fn find_game_data_directories(&self) -> Result<Vec<PathBuf>>;
}

/// Gacha Url

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct GachaUrl {
  pub addr: u32,
  pub creation_time: OffsetDateTime,
  pub value: String
}

impl std::ops::Deref for GachaUrl {
  type Target = String;

  fn deref(&self) -> &Self::Target {
    &self.value
  }
}

pub trait GachaUrlFinder {
  fn find_gacha_urls<P: AsRef<Path>>(&self,
    game_data_dir: P
  ) -> Result<Vec<GachaUrl>>;
}

/// Gacha Record

pub trait GachaRecord: Any {
  fn id(&self) -> &str;
  fn as_any(&self) -> &dyn Any;
}

impl dyn GachaRecord {
  #[allow(unused)]
  pub fn downcast_ref<T: GachaRecord>(&self) -> Option<&T> {
    self.as_any().downcast_ref::<T>()
  }
}

/// Gacha Record Fetcher

#[async_trait]
pub trait GachaRecordFetcher {
  type Target: GachaRecord;

  async fn fetch_gacha_records(&self,
    reqwest: &Reqwest,
    gacha_url: &GachaUrl,
    gacha_type: &str,
    end_id: &str
  ) -> Result<Option<Vec<Self::Target>>>;
}

/// Gacha Record Fetcher Channel

#[allow(unused)]
#[derive(Debug, Clone, Serialize)]
pub enum GachaRecordFetcherChannelFragment<T: GachaRecord + Sized + Serialize + Send + Sync> {
  Sleeping,
  Ready(String),
  Pagination(u32),
  Data(Vec<T>),
  Finished
}

#[async_trait]
pub trait GachaRecordFetcherChannel<T: GachaRecord + Sized + Serialize + Send + Sync> {
  type Fetcher: GachaRecordFetcher<Target = T> + Sync;

  async fn pull_gacha_records(&self,
    reqwest: &Reqwest,
    fetcher: &Self::Fetcher,
    sender: &tokio::sync::mpsc::Sender<GachaRecordFetcherChannelFragment<T>>,
    gacha_url: &GachaUrl,
    gacha_type: &str,
    last_end_id: Option<&str>
  ) -> Result<()> {
    const SLEEPING: u64 = 3;

    sender.send(GachaRecordFetcherChannelFragment::Ready(gacha_type.to_owned()))
      .await
      .map_err(|_| Error::GachaRecordFetcherChannelSend)?;
    tokio::time::sleep(tokio::time::Duration::from_secs(SLEEPING)).await;

    let mut end_id = String::from("0");
    let mut pagination: u32 = 1;

    loop {
      if pagination % 5 == 0 {
        sender.send(GachaRecordFetcherChannelFragment::Sleeping)
          .await
          .map_err(|_| Error::GachaRecordFetcherChannelSend)?;
        tokio::time::sleep(tokio::time::Duration::from_secs(SLEEPING)).await;
      }

      sender.send(GachaRecordFetcherChannelFragment::Pagination(pagination))
        .await
        .map_err(|_| Error::GachaRecordFetcherChannelSend)?;
      let gacha_records = fetcher.fetch_gacha_records(reqwest, gacha_url, gacha_type, &end_id).await?;
      pagination += 1;

      if let Some(gacha_records) = gacha_records {
        if !gacha_records.is_empty() {
          end_id = gacha_records.last().unwrap().id().to_owned();

          let mut should_break = false;
          let data = if let Some(last) = last_end_id {
            let mut tmp = Vec::with_capacity(gacha_records.len());
            for record in gacha_records {
              if last.cmp(record.id()).is_le() {
                tmp.push(record);
              } else {
                should_break = true;
              }
            }
            tmp
          } else {
            gacha_records
          };

          sender.send(GachaRecordFetcherChannelFragment::Data(data))
            .await
            .map_err(|_| Error::GachaRecordFetcherChannelSend)?;

          if should_break {
            break;
          } else {
            tokio::time::sleep(tokio::time::Duration::from_secs(SLEEPING)).await;
            continue;
          }
        }
      }

      break;
    }

    sender.send(GachaRecordFetcherChannelFragment::Finished)
      .await
      .map_err(|_| Error::GachaRecordFetcherChannelSend)?;
    Ok(())
  }
}

/// Utilities

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
  gacha_url: &GachaUrl,
  gacha_type: impl Into<String> + Send,
  end_id: impl Into<String> + Send,
  endpoint: &str
) -> Result<GachaResponse<T>> {
  let endpoint_start = gacha_url.find(endpoint).ok_or(Error::InvalidGachaUrl)?;
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

  let mut url = Url::parse_with_params(base_url, queries)?;
  url
    .query_pairs_mut()
    .append_pair("gacha_type", &gacha_type.into())
    .append_pair("page", "1")
    .append_pair("size", "20")
    .append_pair("end_id", &end_id.into());

  let response: GachaResponse<T> = reqwest
    .get(url)
    .send()
    .await?
    .json()
    .await?;

  if response.retcode != 0 {
    Err(Error::Retcode {
      retcode: response.retcode,
      message: response.message
    })
  } else {
    Ok(response)
  }
}
