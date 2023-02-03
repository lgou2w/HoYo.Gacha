extern crate tauri;

use tauri::State;
use super::{GameDirectory, GachaUrl, find_available_game_directories, find_recent_gacha_url};
use crate::account::AccountManage;

#[tauri::command]
pub fn cmd_find_available_game_directories() -> Result<Vec<GameDirectory>, String> {
  find_available_game_directories()
    .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn cmd_find_recent_gacha_url_from_account(
  state: State<AccountManage>,
  uid: u32
) -> Result<Option<GachaUrl>, String> {
  let account = state.get_account(uid)?;
  let gacha_url = find_recent_gacha_url(&account.game_data_dir);
  Ok(gacha_url)
}
