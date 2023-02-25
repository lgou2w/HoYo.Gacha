extern crate futures_core;
extern crate lazy_static;
extern crate sqlx;

use std::collections::HashMap;
use std::error::Error;
use futures_core::future::BoxFuture;
use lazy_static::lazy_static;
use sqlx::{query, Row};
use sqlx::sqlite::SqliteRow;
use super::CoreManage;
use crate::genshin::official::model::{GachaType, GachaItemType, GachaLogItem};

pub trait GachaManageExt {
  fn initial_gacha(&self) -> BoxFuture<Result<(), Box<dyn Error>>>;

  fn save_gacha_logs<'a>(&'a self,
    items: &'a [GachaLogItem]
  ) -> BoxFuture<'a, Result<(), Box<dyn Error + Send + Sync>>>;

  fn find_gacha_logs<'a>(&'a self,
    uid: u32,
    gacha_type: Option<&'a GachaType>
  ) -> BoxFuture<'a, Result<Vec<GachaLogItem>, Box<dyn Error + Send + Sync>>>;
}

impl GachaManageExt for CoreManage {
  fn initial_gacha(&self) -> BoxFuture<Result<(), Box<dyn Error>>> {
    Box::pin(async move {
      let database = &*self.database.lock().await;
      query(SQL_INITIAL)
        .execute(database)
        .await?;
      Ok(())
    })
  }

  fn save_gacha_logs<'a>(&'a self,
    items: &'a [GachaLogItem]
  ) -> BoxFuture<'a, Result<(), Box<dyn Error + Send + Sync>>> {
    Box::pin(async move {
      let database = &*self.database.lock().await;
      let mut tx = database.begin().await?;
      for item in items {
        let uid = item.uid.parse::<u32>()?;
        query(SQL_SAVE_GACHA_LOGS)
          .bind(uid)
          .bind(item.gacha_type as u32)
          .bind(&item.item_id)
          .bind(&item.count)
          .bind(&item.time)
          .bind(&item.name)
          .bind(&item.lang)
          .bind(item.item_type as u32)
          .bind(&item.rank_type)
          .bind(&item.id)
          .execute(&mut tx)
          .await?;
      }
      tx.commit().await?;
      Ok(())
    })
  }

  fn find_gacha_logs<'a>(&'a self,
    uid: u32,
    gacha_type: Option<&'a GachaType>
  ) -> BoxFuture<'a, Result<Vec<GachaLogItem>, Box<dyn Error + Send + Sync>>> {
    Box::pin(async move {
      let database = &*self.database.lock().await;
      let result = if let Some(gacha_type) = gacha_type {
        query(SQL_FIND_GACHA_LOGS_BY_UID_AND_GACHA_TYPE)
          .bind(uid)
          .bind(*gacha_type as u32)
          .fetch_all(database)
          .await?
      } else {
        query(SQL_FIND_GACHA_LOGS_BY_UID)
          .bind(uid)
          .fetch_all(database)
          .await?
      }
        .iter()
        .map(From::from)
        .collect();

      Ok(result)
    })
  }
}

lazy_static! {
  static ref GACHA_TYPE_MAPPINGS: HashMap<u32, &'static GachaType> = {
    let mut m = HashMap::with_capacity(5);
    m.insert(GachaType::Newbie          as u32, &GachaType::Newbie);
    m.insert(GachaType::Permanent       as u32, &GachaType::Permanent);
    m.insert(GachaType::CharacterEvent  as u32, &GachaType::CharacterEvent);
    m.insert(GachaType::WeaponEvent     as u32, &GachaType::WeaponEvent);
    m.insert(GachaType::CharacterEvent2 as u32, &GachaType::CharacterEvent2);
    m
  };

  static ref GACHA_ITEM_TYPE_MAPPINGS: HashMap<u32, &'static GachaItemType> = {
    let mut m = HashMap::with_capacity(2);
    m.insert(GachaItemType::Character as u32, &GachaItemType::Character);
    m.insert(GachaItemType::Weapon    as u32, &GachaItemType::Weapon);
    m
  };
}

impl From<&SqliteRow> for GachaLogItem {
  fn from(value: &SqliteRow) -> Self {
    let gacha_type: u32 = value.get("gacha_type");
    let gacha_type = **GACHA_TYPE_MAPPINGS.get(&gacha_type).unwrap();
    let item_type: u32 = value.get("item_type");
    let item_type = **GACHA_ITEM_TYPE_MAPPINGS.get(&item_type).unwrap();
    Self {
      uid: value.get::<u32, &str>("uid").to_string(),
      gacha_type,
      item_id: value.get("item_id"),
      count: value.get("count"),
      time: value.get("time"),
      name: value.get("name"),
      lang: value.get("lang"),
      item_type,
      rank_type: value.get("rank_type"),
      id: value.get("id")
    }
  }
}

const SQL_INITIAL: &str = r#"
CREATE TABLE IF NOT EXISTS `gacha_logs` (
  `uid`         INT   NOT NULL,
  `gacha_type`  INT   NOT NULL,
  `item_id`     TEXT  NOT NULL,
  `count`       TEXT  NOT NULL,
  `time`        TEXT  NOT NULL,
  `name`        TEXT  NOT NULL,
  `lang`        TEXT  NOT NULL,
  `item_type`   INT   NOT NULL,
  `rank_type`   TEXT  NOT NULL,
  `id`          TEXT  NOT NULL
);
CREATE INDEX IF NOT EXISTS `uid_index`            ON `gacha_logs` (`uid` ASC);
CREATE INDEX IF NOT EXISTS `gacha_type_index`     ON `gacha_logs` (`gacha_type` ASC);
CREATE INDEX IF NOT EXISTS `uid_gacha_type_index` ON `gacha_logs` (`uid`, `gacha_type` ASC);
CREATE INDEX IF NOT EXISTS `item_type_index`      ON `gacha_logs` (`item_type` ASC);
CREATE UNIQUE INDEX IF NOT EXISTS `id_index`      ON `gacha_logs` (`id` ASC);
"#;

const SQL_SAVE_GACHA_LOGS: &str
  = "INSERT OR IGNORE INTO `gacha_logs` (
      `uid`, `gacha_type`, `item_id`, `count`, `time`,
      `name`, `lang`, `item_type`, `rank_type`, `id`
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

const SQL_FIND_GACHA_LOGS_BY_UID: &str
  = "SELECT * FROM `gacha_logs` WHERE `uid` = ? ORDER BY `id` ASC;";

const SQL_FIND_GACHA_LOGS_BY_UID_AND_GACHA_TYPE: &str
  = "SELECT * FROM `gacha_logs` WHERE `uid` = ? AND `gacha_type` = ? ORDER BY `id` ASC;";
