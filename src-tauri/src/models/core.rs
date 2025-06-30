use serde::{Deserialize, Serialize};
use tauri::Theme;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeData {
  pub namespace: Option<String>,
  pub color_scheme: Option<Theme>,
  pub scale: Option<u32>,
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowState {
  pub width: u32,
  pub height: u32,
  pub x: i32,
  pub y: i32,
  pub prev_x: i32,
  pub prev_y: i32,
  pub maximized: bool,
}
