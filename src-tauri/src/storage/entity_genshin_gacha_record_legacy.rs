extern crate sea_orm;

use sea_orm::entity::prelude::*;

/// v0.2.x Legacy Genshin Gacha Record
/// See: https://github.com/lgou2w/genshin-gacha/blob/v0.2.x/src-tauri/src/core/manage_gacha.rs

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "gacha_logs")]
pub struct Model {
  #[sea_orm(primary_key, auto_increment = false)]
  pub id: String,
  #[sea_orm(indexed)]
  pub uid: u32,
  #[sea_orm(indexed)]
  pub gacha_type: u32,
  pub item_id: String,
  pub count: String,
  pub time: String,
  pub name: String,
  pub lang: String,
  pub item_type: u32,
  pub rank_type: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
}

impl ActiveModelBehavior for ActiveModel {}
