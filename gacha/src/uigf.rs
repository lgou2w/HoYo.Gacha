extern crate chrono;
extern crate lazy_static;
extern crate serde;
extern crate serde_json;

use std::collections::HashMap;
use std::io::{Read, Write};
use chrono::{DateTime, Local};
use lazy_static::lazy_static;
use serde::{Serialize, Deserialize};
use crate::log::GachaLogEntry;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UIGFGachaLogInfo {
  pub uid: String,
  pub lang: String,
  pub export_time: String,
  pub export_timestamp: i64,
  pub export_app: String,
  pub export_app_version: String,
  pub uigf_version: String
}

#[derive(Serialize, Deserialize, Debug, Clone)]
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

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UIGFGachaLog {
  pub info: UIGFGachaLogInfo,
  pub list: Vec<UIGFGachaLogEntry>
}

impl UIGFGachaLog {
  pub fn from_reader(reader: impl Read) -> Result<Self, serde_json::Error> {
    serde_json::from_reader(reader)
  }

  pub fn to_writer(&self, writer: impl Write, pretty: bool) -> Result<(), serde_json::Error> {
    if pretty {
      serde_json::to_writer_pretty(writer, self)
    } else {
      serde_json::to_writer(writer, self)
    }
  }
}

/* UIGF : https://www.snapgenshin.com/development/UIGF.html */

const UIGF_VERSION: &'static str = "2.2";

lazy_static! {
  /*
   * Gacha Type (Official) | Gacha Type (UIGF)
   *       100             |       100
   *       200             |       200
   *       301             |       301
   *       400             |       301
   *       302             |       302
   */
  static ref GACHA_TYPE_UIGF_MAPPINGS: HashMap<String, String> = {
    let mut map = HashMap::new();
    map.insert(String::from("100"), String::from("100"));
    map.insert(String::from("200"), String::from("200"));
    map.insert(String::from("301"), String::from("301"));
    map.insert(String::from("400"), String::from("301"));
    map.insert(String::from("302"), String::from("302"));
    map
  };
}

pub fn convect_gacha_logs_to_uigf(
  export_app: &str,
  export_app_version: &str,
  export_time: Option<DateTime<Local>>,
  gacha_logs: &Vec<GachaLogEntry>,
  include_log_entry_uid: bool
) -> UIGFGachaLog {
  let uigf_gacha_log_entries: Vec<UIGFGachaLogEntry> = gacha_logs
    .iter()
    .map(|entry| {
      UIGFGachaLogEntry {
        count: Some(entry.count.clone()),
        gacha_type: entry.gacha_type.clone(),
        id: entry.id.clone(),
        item_id: Some(entry.item_id.clone()),
        item_type: entry.item_type.clone(),
        lang: Some(entry.lang.clone()),
        name: entry.name.clone(),
        rank_type: Some(entry.rank_type.clone()),
        time: Some(entry.time.clone()),
        uid: if include_log_entry_uid { Some(entry.uid.clone()) } else { None },
        uigf_gacha_type: GACHA_TYPE_UIGF_MAPPINGS
          .get(&entry.gacha_type)
          .expect("Invalid gacha type")
          .clone()
      }
    })
    .collect();

  let first_entry = uigf_gacha_log_entries.first().expect("Empty gacha logs");
  let time = export_time.unwrap_or(Local::now());

  UIGFGachaLog {
    info: UIGFGachaLogInfo {
      uid: first_entry.uid.clone().unwrap(),
      lang: first_entry.lang.clone().unwrap(),
      export_time: time.format("%Y-%m-%d %H:%M:%S").to_string(),
      export_timestamp: time.timestamp(),
      export_app: String::from(export_app),
      export_app_version: String::from(export_app_version),
      uigf_version: String::from(UIGF_VERSION)
    },
    list: uigf_gacha_log_entries
  }
}
