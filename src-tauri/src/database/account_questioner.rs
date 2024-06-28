use sqlx::database::HasArguments;
use sqlx::encode::IsNull;
use sqlx::error::BoxDynError;
use sqlx::sqlite::{SqliteRow, SqliteTypeInfo, SqliteValueRef};
use sqlx::{Decode, Encode, FromRow, Row, Sqlite, Type};
use time::OffsetDateTime;

use super::macros::declare_entity_with_handlers;
use crate::models::{Account, AccountIdentifier, AccountProperties, Business};

declare_entity_with_handlers! {
  Account,

  "
  CREATE TABLE IF NOT EXISTS `hg.accounts` (
    `id`                   INTEGER PRIMARY KEY AUTOINCREMENT,
    `business`             INTEGER NOT NULL,
    `uid`                  INTEGER NOT NULL,
    `game_data_dir`        TEXT    NOT NULL,
    `gacha_url`            TEXT,
    `gacha_url_updated_at` DATETIME,
    `properties`           TEXT,
    `created_at`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE        INDEX IF NOT EXISTS `hg.accounts.business_idx`     ON `hg.accounts` (`business`);
  CREATE        INDEX IF NOT EXISTS `hg.accounts.uid_idx`          ON `hg.accounts` (`uid`);
  CREATE UNIQUE INDEX IF NOT EXISTS `hg.accounts.business_uid_idx` ON `hg.accounts` (`business`, `uid`);
  ",

  "SELECT * FROM `hg.accounts`;"
    = find_accounts {} and fetch_all -> Vec<Account>,

  "SELECT * FROM `hg.accounts` WHERE `business` = ?;"
    = find_accounts_by_business {
        business: Business
      } and fetch_all -> Vec<Account>,

  "SELECT * FROM `hg.accounts` WHERE `id` = ?;"
    = find_account_by_id { id: u32 } and fetch_optional -> Option<Account>,

  "SELECT * FROM `hg.accounts` WHERE `business` = ? AND `uid` = ?;"
    = find_account_by_business_and_uid {
      business: Business,
        uid: AccountIdentifier
      } and fetch_optional -> Option<Account>,

  "INSERT INTO `hg.accounts` (`business`, `uid`, `game_data_dir`, `properties`) VALUES (?, ?, ?, ?) RETURNING *;"
    = create_account {
        business: Business,
        uid: AccountIdentifier,
        game_data_dir: String,
        properties: Option<AccountProperties>
      } and fetch_one -> Account,

  "UPDATE `hg.accounts` SET `game_data_dir` = ? WHERE `id` = ? RETURNING *;"
    = update_account_game_data_dir_by_id {
        game_data_dir: String,
        id: u32
      } and fetch_optional -> Option<Account>,

  "UPDATE `hg.accounts` SET `gacha_url` = ?, `gacha_url_updated_at` = ?, WHERE `id` = ? RETURNING *;"
    = update_account_gacha_url_by_id {
        gacha_url: Option<String>,
        gacha_url_updated_at: Option<OffsetDateTime>,
        id: u32
      } and fetch_optional -> Option<Account>,

  "UPDATE `hg.accounts` SET `properties` = ? WHERE `id` = ? RETURNING *;"
    = update_account_properties_by_id {
        properties: Option<AccountProperties>,
        id: u32
      } and fetch_optional -> Option<Account>,

  "UPDATE `hg.accounts` SET `game_data_dir` = ?, `properties` = ? WHERE `id` = ? RETURNING *;"
    = update_account_game_data_dir_and_properties_by_id {
        game_data_dir: String,
        properties: Option<AccountProperties>,
        id: u32
      } and fetch_optional -> Option<Account>,

  "DELETE FROM `hg.accounts` WHERE `id` = ? RETURNING *;"
    = delete_account_by_id {
        id: u32
      } and fetch_optional -> Option<Account>,
}

// Sqlx de, ser

impl<'r> FromRow<'r, SqliteRow> for Account {
  fn from_row(row: &'r SqliteRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      id: row.try_get("id")?,
      business: row.try_get("business")?,
      uid: row.try_get("uid")?,
      game_data_dir: row.try_get("game_data_dir")?,
      gacha_url: row.try_get("gacha_url")?,
      gacha_url_updated_at: row.try_get("gacha_url_updated_at")?,
      properties: row.try_get("properties")?,
      created_at: row.try_get("created_at")?,
    })
  }
}

// Account Business

impl Type<Sqlite> for Business {
  fn type_info() -> SqliteTypeInfo {
    u8::type_info()
  }

  fn compatible(ty: &SqliteTypeInfo) -> bool {
    u8::compatible(ty)
  }
}

impl<'r> Encode<'r, Sqlite> for Business {
  fn encode_by_ref(&self, buf: &mut <Sqlite as HasArguments<'r>>::ArgumentBuffer) -> IsNull {
    u8::from(*self).encode_by_ref(buf)
  }
}

impl<'r> Decode<'r, Sqlite> for Business {
  fn decode(value: SqliteValueRef) -> Result<Self, BoxDynError> {
    Business::try_from(u8::decode(value)?).map_err(Into::into)
  }
}

// Account Identifier

impl Type<Sqlite> for AccountIdentifier {
  fn type_info() -> SqliteTypeInfo {
    u32::type_info()
  }

  fn compatible(ty: &SqliteTypeInfo) -> bool {
    u32::compatible(ty)
  }
}

impl<'r> Encode<'r, Sqlite> for AccountIdentifier {
  fn encode_by_ref(&self, buf: &mut <Sqlite as HasArguments<'r>>::ArgumentBuffer) -> IsNull {
    (**self).encode_by_ref(buf)
  }
}

impl<'r> Decode<'r, Sqlite> for AccountIdentifier {
  fn decode(value: SqliteValueRef) -> Result<Self, BoxDynError> {
    Ok(AccountIdentifier::try_from(u32::decode(value)?)?)
  }
}

// Account Properties

impl Type<Sqlite> for AccountProperties {
  fn type_info() -> SqliteTypeInfo {
    String::type_info()
  }

  fn compatible(ty: &SqliteTypeInfo) -> bool {
    String::compatible(ty)
  }
}

impl<'r> Encode<'r, Sqlite> for AccountProperties {
  fn encode_by_ref(&self, buf: &mut <Sqlite as HasArguments<'r>>::ArgumentBuffer) -> IsNull {
    serde_json::to_string(self)
      .expect("Failed when serializing account properties")
      .encode_by_ref(buf)
  }
}

impl<'r> Decode<'r, Sqlite> for AccountProperties {
  fn decode(value: SqliteValueRef) -> Result<Self, BoxDynError> {
    serde_json::from_str(&String::decode(value)?)
      .map_err(|e| format!("Failed when deserializing account properties: {e}").into())
  }
}
