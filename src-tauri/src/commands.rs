extern crate tauri;

use crate::genshin;

pub fn get_handlers() -> Box<dyn Fn(tauri::Invoke<tauri::Wry>) + Send + Sync> {
  Box::new(tauri::generate_handler![
    genshin::command::cmd_find_available_game_directories,
    genshin::command::cmd_find_recent_gacha_url,
    genshin::command::cmd_crate_gacha_log_fetcher_channel,
    genshin::command::cmd_find_gacha_logs_by_uid,
    genshin::command::cmd_export_gacha_logs_by_uid
  ])
}
