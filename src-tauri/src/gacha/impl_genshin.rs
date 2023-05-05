extern crate async_trait;
extern crate reqwest;
extern crate serde;

use std::any::Any;
use std::cmp::Ordering;
use std::path::{Path, PathBuf};
use async_trait::async_trait;
use reqwest::Client as Reqwest;
use serde::{Deserialize, Serialize};
use crate::error::Result;
use super::{
  GameDataDirectoryFinder,
  GachaUrl,
  GachaUrlFinder,
  GachaRecord,
  GachaRecordFetcher,
  GachaRecordFetcherChannel,
  lookup_mihoyo_dir,
  lookup_path_line_from_keyword,
  lookup_gacha_urls_from_endpoint,
  fetch_gacha_records
};

#[derive(Default, Deserialize)]
pub struct GenshinGacha;

/// Game Directory

impl GameDataDirectoryFinder for GenshinGacha {
  fn find_game_data_directories(&self) -> Result<Vec<PathBuf>> {
    let mihoyo_dir = lookup_mihoyo_dir();
    let mut directories = Vec::new();

    const INTERNATIONAL_OUTPUT_LOG : &str = "Genshin Impact/output_log.txt";
    const INTERNATIONAL_DIR_KEYWORD: &str = "/GenshinImpact_Data/";
    const CHINESE_OUTPUT_LOG       : &str = "原神/output_log.txt";
    const CHINESE_DIR_KEYWORD      : &str = "/YuanShen_Data/";

    let mut output_log = mihoyo_dir.join(INTERNATIONAL_OUTPUT_LOG);
    if let Some(directory) = lookup_path_line_from_keyword(&output_log, INTERNATIONAL_DIR_KEYWORD)? {
      directories.push(directory);
    }

    output_log = mihoyo_dir.join(CHINESE_OUTPUT_LOG);
    if let Some(directory) = lookup_path_line_from_keyword(&output_log, CHINESE_DIR_KEYWORD)? {
      directories.push(directory);
    }

    Ok(directories)
  }
}

/// Gacha Url

const ENDPOINT: &str = "/event/gacha_info/api/getGachaLog?";

impl GachaUrlFinder for GenshinGacha {
  fn find_gacha_urls<P: AsRef<Path>>(&self,
    game_data_dir: P
  ) -> Result<Vec<GachaUrl>> {
    lookup_gacha_urls_from_endpoint(game_data_dir, ENDPOINT)
  }
}

/// Gacha Record

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub struct GenshinGachaRecord {
  pub id: String,
  pub uid: String,
  pub gacha_type: String,
  pub item_id: String,
  pub count: String,
  pub time: String,
  pub name: String,
  pub lang: String,
  pub item_type: String,
  pub rank_type: String
}

impl GachaRecord for GenshinGachaRecord {
  fn id(&self) -> &str {
    &self.id
  }

  fn as_any(&self) -> &dyn Any {
    self
  }
}

impl PartialOrd for GenshinGachaRecord {
  fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
    self.id.partial_cmp(&other.id)
  }
}

/// Gacha Record Fetcher

#[allow(unused)]
#[derive(Deserialize)]
pub(crate) struct GenshinGachaRecordPagination {
  page: String,
  size: String,
  total: String,
  list: Vec<GenshinGachaRecord>,
  region: String
}

#[async_trait]
impl GachaRecordFetcher for GenshinGacha {
  type Target = GenshinGachaRecord;

  async fn fetch_gacha_records(&self,
    reqwest: &Reqwest,
    gacha_url: &GachaUrl,
    gacha_type: &str,
    end_id: &str
  ) -> Result<Option<Vec<Self::Target>>> {
    let response = fetch_gacha_records::<GenshinGachaRecordPagination>(
      reqwest,
      gacha_url,
      gacha_type,
      end_id,
      ENDPOINT
    ).await?;

    Ok(response.data.map(|pagination| pagination.list))
  }
}

#[async_trait]
impl GachaRecordFetcherChannel<GenshinGachaRecord> for GenshinGacha {
  type Fetcher = Self;
}
