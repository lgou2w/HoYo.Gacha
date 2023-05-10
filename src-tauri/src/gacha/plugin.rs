extern crate tauri;

use std::path::PathBuf;
use tauri::Runtime;
use tauri::plugin::{Builder as TauriPluginBuilder, TauriPlugin};
use crate::error::Result;
use crate::storage::entity_account::AccountFacet;
use super::{
  GameDataDirectoryFinder,
  GenshinGacha,
  StarRailGacha
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

/// Tauri plugin

#[derive(Default)]
pub struct GachaPluginBuilder {}

impl GachaPluginBuilder {
  const PLUGIN_NAME: &str = "gacha";

  pub fn new() -> Self {
    Self::default()
  }

  pub fn build<R: Runtime>(self) -> TauriPlugin<R> {
    TauriPluginBuilder::new(Self::PLUGIN_NAME)
      .invoke_handler(tauri::generate_handler![
        find_game_data_directories
      ])
      .build()
  }
}
