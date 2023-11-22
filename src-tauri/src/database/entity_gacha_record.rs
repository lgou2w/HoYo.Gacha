use async_trait::async_trait;
use num_enum::{IntoPrimitive, TryFromPrimitive};
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use sqlx::database::HasArguments;
use sqlx::encode::IsNull;
use sqlx::error::BoxDynError;
use sqlx::sqlite::{SqliteTypeInfo, SqliteValueRef};
use sqlx::{Decode, Encode, Sqlite, Type};

use super::{AccountFacet, Database, DatabaseError};
use crate::generate_entity;

// Gacha Rank Type

#[derive(
  Clone,
  Debug,
  Deserialize_repr,
  Serialize_repr,
  IntoPrimitive,
  TryFromPrimitive,
  PartialEq,
  Eq,
  PartialOrd,
  Ord,
)]
#[repr(u8)]
pub enum GachaRecordRankType {
  Blue = 3,
  Purple = 4,
  Golden = 5,
}

impl Type<Sqlite> for GachaRecordRankType {
  fn type_info() -> SqliteTypeInfo {
    u8::type_info()
  }
}

impl<'r> Encode<'r, Sqlite> for GachaRecordRankType {
  fn encode_by_ref(&self, buf: &mut <Sqlite as HasArguments<'r>>::ArgumentBuffer) -> IsNull {
    u8::from(self.clone()).encode_by_ref(buf)
  }
}

impl<'r> Decode<'r, Sqlite> for GachaRecordRankType {
  fn decode(value: SqliteValueRef) -> Result<Self, BoxDynError> {
    GachaRecordRankType::try_from(u8::decode(value)?).map_err(Into::into)
  }
}

// Entity

// GachaRecord:
//   Genshin Impact: ON "facet" = 0
//   {
//     "id"         : "1675850760000000000",
//     "uid"        : "100000001",
//     "gacha_type" : "400",
//     "gacha_id"   : "",
//     "rank_type"  : "3",
//     "count"      : "1",
//     "time"       : "2023-01-01 00:00:00",
//     "lang"       : "zh-cn",
//     "name"       : "弹弓",
//     "item_type"  : "武器",
//     "item_id"    : ""
//   }
//   Honkai: Star Rail: ON "facet" = 1
//   {
//     "id"         : "1683774600000000000",
//     "uid"        : "100000001",
//     "gacha_type" : "1",
//     "gacha_id"   : "1001",
//     "rank_type"  : "3",
//     "count"      : "1",
//     "time"       : "2023-01-01 00:00:00",
//     "lang"       : "zh-cn",
//     "name"       : "灵钥",
//     "item_type"  : "光锥",
//     "item_id"    : "20013"
//   }

generate_entity!({
  #[derive(Clone, Debug, Deserialize, Serialize)]
  #[serde(rename_all = "camelCase")]
  pub struct GachaRecord {              // Genshin Impact          | Honkai: Star Rail
    // HACK: SQLite cannot store u64,
    //   and Id can only use String.
    pub id: String,                     // 1675850760000000000     | <-
    pub facet: AccountFacet,            //                       0 | 1
    pub uid: u32,                       // 100000001               | <-
    pub gacha_type: u32,                // 100, 200, 301, 400, 302 | 1, 2, 11, 12
    pub gacha_id: Option<u32>,          //                    None | Some(_)
    pub rank_type: GachaRecordRankType, // 3, 4, 5                 | <-
    pub count: u32,                     // 1                       | <-
    pub time: String,                   // 2023-01-01 00:00:00     | // TODO: Internationalization (GachaRecord.time)
    pub lang: String,                   // zh-cn                   | // TODO: Internationalization (GachaRecord.lang)
    pub name: String,                   //                         | // TODO: Internationalization (GachaRecord.name)
    pub item_type: String,              //                         | // TODO: Internationalization (GachaRecord.item_type)
    pub item_id: Option<String>,        //                    None | Some(_)
  },
  questioner {
    initialize => "
      CREATE TABLE IF NOT EXISTS `hg.gacha_records` (
        `id`         TEXT    NOT NULL,
        `facet`      INTEGER NOT NULL,
        `uid`        INTEGER NOT NULL,
        `gacha_type` INTEGER NOT NULL,
        `gacha_id`   INTEGER,
        `rank_type`  INTEGER NOT NULL,
        `count`      INTEGER NOT NULL,
        `time`       TEXT    NOT NULL,
        `lang`       TEXT    NOT NULL,
        `name`       TEXT    NOT NULL,
        `item_type`  TEXT    NOT NULL,
        `item_id`    TEXT
      );
      CREATE UNIQUE INDEX IF NOT EXISTS `hg.gacha_records.id_idx`                    ON `hg.gacha_records` (`id`);
      CREATE        INDEX IF NOT EXISTS `hg.gacha_records.facet_idx`                 ON `hg.gacha_records` (`facet`);
      CREATE        INDEX IF NOT EXISTS `hg.gacha_records.uid_idx`                   ON `hg.gacha_records` (`uid`);
      CREATE        INDEX IF NOT EXISTS `hg.gacha_records.facet_uid_idx`             ON `hg.gacha_records` (`facet`, `uid`);
      CREATE        INDEX IF NOT EXISTS `hg.gacha_records.gacha_type_idx`            ON `hg.gacha_records` (`gacha_type`);
      CREATE        INDEX IF NOT EXISTS `hg.gacha_records.rank_type_idx`             ON `hg.gacha_records` (`rank_type`);
      CREATE        INDEX IF NOT EXISTS `hg.gacha_records.facet_uid_gacha_type_idx`  ON `hg.gacha_records` (`facet`, `uid`, `gacha_type`);
    ",
  }
});

