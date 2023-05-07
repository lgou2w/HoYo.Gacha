extern crate async_trait;
extern crate reqwest;
extern crate serde;
extern crate url;

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
  lookup_cognosphere_dir,
  lookup_path_line_from_keyword,
  lookup_gacha_urls_from_endpoint,
  fetch_gacha_records
};

#[derive(Default, Deserialize)]
pub struct StarRailGacha;

/// Game Directory

impl GameDataDirectoryFinder for StarRailGacha {
  fn find_game_data_directories(&self) -> Result<Vec<PathBuf>> {
    let cognosphere_dir = lookup_cognosphere_dir();
    let mihoyo_dir = lookup_mihoyo_dir();
    let mut directories = Vec::new();

    const INTERNATIONAL_PLAYER_LOG : &str = "/Star Rail/Player.log";
    const INTERNATIONAL_DIR_KEYWORD: &str = "/StarRail_Data/";

    let mut player_log = cognosphere_dir.join(INTERNATIONAL_PLAYER_LOG);
    if let Some(directory) = lookup_path_line_from_keyword(player_log, INTERNATIONAL_DIR_KEYWORD)? {
      directories.push(directory);
    }

    const CHINESE_PLAYER_LOG       : &str = "崩坏：星穹铁道/Player.log";
    const CHINESE_DIR_KEYWORD      : &str = "/StarRail_Data/";

    player_log = mihoyo_dir.join(CHINESE_PLAYER_LOG);
    if let Some(directory) = lookup_path_line_from_keyword(player_log, CHINESE_DIR_KEYWORD)? {
      directories.push(directory);
    }

    Ok(directories)
  }
}

/// Gacha Url

const ENDPOINT: &str = "/common/gacha_record/api/getGachaLog?";

impl GachaUrlFinder for StarRailGacha {
  fn find_gacha_urls<P: AsRef<Path>>(&self,
    game_data_dir: P
  ) -> Result<Vec<GachaUrl>> {
    lookup_gacha_urls_from_endpoint(game_data_dir, ENDPOINT)
  }
}

/// Gacha Record

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct StarRailGachaRecord {
  pub id: String,
  pub uid: String,
  pub gacha_id: String,
  pub gacha_type: String,
  pub item_id: String,
  pub count: String,
  pub time: String,
  pub name: String,
  pub lang: String,
  pub item_type: String,
  pub rank_type: String
}

impl GachaRecord for StarRailGachaRecord {
  fn id(&self) -> &str {
    &self.id
  }

  fn as_any(&self) -> &dyn Any {
    self
  }
}

impl PartialOrd for StarRailGachaRecord {
  fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
    self.id.partial_cmp(&other.id)
  }
}

/// Gacha Record Fetcher

#[allow(unused)]
#[derive(Deserialize)]
pub(crate) struct StarRailGachaRecordPagination {
  page: String,
  size: String,
  // total: String,
  list: Vec<StarRailGachaRecord>,
  region: String,
  region_time_zone: i8
}

#[async_trait]
impl GachaRecordFetcher for StarRailGacha {
  type Target = StarRailGachaRecord;

  async fn fetch_gacha_records(&self,
    reqwest: &Reqwest,
    gacha_url: &GachaUrl,
    gacha_type: &str,
    end_id: &str
  ) -> Result<Option<Vec<Self::Target>>> {
    let response = fetch_gacha_records::<StarRailGachaRecordPagination>(
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
impl GachaRecordFetcherChannel<StarRailGachaRecord> for StarRailGacha {
  type Fetcher = Self;
}
