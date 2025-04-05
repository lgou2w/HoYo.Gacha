use serde::{Deserialize, Serialize};
use tauri::Theme;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeData {
  pub namespace: Option<String>,
  pub color_scheme: Option<Theme>,
  pub scale: Option<u32>,
}
