use crate::bootstrap::environment::TauriEnvState;
use crate::constants;
use crate::database::TauriDatabaseState;

#[tauri::command]
pub fn locale() -> &'static str {
  &constants::LOCALE
}

#[tauri::command]
pub fn environment<'r>(env: TauriEnvState<'r>) -> serde_json::Value {
  env.to_json()
}

#[tauri::command]
pub fn system_fonts() -> Result<Vec<String>, String> {
  hg_ffi::system_fonts(&constants::LOCALE).map_err(|err| format!("{err:?}"))
}

#[tauri::command]
pub fn create_app_lnk() -> Result<(), String> {
  let desktop = hg_ffi::desktop_dir().map_err(|err| format!("{err:?}"))?;
  let dst_file = desktop.join(format!("{}.lnk", constants::APP_NAME));
  if dst_file.is_file() {
    Ok(())
  } else {
    hg_ffi::create_lnk(&*constants::EXE_PATH, dst_file).map_err(|err| format!("{err:?}"))
  }
}

#[tauri::command]
pub fn open_database_folder(state: TauriDatabaseState<'_>) {
  let _ = hg_ffi::open_with_explorer(&state.pool.manager().path);
}
