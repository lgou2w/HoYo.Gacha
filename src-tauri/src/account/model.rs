extern crate serde;

use std::cmp::Ordering;
use std::path::PathBuf;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Account {
  pub uid: u32,
  pub display_name: Option<String>,
  pub game_data_dir: PathBuf
}

impl PartialEq for Account {
  fn eq(&self, other: &Self) -> bool {
    self.uid == other.uid
  }
}

impl PartialOrd for Account {
  fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
    self.uid.partial_cmp(&other.uid)
  }
}
