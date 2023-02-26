extern crate lazy_static;

use std::collections::HashMap;
use lazy_static::lazy_static;
use super::model::UIGFGachaLogItem;
use crate::genshin::official::model::{GachaType, GachaItemType, GachaLogItem};
use crate::utils::ResultExt;

lazy_static! {
  /*
   * Gacha Type (Official) | Gacha Type (UIGF)
   *       100             |       100
   *       200             |       200
   *       301             |       301
   *       400             |       301
   *       302             |       302
   */
  static ref GACHA_TYPE_UIGF_MAPPINGS: HashMap<u32, String> = {
    let mut m = HashMap::with_capacity(5);
    m.insert(GachaType::Newbie          as u32, String::from("100"));
    m.insert(GachaType::Permanent       as u32, String::from("200"));
    m.insert(GachaType::CharacterEvent  as u32, String::from("301"));
    m.insert(GachaType::CharacterEvent2 as u32, String::from("301"));
    m.insert(GachaType::WeaponEvent     as u32, String::from("302"));
    m
  };

  static ref GACHA_TYPE_MAPPINGS: HashMap<u32, &'static GachaType> = {
    let mut m = HashMap::with_capacity(5);
    m.insert(GachaType::Newbie          as u32, &GachaType::Newbie);
    m.insert(GachaType::Permanent       as u32, &GachaType::Permanent);
    m.insert(GachaType::CharacterEvent  as u32, &GachaType::CharacterEvent);
    m.insert(GachaType::WeaponEvent     as u32, &GachaType::WeaponEvent);
    m.insert(GachaType::CharacterEvent2 as u32, &GachaType::CharacterEvent2);
    m
  };

  static ref GACHA_ITEM_TYPE_MAPPINGS: HashMap<String, &'static GachaItemType> = {
    let mut m = HashMap::with_capacity(2);
    m.insert(GACHA_ITEM_TYPE_CHARACTER.into(), &GachaItemType::Character);
    m.insert(GACHA_ITEM_TYPE_WEAPON.into(),    &GachaItemType::Weapon);
    m
  };
}

const GACHA_ITEM_TYPE_CHARACTER: &str = "角色";
const GACHA_ITEM_TYPE_WEAPON   : &str = "武器";

// Official GachaLogItem -> UIGF GachaLogItem
fn official_into_uigf(value: &GachaLogItem) -> Result<UIGFGachaLogItem, String> {
  let gacha_type = value.gacha_type as u32;
  let uigf_gacha_type = GACHA_TYPE_UIGF_MAPPINGS
    .get(&gacha_type)
    .ok_or(format!("Invalid gacha type: {gacha_type}"))?;

  let item_type = if value.item_type as u32 == 0 {
    GACHA_ITEM_TYPE_CHARACTER
  } else {
    GACHA_ITEM_TYPE_WEAPON
  };

  Ok(UIGFGachaLogItem {
    count: Some(value.count.clone()),
    gacha_type: gacha_type.to_string(),
    id: value.id.clone(),
    item_id: Some(value.item_id.clone()),
    item_type: item_type.into(),
    lang: Some(value.lang.clone()),
    name: value.name.clone(),
    rank_type: Some(value.rank_type.clone()),
    time: Some(value.time.clone()),
    uid: Some(value.uid.clone()),
    uigf_gacha_type: uigf_gacha_type.into()
  })
}

// UIGF GachaLogItem -> Official GachaLogItem
fn uigf_into_official(value: &UIGFGachaLogItem) -> Result<GachaLogItem, String> {
  let gacha_type = value.gacha_type.parse::<u32>().map_err_to_string()?;
  let gacha_type = **GACHA_TYPE_MAPPINGS
    .get(&gacha_type)
    .ok_or(format!("Invalid gacha type: {gacha_type}"))?;

  let item_type = **GACHA_ITEM_TYPE_MAPPINGS
    .get(&value.item_type)
    .ok_or(format!("Invalid gacha item type: {}", value.item_type))?;

  Ok(GachaLogItem {
    uid: value.uid.clone().ok_or("Missing field: uid")?,
    gacha_type,
    item_id: value.item_id.clone().unwrap_or("".into()),
    count: value.count.clone().unwrap_or("1".into()),
    time: value.time.clone().ok_or("Missing field: time")?,
    name: value.name.clone(),
    lang: value.lang.clone().ok_or("Missing field: lang")?,
    item_type,
    rank_type: value.rank_type.clone().ok_or("Missing field: rank_type")?,
    id: value.id.clone()
  })
}

pub fn convert_to_uigf(official: &[GachaLogItem], sort: bool) -> Result<Vec<UIGFGachaLogItem>, String> {
  let mut result = official
    .iter()
    .map(official_into_uigf)
    .collect::<Result<Vec<UIGFGachaLogItem>, String>>()?;

  if sort {
    result.sort_by(|a, b| a.id.cmp(&b.id));
  }

  Ok(result)
}

pub fn convert_to_official(uigf: &[UIGFGachaLogItem], sort: bool) -> Result<Vec<GachaLogItem>, String> {
  let mut result = uigf
    .iter()
    .map(uigf_into_official)
    .collect::<Result<Vec<GachaLogItem>, String>>()?;

  if sort {
    result.sort_by(|a, b| a.id.cmp(&b.id));
  }

  Ok(result)
}
