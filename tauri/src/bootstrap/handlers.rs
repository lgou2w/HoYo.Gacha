use crate::bootstrap::environment::TauriEnvState;
use crate::constants;

#[tauri::command]
pub fn locale() -> &'static str {
  &constants::LOCALE
}

#[tauri::command]
pub fn environment<'r>(env: TauriEnvState<'r>) -> serde_json::Value {
  env.to_json()
}
