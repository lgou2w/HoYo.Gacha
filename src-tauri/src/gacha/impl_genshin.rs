extern crate async_trait;
extern crate reqwest;
extern crate serde;

use super::utilities::{
    fetch_gacha_records, lookup_gacha_urls_from_endpoint, lookup_mihoyo_dir,
    lookup_path_line_from_keyword,
};
use super::utilities::{
    fetch_gacha_records, lookup_gacha_urls_from_endpoint, lookup_mihoyo_dir,
    lookup_path_line_from_keyword, lookup_valid_cache_data_dir,
};
use super::{
    GachaRecord, GachaRecordFetcher, GachaRecordFetcherChannel, GachaUrl, GachaUrlFinder,
    GameDataDirectoryFinder,
};
use super::{
    GachaRecord, GachaRecordFetcher, GachaRecordFetcherChannel, GachaUrl, GachaUrlFinder,
    GameDataDirectoryFinder,
};
use crate::error::Result;
use crate::error::Result;
use async_trait::async_trait;
use reqwest::Client as Reqwest;
use serde::{Deserialize, Serialize};

#[derive(Default, Deserialize)]
pub struct GenshinGacha;

/// Game Directory

impl GameDataDirectoryFinder for GenshinGacha {
    fn find_game_data_directories(&self) -> Result<Vec<PathBuf>> {
        let mihoyo_dir = lookup_mihoyo_dir();
        let mut directories = Vec::new();

        // TODO: Untested
        const INTERNATIONAL_OUTPUT_LOG: &str = "Genshin Impact/output_log.txt";
        const INTERNATIONAL_DIR_KEYWORD: &str = "/GenshinImpact_Data/";

        let output_log = mihoyo_dir.join(INTERNATIONAL_OUTPUT_LOG);
        if let Some(directory) =
            lookup_path_line_from_keyword(&output_log, INTERNATIONAL_DIR_KEYWORD)?
        {
            directories.push(directory);
        }

        Ok(directories)
    }
}

/// Gacha Url

const ENDPOINT: &str = "/event/gacha_info/api/getGachaLog?";
// const ENDPOINT: &str = "e20190909gacha-v2";

impl GachaUrlFinder for GenshinGacha {
    fn find_gacha_urls<P: AsRef<Path>>(&self, game_data_dir: P) -> Result<Vec<GachaUrl>> {
        // See: https://github.com/lgou2w/HoYo.Gacha/issues/10
        let cache_data_dir = lookup_valid_cache_data_dir(game_data_dir)?;
        lookup_gacha_urls_from_endpoint(cache_data_dir, ENDPOINT)
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
    pub rank_type: String,
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
    region: String,
}

#[async_trait]
impl GachaRecordFetcher for GenshinGacha {
    type Target = GenshinGachaRecord;

    async fn fetch_gacha_records(
        &self,
        reqwest: &Reqwest,
        gacha_url: &str,
        gacha_type: Option<&str>,
        end_id: Option<&str>,
    ) -> Result<Option<Vec<Self::Target>>> {
        let response = fetch_gacha_records::<GenshinGachaRecordPagination>(
            reqwest, ENDPOINT, gacha_url, gacha_type, end_id,
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
impl GachaRecordFetcherChannel<GenshinGachaRecord> for GenshinGacha {
    type Fetcher = Self;
}
