extern crate chrono;
extern crate form_urlencoded;
extern crate reqwest;
extern crate serde;
extern crate serde_json;

use std::collections::HashMap;
use reqwest::{Client, Url};
use serde::{Serialize, Deserialize};
use tokio::time::{sleep, Duration};

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

async fn fetch_gacha_log(client: &Client, url: &Url, gacha_type: &str, end_id: &str) -> GachaLog {
  client
    .get(url.as_str())
    .query(&[
      ("gacha_type", gacha_type.to_string()),
      ("page", String::from("1")),
      ("size", String::from("20")),
      ("end_id", end_id.to_string())
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

    let gacha_log = fetch_gacha_log(&client, &url, gacha_type, &end_id).await;
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
