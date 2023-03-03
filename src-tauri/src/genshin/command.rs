extern crate tauri;

use std::collections::BTreeMap;
use tauri::{Window, State};
use super::official::{GachaType, GachaLogItem};
use super::gacha_exporter::export_gacha_logs;
use super::gacha_importer::import_gacha_logs;
use super::gacha_fetcher::{GachaLogFetcherChannelMessage, create_gacha_log_fetcher_channel};
use super::gacha_url::{GachaUrl, find_recent_gacha_url_and_validate};
use super::path_finder::{GameDirectory, find_available_game_directories};
use crate::core::{CoreManage, GachaManageExt};
use crate::utils::ResultExt;

#[tauri::command]
pub fn cmd_find_available_game_directories() -> Result<Vec<GameDirectory>, String> {
  find_available_game_directories()
    .map_err_to_string()
}

#[tauri::command]
pub async fn cmd_find_recent_gacha_url(
  game_data_dir: String,
  expected_uid: u32
) -> Result<GachaUrl, String> {
  find_recent_gacha_url_and_validate(game_data_dir, expected_uid)
    .await
    .map_err_to_string()
}

#[tauri::command]
pub async fn cmd_crate_gacha_log_fetcher_channel(
  state: State<'_, CoreManage>,
  window: Window,
  channel_name: String,
  gacha_url: String,
  gacha_types_arguments: Option<BTreeMap<GachaType, Option<String>>>,
  into_database: Option<bool>
) -> Result<(), String> {
  let into_database = into_database.unwrap_or(false);
  create_gacha_log_fetcher_channel(gacha_url, gacha_types_arguments, |message| async {
    window.emit(&channel_name, &message)?;
    if into_database {
      if let GachaLogFetcherChannelMessage::Data(gacha_logs) = message {
        state.save_gacha_logs(&gacha_logs).await?;
      }
    }
    Ok(())
  })
    .await
    .map_err_to_string()
}

#[tauri::command]
pub async fn cmd_find_gacha_logs_by_uid(
  state: State<'_, CoreManage>,
  uid: u32,
  gacha_type: Option<GachaType>
) -> Result<Vec<GachaLogItem>, String> {
  state.find_gacha_logs(uid, gacha_type.as_ref())
    .await
    .map_err_to_string()
}

#[tauri::command]
pub async fn cmd_export_gacha_logs_by_uid(
  state: State<'_, CoreManage>,
  uid: u32,
  directory: String,
  uigf: bool // true = UIGF.J, false = UIGF.W
) -> Result<String, String> {
  export_gacha_logs(&state, uid, directory, uigf)
    .await
    .map_err_to_string()
}

#[tauri::command]
pub async fn cmd_import_gacha_logs_by_uid(
  state: State<'_, CoreManage>,
  uid: u32,
  file: String
) -> Result<u64, String> {
  import_gacha_logs(&state, uid, file)
    .await
    .map_err_to_string()
}
