use crate::constants::{ID, VERSION};
use crate::error::{Error, Result};
use crate::gacha::StarRailGachaRecord;
use serde::{Deserialize, Serialize};
use std::io::{Read, Write};
use time::OffsetDateTime;

// See: https://uigf.org/zh/standards/srgf.html

const SRGF_VERSION: &str = "v1.0";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SRGFInfo {
  pub uid: String,
  pub lang: String,
  pub region_time_zone: u8,
  pub export_timestamp: Option<i64>,
  pub export_app: Option<String>,
  pub export_app_version: Option<String>,
  pub srgf_version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SRGFListItem {
  pub id: String,
  pub gacha_id: String,
  pub gacha_type: String,
  pub item_id: String,
  pub count: Option<String>,
  pub time: String,
  pub name: String,
  pub item_type: String,
  pub rank_type: Option<String>,
}

pub type SRGFList = Vec<SRGFListItem>;

#[allow(clippy::upper_case_acronyms)]
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SRGF {
  pub info: SRGFInfo,
  pub list: SRGFList,
}

impl SRGF {
  pub fn new(
    uid: String,
    lang: String,
    time_zone: u8,
    time: &OffsetDateTime,
    list: SRGFList,
  ) -> Result<Self> {
    let export_timestamp = time.unix_timestamp();
    Ok(Self {
      info: SRGFInfo {
        uid,
        lang,
        region_time_zone: time_zone,
        export_timestamp: Some(export_timestamp),
        export_app: Some(ID.into()),
        export_app_version: Some(VERSION.into()),
        srgf_version: SRGF_VERSION.into(),
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

// SRGF -> Official StarRailGachaRecord
impl StarRailGachaRecord {
  fn try_from(value: &SRGFListItem, uid: &str, lang: &str) -> Result<Self> {
    let rank_type = value
      .rank_type
      .clone()
      .ok_or_else(|| Error::UIGFOrSRGFInvalidField("rank_type".to_owned()))?;

    Ok(Self {
      id: value.id.clone(),
      uid: uid.to_owned(),
      gacha_id: value.gacha_id.clone(),
      gacha_type: value.gacha_type.clone(),
      item_id: value.item_id.clone(),
      count: value.count.clone().unwrap_or("1".to_owned()),
      time: value.time.clone(),
      name: value.name.clone(),
      lang: lang.to_owned(),
      item_type: value.item_type.clone(),
      rank_type,
    })
  }
}

// Official GenshinGachaRecord -> SRGF
impl TryFrom<&StarRailGachaRecord> for SRGFListItem {
  type Error = Error;

  fn try_from(value: &StarRailGachaRecord) -> std::result::Result<Self, Self::Error> {
    Ok(Self {
      id: value.id.clone(),
      gacha_id: value.gacha_id.clone(),
      gacha_type: value.gacha_type.clone(),
      item_id: value.item_id.clone(),
      count: Some(value.count.clone()),
      time: value.time.clone(),
      name: value.name.clone(),
      item_type: value.item_type.clone(),
      rank_type: Some(value.rank_type.clone()),
    })
  }
}

pub fn convert_srgf_to_offical(srgf: &mut SRGF) -> Result<Vec<StarRailGachaRecord>> {
  let owned_uid = &srgf.info.uid;
  let owned_lang = &srgf.info.lang;

  let mut result: Vec<StarRailGachaRecord> = Vec::with_capacity(srgf.list.len());
  for item in &mut srgf.list {
    let record = StarRailGachaRecord::try_from(&*item, owned_uid, owned_lang)?;
    result.push(record);
  }

  Ok(result)
}

pub fn convert_offical_to_srgf(records: &[StarRailGachaRecord]) -> Result<SRGFList> {
  let mut result: SRGFList = Vec::with_capacity(records.len());
  for record in records {
    let item = SRGFListItem::try_from(record)?;
    result.push(item);
  }

  Ok(result)
}
