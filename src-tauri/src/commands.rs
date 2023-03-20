extern crate tauri;

use crate::genshin;
use crate::third_party;
use crate::utils;

pub fn get_handlers() -> Box<dyn Fn(tauri::Invoke<tauri::Wry>) + Send + Sync> {
  Box::new(tauri::generate_handler![
    genshin::command::cmd_find_available_game_directories,
    genshin::command::cmd_find_recent_gacha_url,
    genshin::command::cmd_crate_gacha_log_fetcher_channel,
    genshin::command::cmd_find_gacha_logs_by_uid,
    genshin::command::cmd_export_gacha_logs_by_uid,
    genshin::command::cmd_import_gacha_logs_by_uid,
    third_party::command::cmd_third_party_enka_network_fetch_player_info,
    utils::command::cmd_open,
    utils::command::cmd_open_app_data_dir
  ])
}
