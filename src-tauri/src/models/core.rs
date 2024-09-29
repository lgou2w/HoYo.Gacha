use serde::{Deserialize, Serialize};
use tauri::Theme;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeData {
  pub namespace: String,
  pub color_scheme: Theme,
  pub scale: u32,
}
