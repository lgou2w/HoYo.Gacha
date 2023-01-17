extern crate chrono;
extern crate tauri;

use chrono::Local;
use super::{
  find_game_data_dir,
  find_recent_gacha_url,
  SerializedGachaUrl
};

const ERR_GAME_DATA_DIR_NOT_FOUND: &str = "游戏数据目录未找到。请确认游戏是否安装并运行。";
const ERR_GACHA_URL_NOT_FOUND    : &str = "祈愿链接未找到。请在游戏内打开祈愿历史记录页面。";
const ERR_GACHA_URL_IS_EXPIRED   : &str = "祈愿链接已过期。请在游戏内重新打开祈愿历史记录页面。";

#[tauri::command]
pub fn cmd_find_game_data_dir() -> Result<String, String> {
  let genshin_data_dir = find_game_data_dir().ok_or(ERR_GAME_DATA_DIR_NOT_FOUND)?;
  Ok(genshin_data_dir
    .into_os_string()
    .into_string()
    .unwrap())
}

#[tauri::command]
pub fn cmd_find_recent_gacha_url() -> Result<SerializedGachaUrl, String> {
  // let now = Local::now();
  let genshin_data_dir = find_game_data_dir().ok_or(ERR_GAME_DATA_DIR_NOT_FOUND)?;
  let gacha_url = find_recent_gacha_url(&genshin_data_dir).ok_or(ERR_GACHA_URL_NOT_FOUND)?;
  // if gacha_url.is_expired(&now) {
    // Err(ERR_GACHA_URL_IS_EXPIRED.into())
  // } else {
    Ok(SerializedGachaUrl::from(gacha_url))
  // }
}
