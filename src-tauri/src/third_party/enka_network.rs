extern crate reqwest;
extern crate serde;
extern crate serde_json;
extern crate tokio;

use std::error::Error;
use reqwest::Client;
use reqwest::header::{HeaderMap, HeaderValue};
use serde::{Serialize, Deserialize};
use serde_json::Value as JsonValue;

/* https://github.com/EnkaNetwork/API-docs/blob/master/api_chs.md */

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlayerInfo {
  pub nickname: String,
  pub level: u8,
  pub signature: Option<String>,
  pub world_level: Option<u8>,
  pub name_card_id: u32,
  pub finish_achievement_num: u32,
  pub tower_floor_index: Option<u8>,
  pub tower_level_index: Option<u8>,
  pub show_avatar_info_list: Option<Vec<ShowAvatarInfo>>,
  pub show_name_card_id_list: Option<Vec<u32>>,
  pub profile_picture: ProfilePicture
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShowAvatarInfo {
  pub avatar_id: u32,
  pub level: u8
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProfilePicture {
  pub avatar_id: u32
}

pub async fn fetch_player_info(uid: u32) -> Result<PlayerInfo, Box<dyn Error>> {
  let mut headers = HeaderMap::new();
  headers.insert("Accept", HeaderValue::from_static("application/json"));
  headers.insert("User-Agent", HeaderValue::from_str(
    &format!(
      "{} v{} by {}",
      env!("CARGO_PKG_NAME"),
      env!("CARGO_PKG_VERSION"),
      env!("CARGO_PKG_AUTHORS")
    )
  ).unwrap());

  let response = Client::builder()
    .default_headers(headers)
    .build()?
    .get(format!("https://enka.network/api/uid/{uid}?info"))
    .send()
    .await?;

  let status = response.status();
  if !status.is_success() {
    let body = response.json::<JsonValue>().await?;
    Err(body["message"].as_str().unwrap_or(status.as_str()).into())
  } else {
    let body = response.json::<JsonValue>().await?;
    let player_info = PlayerInfo::deserialize(&body["playerInfo"])?;
    Ok(player_info)
  }
}
