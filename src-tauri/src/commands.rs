extern crate tauri;

use crate::genshin;

pub fn get_handlers() -> Box<dyn Fn(tauri::Invoke<tauri::Wry>) + Send + Sync> {
  Box::new(tauri::generate_handler![
    genshin::command::cmd_find_game_data_dir,
    genshin::command::cmd_find_recent_gacha_url
  ])
}
