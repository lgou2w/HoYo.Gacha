extern crate serde;
extern crate serde_json;

use serde::{Serialize, Deserialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, PartialOrd, Eq, Ord)]
pub enum GachaType {
  #[serde(rename = "100")]
  Newbie = 100,
  #[serde(rename = "200")]
  Permanent = 200,
  #[serde(rename = "301")]
  CharacterEvent = 301,
  #[serde(rename = "302")]
  WeaponEvent = 302,
  #[serde(rename = "400")]
  CharacterEvent2 = 400
}

pub const GACHA_ITEM_TYPE_CHARACTER: &str = "角色";
pub const GACHA_ITEM_TYPE_WEAPON   : &str = "武器";

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, PartialOrd)]
pub enum GachaItemType {
  #[serde(rename = "角色")]
  Character = 0,
  #[serde(rename = "武器")]
  Weapon = 1
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all(serialize = "camelCase"))]
pub struct GachaLogItem {
  pub uid: String,
  pub gacha_type: GachaType,
  pub item_id: String,
  pub count: String,
  pub time: String,
  pub name: String,
  pub lang: String,
  pub item_type: GachaItemType,
  pub rank_type: String,
  pub id: String
}

#[derive(Debug, Clone, Deserialize)]
pub struct GachaLogPagination {
  pub page: String,
  pub size: String,
  pub total: String,
  pub list: Vec<GachaLogItem>,
  pub region: String
}

#[derive(Debug, Clone, Deserialize)]
pub struct Response<T> {
  pub retcode: i32,
  pub message: String,
  pub data: T
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_deserialize_gacha_type() {
    assert_eq!(serde_json::from_str::<GachaType>("\"100\"").unwrap(), GachaType::Newbie);
    assert_eq!(serde_json::from_str::<GachaType>("\"200\"").unwrap(), GachaType::Permanent);
    assert_eq!(serde_json::from_str::<GachaType>("\"301\"").unwrap(), GachaType::CharacterEvent);
    assert_eq!(serde_json::from_str::<GachaType>("\"302\"").unwrap(), GachaType::WeaponEvent);
    assert_eq!(serde_json::from_str::<GachaType>("\"400\"").unwrap(), GachaType::CharacterEvent2);
    assert!(serde_json::from_str::<GachaType>("\"unknown\"").is_err());
    assert!(serde_json::from_str::<GachaType>("1").is_err());
  }

  #[test]
  fn test_deserialize_gacha_item_type() {
    assert_eq!(serde_json::from_str::<GachaItemType>("\"角色\"").unwrap(), GachaItemType::Character);
    assert_eq!(serde_json::from_str::<GachaItemType>("\"武器\"").unwrap(), GachaItemType::Weapon);
    assert!(serde_json::from_str::<GachaItemType>("1").is_err());
  }

  #[test]
  fn test_deserialize_gacha_log_item() {
    let json = mock_json()["data"]["list"].clone();
    let item: GachaLogItem = serde_json::from_value(json[0].clone()).unwrap();
    assert_eq!(item.uid, "100000001");
    assert_eq!(item.gacha_type, GachaType::CharacterEvent2);
    assert_eq!(item.item_id, "");
    assert_eq!(item.count, "1");
    assert_eq!(item.time, "2023-02-10 14:48:17");
    assert_eq!(&item.name, "西风剑");
    assert_eq!(&item.lang, "zh-cn");
    assert_eq!(item.item_type, GachaItemType::Weapon);
    assert_eq!(item.rank_type, "4");
    assert_eq!(item.id, "1676009160003916372");
    let item2: GachaLogItem = serde_json::from_value(json[1].clone()).unwrap();
    assert_eq!(item2.uid, "100000001");
    assert_eq!(item2.gacha_type, GachaType::CharacterEvent2);
    assert_eq!(item2.item_id, "");
    assert_eq!(item2.count, "1");
    assert_eq!(item2.time, "2023-02-10 10:10:35");
    assert_eq!(&item2.name, "芭芭拉");
    assert_eq!(&item2.lang, "zh-cn");
    assert_eq!(item2.item_type, GachaItemType::Character);
    assert_eq!(item2.rank_type, "4");
    assert_eq!(item2.id, "1675994760000594772");
  }

  #[test]
  fn test_deserialize_gacha_log_pagination() {
    let json = mock_json()["data"].clone();
    let pagination: GachaLogPagination = serde_json::from_value(json).unwrap();
    assert_eq!(pagination.page, "1");
    assert_eq!(pagination.size, "5");
    assert_eq!(pagination.total, "0");
    assert_eq!(pagination.list.len(), 2);
    assert_eq!(&pagination.region, "cn_gf01");
  }

  #[test]
  fn test_deserialize_gacha_response() {
    let json = mock_json();
    let response: Response<GachaLogPagination> = serde_json::from_value(json).unwrap();
    assert_eq!(response.retcode, 0);
    assert_eq!(response.message, "OK");
  }

  fn mock_json() -> serde_json::Value {
    serde_json::json!({
      "retcode": 0,
      "message": "OK",
      "data": {
        "page": "1",
        "size": "5",
        "total": "0",
        "list": [
          {
            "uid": "100000001",
            "gacha_type": "400",
            "item_id": "",
            "count": "1",
            "time": "2023-02-10 14:48:17",
            "name": "西风剑",
            "lang": "zh-cn",
            "item_type": "武器",
            "rank_type": "4",
            "id": "1676009160003916372"
          },
          {
            "uid": "100000001",
            "gacha_type": "400",
            "item_id": "",
            "count": "1",
            "time": "2023-02-10 10:10:35",
            "name": "芭芭拉",
            "lang": "zh-cn",
            "item_type": "角色",
            "rank_type": "4",
            "id": "1675994760000594772"
          }
        ],
        "region": "cn_gf01"
      }
    })
  }
}
