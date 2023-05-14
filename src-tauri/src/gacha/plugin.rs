extern crate reqwest;
extern crate tauri;

use std::path::PathBuf;
use std::collections::BTreeMap;
use tauri::plugin::{Builder as TauriPluginBuilder, TauriPlugin};
use crate::error::Result;
use crate::storage::Storage;
use crate::storage::entity_account::AccountFacet;
use super::{
  GameDataDirectoryFinder,
  GachaUrlFinder,
  GenshinGacha,
  StarRailGacha,
  GachaRecordFetcherChannelFragment,
  create_fetcher_channel,
};
use super::utilities::{
  create_default_reqwest,
  find_gacha_url_and_validate_consistency,
};

/// Tauri commands

#[tauri::command]
async fn find_game_data_directories(
  facet: AccountFacet
) -> Result<Vec<PathBuf>> {
  match facet {
    AccountFacet::Genshin => GenshinGacha.find_game_data_directories(),
    AccountFacet::StarRail => StarRailGacha.find_game_data_directories()
  }
}

#[tauri::command]
async fn find_gacha_url(
  facet: AccountFacet,
  uid: String,
  game_data_dir: PathBuf
) -> Result<String> {
  let gacha_url = match facet {
    AccountFacet::Genshin => {
      let gacha_urls = GenshinGacha.find_gacha_urls(game_data_dir)?;
      find_gacha_url_and_validate_consistency(&GenshinGacha, &facet, &uid, &gacha_urls).await?
    },
    AccountFacet::StarRail => {
      let gacha_urls = StarRailGacha.find_gacha_urls(game_data_dir)?;
      find_gacha_url_and_validate_consistency(&StarRailGacha, &facet, &uid, &gacha_urls).await?
    }
  };

  Ok(gacha_url.to_string())
}

#[allow(clippy::too_many_arguments)]
#[tauri::command]
async fn pull_all_gacha_records(
  window: tauri::Window,
  storage: tauri::State<'_, Storage>,
  facet: AccountFacet,
  #[allow(unused)] uid: String,
  gacha_url: String,
  gacha_type_and_last_end_id_mappings: BTreeMap<String, Option<String>>,
  event_channel: String,
  save_to_storage: Option<bool>
) -> Result<()> {
  let reqwest = create_default_reqwest()?;
  let save_to_storage = save_to_storage.unwrap_or(false);

  // TODO: validate uid and gacha_url consistency ?

  match facet {
    AccountFacet::Genshin =>
      create_fetcher_channel(
        GenshinGacha,
        reqwest,
        GenshinGacha,
        gacha_url,
        gacha_type_and_last_end_id_mappings,
        |fragment| async {
          window.emit(&event_channel, &fragment)?;
          if save_to_storage {
            if let GachaRecordFetcherChannelFragment::Data(data) = fragment {
              storage.save_genshin_gacha_records(&data).await?;
            }
          }
          Ok(())
        }
      ).await?,
    AccountFacet::StarRail =>
      create_fetcher_channel(
        StarRailGacha,
        reqwest,
        StarRailGacha,
        gacha_url,
        gacha_type_and_last_end_id_mappings,
        |fragment| async {
          window.emit(&event_channel, &fragment)?;
          if save_to_storage {
            if let GachaRecordFetcherChannelFragment::Data(data) = fragment {
              storage.save_starrail_gacha_records(&data).await?;
            }
          }
          Ok(())
        }
      ).await?
  }

  Ok(())
}

/// Tauri plugin

#[derive(Default)]
pub struct GachaPluginBuilder {}

impl GachaPluginBuilder {
  const PLUGIN_NAME: &str = "gacha";

  pub fn new() -> Self {
    Self::default()
  }

  pub fn build(self) -> TauriPlugin<tauri::Wry> {
    TauriPluginBuilder::new(Self::PLUGIN_NAME)
      .invoke_handler(tauri::generate_handler![
        find_game_data_directories,
        find_gacha_url,
        pull_all_gacha_records
      ])
      .build()
  }
}
