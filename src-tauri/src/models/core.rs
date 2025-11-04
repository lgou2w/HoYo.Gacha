use std::ops::{Deref, DerefMut};

use serde::{Deserialize, Serialize};
use tauri::Theme;

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ThemeData {
  pub namespace: Option<String>,
  pub color_scheme: Option<Theme>,
  pub scale: Option<u32>,
  pub font: Option<String>,
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

#[derive(Clone, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(transparent)]
pub struct Properties(serde_json::Map<String, serde_json::Value>);

impl Deref for Properties {
  type Target = serde_json::Map<String, serde_json::Value>;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl DerefMut for Properties {
  fn deref_mut(&mut self) -> &mut Self::Target {
    &mut self.0
  }
}
