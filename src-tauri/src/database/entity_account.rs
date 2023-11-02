use std::cmp::Ordering;
use std::ops::Deref;

use num_enum::{IntoPrimitive, TryFromPrimitive};
use serde::{Deserialize, Serialize};
use serde_json::{from_str as from_json, to_string as to_json, Map, Value};
use serde_repr::{Deserialize_repr, Serialize_repr};
use sqlx::database::HasArguments;
use sqlx::encode::IsNull;
use sqlx::error::BoxDynError;
use sqlx::sqlite::{SqliteTypeInfo, SqliteValueRef};
use sqlx::{Decode, Encode, Sqlite, Type};
use time::serde::rfc3339;
use time::OffsetDateTime;

use crate::generate_entity;

// Facet

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
pub enum AccountFacet {
  Genshin = 0,
  StarRail = 1,
}

impl Type<Sqlite> for AccountFacet {
  fn type_info() -> SqliteTypeInfo {
    u8::type_info()
  }
}

impl<'r> Encode<'r, Sqlite> for AccountFacet {
  fn encode_by_ref(&self, buf: &mut <Sqlite as HasArguments<'r>>::ArgumentBuffer) -> IsNull {
    u8::from(self.clone()).encode_by_ref(buf)
  }
}

impl<'r> Decode<'r, Sqlite> for AccountFacet {
  fn decode(value: SqliteValueRef) -> Result<Self, BoxDynError> {
    AccountFacet::try_from(u8::decode(value)?).map_err(Into::into)
  }
}

// Properties

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(transparent)]
pub struct AccountProperties(Map<String, Value>);

impl AccountProperties {
  #[inline]
  pub fn insert(&mut self, k: impl Into<String>, v: impl Into<Value>) -> Option<Value> {
    self.0.insert(k.into(), v.into())
  }
}

