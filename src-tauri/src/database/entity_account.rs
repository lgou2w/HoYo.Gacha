use num_enum::{IntoPrimitive, TryFromPrimitive};
use serde::{Deserialize, Serialize};
use serde_json::{from_str as from_json, to_string as to_json, Map, Value};
use sqlx::database::HasArguments;
use sqlx::encode::IsNull;
use sqlx::error::BoxDynError;
use sqlx::sqlite::{SqliteTypeInfo, SqliteValueRef};
use sqlx::{Decode, Encode, Sqlite, Type};
use time::serde::rfc3339;
use time::OffsetDateTime;

use crate::generate_entity;

// Facet

#[derive(Clone, Debug, Deserialize, Serialize, IntoPrimitive, TryFromPrimitive)]
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

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(transparent)]
pub struct AccountProperties(Map<String, Value>);

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
  }
});
