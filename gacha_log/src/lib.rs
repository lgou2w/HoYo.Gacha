pub mod uigf;

extern crate chrono;
extern crate form_urlencoded;
extern crate lazy_static;
extern crate reqwest;
extern crate serde;
extern crate serde_json;

use std::collections::HashMap;
use chrono::Local;
use lazy_static::lazy_static;
use reqwest::{Client, Url};
use serde::{Serialize, Deserialize};
use tokio::time::{sleep, Duration};
use crate::uigf::{UIGFGachaLog, UIGFGachaLogInfo, UIGFGachaLogEntry};

#[derive(Serialize, Deserialize, Debug)]
pub struct GachaLogEntry {
  pub uid: String,
  pub gacha_type: String,
  pub item_id: String,
  pub count: String,
  pub time: String,
  pub name: String,
  pub lang: String,
  pub item_type: String,
  pub rank_type: String,
  pub id: String
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GachaLogData {
  pub page: String,
  pub size: String,
  pub total: String,
  pub list: Vec<GachaLogEntry>,
  pub region: String,
}


#[derive(Serialize, Deserialize, Debug)]
pub struct GachaLog {
  pub retcode: i32,
  pub message: String,
  pub data: Option<GachaLogData>
}

async fn fetch_gacha_log(client: &Client, url: &Url, gacha_type: &str, end_id: String) -> GachaLog {
  client
    .get(url.as_str())
    .query(&[
      ("gacha_type", gacha_type.to_string()),
      ("page", String::from("1")),
      ("size", String::from("20")),
      ("end_id", end_id)
    ])
    .send()
    .await.unwrap()
    .json::<GachaLog>()
    .await.unwrap()
  // TODO: unwrap error
}

const ENDPOINT: &'static str = "/event/gacha_info/api/getGachaLog?";
const ENDPOINT_LENGTH: usize = ENDPOINT.len();

pub async fn fetch_gacha_logs(gacha_url: &str, gacha_type: &str) -> Vec<GachaLogEntry> {
  let endpoint_start = gacha_url.find(ENDPOINT).expect("Invalid gacha url");
  let base_url = &gacha_url[0..endpoint_start + ENDPOINT_LENGTH];
  let query_str = &gacha_url[endpoint_start + ENDPOINT_LENGTH..];

  let mut queries: HashMap<String, String> = form_urlencoded::parse(query_str.as_bytes()).into_owned().collect();
  queries.remove("gacha_type");
  queries.remove("page");
  queries.remove("size");
  queries.remove("end_id");

  let url = Url::parse_with_params(base_url, queries).unwrap();
  let client = reqwest::Client::new();

  let mut end_id = String::from("0");
  let mut gacha_logs: Vec<GachaLogEntry> = Vec::new();
  let mut count: u32 = 0;

  loop {
    if count > 0 && count % 5 == 0 {
      // Avoid visit too frequently
      sleep(Duration::from_secs(3)).await;
    }

    let gacha_log = fetch_gacha_log(&client, &url, gacha_type, end_id).await;
    count = count + 1;

    if let Some(data) = gacha_log.data {
      if !data.list.is_empty() {
        // Get the last end id
        end_id = data.list.last().unwrap().id.clone();
        gacha_logs.extend(data.list);

        // Same as above
        sleep(Duration::from_secs(1)).await;

        // Continue to request the next end id
        continue;
      }
    }

    // Otherwise the data is none or the data list is empty
    break;
  }

  gacha_logs
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

pub fn convert_to_uigf(
  export_app: &str,
  export_app_version: &str,
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
  let now = Local::now();

  UIGFGachaLog {
    info: UIGFGachaLogInfo {
      uid: first_entry.uid.clone().unwrap(),
      lang: first_entry.lang.clone().unwrap(),
      export_time: now.format("%Y-%m-%d %H:%M:%S").to_string(),
      export_timestamp: now.timestamp(),
      export_app: String::from(export_app),
      export_app_version: String::from(export_app_version),
      uigf_version: String::from(UIGF_VERSION)
    },
    list: uigf_gacha_log_entries
  }
}
