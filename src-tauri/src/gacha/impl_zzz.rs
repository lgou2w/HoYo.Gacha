use super::utilities::{
  fetch_gacha_records, lookup_cognosphere_dir, lookup_gacha_urls_from_endpoint, lookup_mihoyo_dir,
  lookup_path_line_from_keyword, lookup_valid_cache_data_dir,
};
use super::{
  GachaRecord, GachaRecordFetcher, GachaRecordFetcherChannel, GachaUrl, GachaUrlFinder,
  GameDataDirectoryFinder,
};
use crate::error::Result;
use crate::storage::entity_account::AccountFacet;
use async_trait::async_trait;
use reqwest::Client as Reqwest;
use serde::{Deserialize, Serialize};
use std::any::Any;
use std::cmp::Ordering;
use std::path::{Path, PathBuf};

#[derive(Default, Deserialize)]
pub struct ZenlessZoneZeroGacha;

/// Game Directory
impl GameDataDirectoryFinder for ZenlessZoneZeroGacha {
  fn find_game_data_directories(&self) -> Result<Vec<PathBuf>> {
    let cognosphere_dir = lookup_cognosphere_dir();
    let mihoyo_dir = lookup_mihoyo_dir();
    let mut directories = Vec::new();

    // TODO: Untested
    const INTERNATIONAL_PLAYER_LOG: &str = "Zenless Zone Zero/Player.log";
    const INTERNATIONAL_DIR_KEYWORD: &str = "/ZenlessZoneZero_Data/";

    let mut player_log = cognosphere_dir.join(INTERNATIONAL_PLAYER_LOG);
    if let Some(directory) = lookup_path_line_from_keyword(player_log, INTERNATIONAL_DIR_KEYWORD)? {
      directories.push(directory);
    }

    const CHINESE_PLAYER_LOG: &str = "绝区零/Player.log";
    const CHINESE_DIR_KEYWORD: &str = "/ZenlessZoneZero_Data/";

    player_log = mihoyo_dir.join(CHINESE_PLAYER_LOG);
    if let Some(directory) = lookup_path_line_from_keyword(player_log, CHINESE_DIR_KEYWORD)? {
      directories.push(directory);
    }

    Ok(directories)
  }
}

/// Gacha Url
const ENDPOINT: &str = "/api/getGachaLog?";

impl GachaUrlFinder for ZenlessZoneZeroGacha {
  fn find_gacha_urls<P: AsRef<Path>>(&self, game_data_dir: P) -> Result<Vec<GachaUrl>> {
    // See: https://github.com/lgou2w/HoYo.Gacha/issues/10
    let cache_data_dir = lookup_valid_cache_data_dir(game_data_dir)?;
    lookup_gacha_urls_from_endpoint(cache_data_dir, ENDPOINT, true)
  }
}

/// Gacha Record

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
pub struct ZenlessZoneZeroGachaRecord {
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
  pub rank_type: String,
}

impl GachaRecord for ZenlessZoneZeroGachaRecord {
  fn id(&self) -> &str {
    &self.id
  }

  fn as_any(&self) -> &dyn Any {
    self
  }
}

impl PartialOrd for ZenlessZoneZeroGachaRecord {
  fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
    self.id.partial_cmp(&other.id)
  }
}

/// Gacha Record Fetcher
#[allow(unused)]
#[derive(Deserialize)]
pub(crate) struct ZenlessZoneZeroGachaRecordPagination {
  page: String,
  size: String,
  // total: String,
  list: Vec<ZenlessZoneZeroGachaRecord>,
  region: String,
  region_time_zone: i8,
}

#[async_trait]
impl GachaRecordFetcher for ZenlessZoneZeroGacha {
  type Target = ZenlessZoneZeroGachaRecord;

  async fn fetch_gacha_records(
    &self,
    reqwest: &Reqwest,
    gacha_url: &str,
    gacha_type: Option<&str>,
    end_id: Option<&str>,
  ) -> Result<Option<Vec<Self::Target>>> {
    let response = fetch_gacha_records::<ZenlessZoneZeroGachaRecordPagination>(
      reqwest,
      &AccountFacet::ZenlessZoneZero,
      ENDPOINT,
      gacha_url,
      gacha_type,
      end_id,
    )
    .await?;

    Ok(response.data.map(|pagination| pagination.list))
  }

  async fn fetch_gacha_records_any_uid(
    &self,
    reqwest: &Reqwest,
    gacha_url: &str,
  ) -> Result<Option<String>> {
    let result = self
      .fetch_gacha_records(reqwest, gacha_url, None, None)
      .await?;
    Ok(result.and_then(|gacha_records| gacha_records.first().map(|record| record.uid.clone())))
  }
}

#[async_trait]
impl GachaRecordFetcherChannel<ZenlessZoneZeroGachaRecord> for ZenlessZoneZeroGacha {
  type Fetcher = Self;
}
