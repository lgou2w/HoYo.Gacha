extern crate chrono;
extern crate lazy_static;
extern crate serde;
extern crate serde_json;

use std::io::{Read, Write};
use chrono::{DateTime, Local};
use serde::{Serialize, Deserialize};

/* UIGF : https://uigf.org/standards/UIGF.html */

pub const UIGF_VERSION: &str = "v2.2";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIGFGachaLogInfo {
  pub uid: String,
  pub lang: String,
  pub export_time: String,
  pub export_timestamp: Option<i64>,
  pub export_app: String,
  pub export_app_version: String,
  pub uigf_version: String
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIGFGachaLogItem {
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIGFGachaLog {
  pub info: UIGFGachaLogInfo,
  pub list: Vec<UIGFGachaLogItem>
}

impl UIGFGachaLog {
  pub fn new(uid: u32, lang: &str, time: &DateTime<Local>, list: &[UIGFGachaLogItem]) -> Self {
    let export_time = time.format("%Y-%m%d %H:%M:%S").to_string();
    let export_timestamp = Some(time.timestamp());
    Self {
      info: UIGFGachaLogInfo {
        uid: uid.to_string(),
        lang: lang.to_owned(),
        export_time,
        export_timestamp,
        export_app: env!("CARGO_PKG_NAME").into(),
        export_app_version: env!("CARGO_PKG_VERSION").into(),
        uigf_version: UIGF_VERSION.into()
      },
      list: list.to_vec()
    }
  }

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
