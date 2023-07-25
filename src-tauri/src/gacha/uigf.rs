use crate::constants::{ID, VERSION};
use crate::error::{Error, Result};
use crate::gacha::GenshinGachaRecord;
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{Read, Write};
use time::format_description;
use time::OffsetDateTime;

// See: https://uigf.org/zh/standards/UIGF.html

const UIGF_VERSION: &str = "v2.2";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIGFInfo {
  pub uid: String,
  pub lang: String,
  pub export_time: Option<String>,
  pub export_timestamp: Option<i64>,
  pub export_app: Option<String>,
  pub export_app_version: Option<String>,
  pub uigf_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIGFListItem {
  pub id: String,
  pub uid: Option<String>,
  pub gacha_type: String,
  pub item_id: Option<String>,
  pub count: Option<String>,
  pub time: String,
  pub name: String,
  pub lang: Option<String>,
  pub item_type: String,
  pub rank_type: Option<String>,
  pub uigf_gacha_type: String,
}

pub type UIGFList = Vec<UIGFListItem>;

#[allow(clippy::upper_case_acronyms)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UIGF {
  pub info: UIGFInfo,
  pub list: UIGFList,
}

impl UIGF {
  const FORMAT_TIME: &str = "[year]-[month]-[day] [hour]:[minute]:[second]";
  pub fn new(uid: String, lang: String, time: &OffsetDateTime, list: UIGFList) -> Result<Self> {
    let format = format_description::parse(Self::FORMAT_TIME).map_err(time::Error::from)?;
    let export_time = time.format(&format).map_err(time::Error::from)?;
    let export_timestamp = time.unix_timestamp();
    Ok(Self {
      info: UIGFInfo {
        uid,
        lang,
        export_time: Some(export_time),
        export_timestamp: Some(export_timestamp),
        export_app: Some(ID.into()),
        export_app_version: Some(VERSION.into()),
        uigf_version: UIGF_VERSION.into(),
      },
      list,
    })
  }

  pub fn from_reader(reader: impl Read) -> Result<Self> {
    Ok(serde_json::from_reader(reader)?)
  }

  pub fn to_writer(&self, writer: impl Write, pretty: bool) -> Result<()> {
    if pretty {
      Ok(serde_json::to_writer_pretty(writer, self)?)
    } else {
      Ok(serde_json::to_writer(writer, self)?)
    }
  }
}

// Convert

lazy_static! {
  /*
   * Gacha Type (Official) | Gacha Type (UIGF)
   *       100             |       100
   *       200             |       200
   *       301             |       301
   *       400             |       301
   *       302             |       302
   */
  pub static ref GACHA_TYPE_UIGF_MAPPINGS: HashMap<String, String> = {
    let mut m = HashMap::with_capacity(5);
    m.insert(String::from("100"), String::from("100"));
    m.insert(String::from("200"), String::from("200"));
    m.insert(String::from("301"), String::from("301"));
    m.insert(String::from("400"), String::from("301")); // 400 -> 301
    m.insert(String::from("302"), String::from("302"));
    m
  };
}

// UIGF -> Official GenshinGachaRecord
impl TryFrom<&UIGFListItem> for GenshinGachaRecord {
  type Error = Error;

  fn try_from(value: &UIGFListItem) -> std::result::Result<Self, Self::Error> {
    let uid = value
      .uid
      .clone()
      .ok_or_else(|| Error::UIGFOrSRGFInvalidField("uid".to_owned()))?;
    let lang = value
      .lang
      .clone()
      .ok_or_else(|| Error::UIGFOrSRGFInvalidField("lang".to_owned()))?;
    let rank_type = value
      .rank_type
      .clone()
      .ok_or_else(|| Error::UIGFOrSRGFInvalidField("rank_type".to_owned()))?;

    Ok(Self {
      id: value.id.clone(),
      uid,
      gacha_type: value.gacha_type.clone(),
      item_id: value.item_id.clone().unwrap_or("".to_owned()),
      count: value.count.clone().unwrap_or("1".to_owned()),
      time: value.time.clone(),
      name: value.name.clone(),
      lang,
      item_type: value.item_type.clone(),
      rank_type,
    })
  }
}

// Official GenshinGachaRecord -> UIGF
impl TryFrom<&GenshinGachaRecord> for UIGFListItem {
  type Error = Error;

  fn try_from(value: &GenshinGachaRecord) -> std::result::Result<Self, Self::Error> {
    let uigf_gacha_type = GACHA_TYPE_UIGF_MAPPINGS
      .get(&value.gacha_type)
      .ok_or_else(|| Error::UIGFOrSRGFInvalidField(format!("gacha_type={}", value.gacha_type)))?;

    Ok(Self {
      id: value.id.clone(),
      uid: Some(value.uid.clone()),
      gacha_type: value.gacha_type.clone(),
      item_id: Some(value.item_id.clone()),
      count: Some(value.count.clone()),
      time: value.time.clone(),
      name: value.name.clone(),
      lang: Some(value.lang.clone()),
      item_type: value.item_type.clone(),
      rank_type: Some(value.rank_type.clone()),
      uigf_gacha_type: uigf_gacha_type.to_owned(),
    })
  }
}

pub fn convert_uigf_to_offical(uigf: &mut UIGF) -> Result<Vec<GenshinGachaRecord>> {
  let owned_uid = &uigf.info.uid;
  let owned_lang = &uigf.info.lang;

  let mut result: Vec<GenshinGachaRecord> = Vec::with_capacity(uigf.list.len());
  for item in uigf.list.iter_mut() {
    if item.uid.is_none() {
      item.uid.replace(owned_uid.clone());
    }
    if item.lang.is_none() {
      item.lang.replace(owned_lang.clone());
    }

    let record = GenshinGachaRecord::try_from(&*item)?;
    result.push(record);
  }

  Ok(result)
}

pub fn convert_offical_to_uigf(records: &[GenshinGachaRecord]) -> Result<UIGFList> {
  let mut result: UIGFList = Vec::with_capacity(records.len());
  for record in records.iter() {
    let item = UIGFListItem::try_from(record)?;
    result.push(item);
  }

  Ok(result)
}
