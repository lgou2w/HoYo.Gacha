extern crate serde;

use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct UIGFGachaLogInfo {
  pub uid: String,
  pub lang: String,
  pub export_time: String,
  pub export_timestamp: i64,
  pub export_app: String,
  pub export_app_version: String,
  pub uigf_version: String
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UIGFGachaLogEntry {
  pub count: Option<String>,
  pub gacha_type: String,
  pub id: String,
  pub item_id: Option<String>,
  pub item_type: String,
  pub lang: Option<String>,
  pub name: String,
  pub rank_type: Option<String>,
  pub time: Option<String>,
  pub uid: Option<String>,
  pub uigf_gacha_type: String
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UIGFGachaLog {
  pub info: UIGFGachaLogInfo,
  pub list: Vec<UIGFGachaLogEntry>
}
