extern crate tauri;

use tauri::{Window, State};
use super::official::{GachaType, GachaLogItem};
use super::gacha_exporter::export_gacha_logs;
use super::gacha_fetcher::create_gacha_log_fetcher_channel;
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
  window: Window,
  channel_name: String,
  gacha_url: String,
  gacha_types: Option<Vec<GachaType>>
) -> Result<(), String> {
  create_gacha_log_fetcher_channel(gacha_url, gacha_types, |message| async {
    window.emit(&channel_name, message)?;
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
