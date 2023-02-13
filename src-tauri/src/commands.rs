extern crate tauri;

use crate::genshin;
use crate::gacha;
use crate::account;

pub fn get_handlers() -> Box<dyn Fn(tauri::Invoke<tauri::Wry>) + Send + Sync> {
  Box::new(tauri::generate_handler![
    genshin::command::cmd_find_available_game_directories,
    genshin::command::cmd_find_recent_gacha_url_from_account,
    gacha::command::cmd_crate_gacha_log_fetcher_channel,
    account::command::cmd_get_account_mange,
    account::command::cmd_add_account,
    account::command::cmd_remove_account,
    account::command::cmd_select_account
  ])
}
