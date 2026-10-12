use crate::constants;

#[tauri::command]
pub fn locale() -> &'static str {
  &constants::LOCALE
}