impl GachaRecordQuestioner {
  pub fn find_many_by_facet_and_uid(
    &self,
    facet: AccountFacet,
    uid: u32,
    gacha_type: Option<u32>,
  ) -> QueryAs<<Self as Questioner>::Entity> {
    if let Some(gacha_type) = gacha_type {
      query_as(
        "SELECT * FROM `hg.gacha_records` WHERE `facet` = ? AND `uid` = ? AND `gacha_type` = ?;",
      )
      .bind(facet)
      .bind(uid)
      .bind(gacha_type)
    } else {
      query_as("SELECT * FROM `hg.gacha_records` WHERE `facet` = ? AND `uid` = ?;")
        .bind(facet)
        .bind(uid)
    }
  }
}

// Database additions

#[async_trait]
pub trait DatabaseGachaRecordAdditions {
  async fn save_gacha_records(&self, records: Vec<GachaRecord>) -> Result<u64, DatabaseError>;
}

#[async_trait]
impl DatabaseGachaRecordAdditions for Database {
  async fn save_gacha_records(&self, records: Vec<GachaRecord>) -> Result<u64, DatabaseError> {
    let mut txn = self.executor().begin().await?;
    let mut changes = 0;
    for record in records {
      changes += query(
        "INSERT INTO `hg.gacha_records` (
          `id`, `facet`, `uid`, `gacha_type`, `gacha_id`, `rank_type`,
          `count`, `time`, `lang`, `name`, `item_type`, `item_id`
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?
        ) ON CONFLICT (`id`) DO NOTHING;",
      )
      .bind(record.id)
      .bind(record.facet)
      .bind(record.uid)
      .bind(record.gacha_type)
      .bind(record.gacha_id)
      .bind(record.rank_type)
      .bind(record.count)
      .bind(record.time)
      .bind(record.lang)
      .bind(record.name)
      .bind(record.item_type)
      .bind(record.item_id)
      .execute(&mut *txn)
      .await?
      .rows_affected();
    }
    txn.commit().await?;

    Ok(changes)
  }
}

// Tests

#[cfg(test)]
mod tests {
  use serde_json::{from_str as from_json, to_string as to_json};

  use super::{AccountFacet, GachaRecord, GachaRecordRankType};

  #[test]
  fn test_serialize() {
    let record = GachaRecord {
      id: "1675850760000000000".into(),
      facet: AccountFacet::GenshinImpact,
      uid: 100_000_001,
      gacha_type: 400,
      gacha_id: None,
      rank_type: GachaRecordRankType::Blue,
      count: 1,
      time: "2023-01-01 00:00:00".into(),
      lang: "zh-cn".into(),
      name: "弹弓".into(),
      item_type: "武器".into(),
      item_id: None,
    };

    assert!(matches!(
      to_json(&record).as_deref(),
      Ok(
        r#"{"id":"1675850760000000000","facet":0,"uid":100000001,"gachaType":400,"gachaId":null,"rankType":3,"count":1,"time":"2023-01-01 00:00:00","lang":"zh-cn","name":"弹弓","itemType":"武器","itemId":null}"#
      )
    ));
  }

  #[test]
  fn test_deserialize() {
    let json = r#"
      {
        "id": "1675850760000000000",
        "facet": 0,
        "uid": 100000001,
        "gachaType": 400,
        "gachaId": null,
        "rankType": 3,
        "count": 1,
        "time": "2023-01-01 00:00:00",
        "lang": "zh-cn",
        "name": "弹弓",
        "itemType": "武器",
        "itemId": null
      }
    "#;

    let record = from_json::<GachaRecord>(json);
    assert!(record.is_ok());

    let record = record.unwrap();
    assert_eq!(record.id, "1675850760000000000");
    assert_eq!(record.facet, AccountFacet::GenshinImpact);
    assert_eq!(record.uid, 100_000_001);
    assert_eq!(record.gacha_type, 400);
    assert_eq!(record.gacha_id, None);
    assert_eq!(record.rank_type, GachaRecordRankType::Blue);
    assert_eq!(record.count, 1);
    assert_eq!(record.time, "2023-01-01 00:00:00");
    assert_eq!(record.lang, "zh-cn");
    assert_eq!(record.name, "弹弓");
    assert_eq!(record.item_type, "武器");
    assert_eq!(record.item_id, None);
  }
}