impl Deref for AccountProperties {
  type Target = Map<String, Value>;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl Type<Sqlite> for AccountProperties {
  fn type_info() -> SqliteTypeInfo {
    String::type_info()
  }
}

impl<'r> Encode<'r, Sqlite> for AccountProperties {
  fn encode_by_ref(&self, buf: &mut <Sqlite as HasArguments<'r>>::ArgumentBuffer) -> IsNull {
    to_json(self)
      .unwrap_or_else(|e| panic!("Failed when serializing account properties: {e}"))
      .encode_by_ref(buf)
  }
}

impl<'r> Decode<'r, Sqlite> for AccountProperties {
  fn decode(value: SqliteValueRef) -> Result<Self, BoxDynError> {
    from_json(&String::decode(value)?)
      .map_err(|e| format!("Failed when deserializing account properties: {e}").into())
  }
}

// Entity

generate_entity!({
  #[derive(Clone, Debug, Deserialize, Serialize)]
  #[serde(rename_all = "camelCase")]
  pub Account {
    pub id: u32,
    pub facet: AccountFacet,
    pub uid: u32,
    pub game_data_dir: String,
    pub gacha_url: Option<String>,
    #[serde(with = "rfc3339::option")]
    pub gacha_url_updated_at: Option<OffsetDateTime>,
    pub properties: Option<AccountProperties>,
    #[serde(with = "rfc3339")]
    pub created_at: OffsetDateTime,
  },
  questioner {
    initialize => "
      CREATE TABLE IF NOT EXISTS `hg.accounts` (
        `id`                   INTEGER PRIMARY KEY AUTOINCREMENT,
        `facet`                INTEGER NOT NULL,
        `uid`                  INTEGER NOT NULL,
        `game_data_dir`        TEXT    NOT NULL,
        `gacha_url`            TEXT,
        `gacha_url_updated_at` DATETIME,
        `properties`           TEXT,
        `created_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE        INDEX IF NOT EXISTS `hg.facet_idx`     ON `hg.accounts` (`facet`);
      CREATE        INDEX IF NOT EXISTS `hg.uid_idx`       ON `hg.accounts` (`uid`);
      CREATE UNIQUE INDEX IF NOT EXISTS `hg.facet_uid_idx` ON `hg.accounts` (`facet`, `uid`);
    ",

    find_one_by_id { id: u32 } => "SELECT * FROM `hg.accounts` WHERE `id` = ?;",
    find_one_by_facet_and_uid {
      facet: AccountFacet,
      uid: u32
    } => "SELECT * FROM `hg.accounts` WHERE `facet` = ? and `uid` = ?;",

    find_many {} => "SELECT * FROM `hg.accounts`;",
    find_many_by_facet { facet: AccountFacet } => "SELECT * FROM `hg.accounts` WHERE `facet` = ?;",

    create_one {
      facet: AccountFacet,
      uid: u32,
      game_data_dir: String
    } => "INSERT INTO `hg.accounts` (`facet`, `uid`, `game_data_dir`) VALUES (?, ?, ?) RETURNING *;",

    update_game_data_dir_by_id {
      game_data_dir: String,
      id: u32
    } => "UPDATE `hg.accounts` SET `game_data_dir` = ? WHERE `id` = ? RETURNING *;",

    update_gacha_url_by_id {
      gacha_url: Option<String>,
      gacha_url_updated_at: Option<OffsetDateTime>,
      id: u32
    } => "UPDATE `hg.accounts` SET `gacha_url` = ?, `gacha_url_updated_at` = ?, WHERE `id` = ? RETURNING *;",

    update_properties_by_id {
      properties: Option<AccountProperties>,
      id: u32
    } => "UPDATE `hg.accounts` SET `properties` = ? WHERE `id` = ? RETURNING *;",

    delete_by_id { id: u32 } => "DELETE FROM `hg.accounts` WHERE `id` = ? RETURNING *;",
  }
});

// Expansion

impl Account {
  pub fn properties_or_default(&mut self) -> &mut AccountProperties {
    if self.properties.is_none() {
      self.properties.replace(Default::default());
    }

    self.properties.as_mut().unwrap()
  }
}

// HACK: AccountFacet and Unique ID
//   The role of `id` is just the serial number.
//   Other fields as properties.
impl PartialEq for Account {
  fn eq(&self, other: &Self) -> bool {
    self.facet == other.facet && self.uid == other.uid
  }
}

impl PartialOrd for Account {
  fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
    Some(self.facet.cmp(&other.facet).then(self.uid.cmp(&other.uid)))
  }
}

// Tests

#[cfg(test)]
mod tests {
  use serde_json::{from_str as from_json, to_string as to_json, Number, Value};
  use time::macros::datetime;

  use crate::database::{Account, AccountFacet};

  #[test]
  fn test_serialize() {
    let mut account = Account {
      id: 1,
      facet: AccountFacet::Genshin,
      uid: 100_000_001,
      game_data_dir: "empty".into(),
      gacha_url: None,
      gacha_url_updated_at: None,
      properties: None,
      created_at: datetime!(2023-01-01 00:00:00).assume_utc(),
    };

    assert!(matches!(
      to_json(&account).as_deref(),
      Ok(
        r#"{"id":1,"facet":0,"uid":100000001,"gameDataDir":"empty","gachaUrl":null,"gachaUrlUpdatedAt":null,"properties":null,"createdAt":"2023-01-01T00:00:00Z"}"#
      )
    ));

    account.gacha_url.replace("some gacha url".into());
    account.gacha_url_updated_at.replace(account.created_at);
    account.properties_or_default().insert("foo", "bar");

    assert!(matches!(
      to_json(&account).as_deref(),
      Ok(
        r#"{"id":1,"facet":0,"uid":100000001,"gameDataDir":"empty","gachaUrl":"some gacha url","gachaUrlUpdatedAt":"2023-01-01T00:00:00Z","properties":{"foo":"bar"},"createdAt":"2023-01-01T00:00:00Z"}"#
      )
    ));
  }

  #[test]
  fn test_deserialize() {
    let json = r#"
      {
        "id": 1,
        "facet": 0,
        "uid": 100000001,
        "gameDataDir": "some game data dir",
        "gachaUrl": "some gacha url",
        "gachaUrlUpdatedAt": "2023-01-01T00:00:00Z",
        "properties": {
          "foo": "bar",
          "num": 123456
        },
        "createdAt": "2023-01-01T00:00:00Z"
      }
    "#;

    let account = from_json::<Account>(json);
    assert!(account.is_ok());

    let account = account.unwrap();
    assert_eq!(account.id, 1);
    assert_eq!(account.facet, AccountFacet::Genshin);
    assert_eq!(account.uid, 100_000_001);
    assert_eq!(account.game_data_dir, "some game data dir");
    assert_eq!(account.gacha_url.as_deref(), Some("some gacha url"));
    assert_eq!(
      account.gacha_url_updated_at,
      Some(datetime!(2023-01-01 00:00:00).assume_utc())
    );

    assert_eq!(
      account.properties.as_ref().and_then(|f| f.get("foo")),
      Some(&Value::String("bar".into()))
    );
    assert_eq!(
      account.properties.as_ref().and_then(|f| f.get("num")),
      Some(&Value::Number(Number::from(123456)))
    );

    assert_eq!(
      account.created_at,
      datetime!(2023-01-01 00:00:00).assume_utc()
    );
  }
}
