extern crate sea_orm;

use sea_orm::ActiveValue;
use sea_orm::entity::prelude::*;
use crate::gacha::StarRailGachaRecord;

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "starrail_gacha_records")]
pub struct Model {
  #[sea_orm(primary_key, auto_increment = false)]
  pub id: String,
  #[sea_orm(indexed)]
  pub uid: String,
  #[sea_orm(indexed)]
  pub gacha_id: String,
  #[sea_orm(indexed)]
  pub gacha_type: String,
  #[sea_orm(indexed)]
  pub item_id: String,
  pub count: String,
  pub time: String,
  pub name: String,
  pub lang: String,
  pub item_type: String,
  pub rank_type: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

/// Convert

impl From<StarRailGachaRecord> for ActiveModel {
  fn from(value: StarRailGachaRecord) -> Self {
    Self {
      id: ActiveValue::set(value.id),
      uid: ActiveValue::set(value.uid),
      gacha_id: ActiveValue::set(value.gacha_id),
      gacha_type: ActiveValue::set(value.gacha_type),
      item_id: ActiveValue::set(value.item_id),
      count: ActiveValue::set(value.count),
      time: ActiveValue::set(value.time),
      name: ActiveValue::set(value.name),
      lang: ActiveValue::set(value.lang),
      item_type: ActiveValue::set(value.item_type),
      rank_type: ActiveValue::set(value.rank_type)
    }
  }
}

impl From<Model> for StarRailGachaRecord {
  fn from(value: Model) -> Self {
    Self {
      id: value.id,
      uid: value.uid,
      gacha_id: value.gacha_id,
      gacha_type: value.gacha_type,
      item_id: value.item_id,
      count: value.count,
      time: value.time,
      name: value.name,
      lang: value.lang,
      item_type: value.item_type,
      rank_type: value.rank_type
    }
  }
}
