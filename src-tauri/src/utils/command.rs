extern crate opener;
extern crate tauri;

use tauri::AppHandle;
use super::ResultExt;

#[tauri::command]
pub fn cmd_open(path: String) -> Result<(), String> {
  opener::open(path).map_err_to_string()
}

#[tauri::command]
pub fn cmd_open_app_data_dir(app_handle: AppHandle) -> Result<(), String> {
  let path = app_handle
    .path_resolver()
    .app_data_dir()
    .ok_or("App data dir not found".to_string())?;
  opener::open(path).map_err_to_string()
}
