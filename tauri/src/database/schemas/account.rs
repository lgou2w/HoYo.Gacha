use serde::{Deserialize, Deserializer, Serialize, Serializer};
use sqlx::encode::IsNull;
use sqlx::error::BoxDynError;
use sqlx::sqlite::{SqliteArgumentValue, SqliteRow, SqliteTypeInfo, SqliteValueRef};
use sqlx::{Decode, Encode, FromRow, Row, Sqlite, Type};

use crate::database::schemas::JsonProperties;

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[repr(u8)]
pub enum AccountBusiness {
  GenshinImpact = 0,
  HonkaiStarRail = 1,
  ZenlessZoneZero = 2,
  MiliastraWonderland = 3,
}

impl AccountBusiness {
  /// Get the string representation of the `AccountBusiness`.
  #[inline]
  pub const fn as_str(&self) -> &'static str {
    match self {
      Self::GenshinImpact => "GenshinImpact",
      Self::HonkaiStarRail => "HonkaiStarRail",
      Self::ZenlessZoneZero => "ZenlessZoneZero",
      Self::MiliastraWonderland => "MiliastraWonderland",
    }
  }
}

// Compat
impl AccountBusiness {
  #[inline]
  pub const fn as_game(&self) -> hg_game_biz::Game {
    match self {
      Self::GenshinImpact => hg_game_biz::Game::Hk4e,
      Self::MiliastraWonderland => hg_game_biz::Game::Hk4e,
      Self::HonkaiStarRail => hg_game_biz::Game::Hkrpg,
      Self::ZenlessZoneZero => hg_game_biz::Game::Nap,
    }
  }
}

impl TryFrom<u8> for AccountBusiness {
  type Error = String;

  fn try_from(value: u8) -> Result<Self, Self::Error> {
    match value {
      0 => Ok(Self::GenshinImpact),
      1 => Ok(Self::HonkaiStarRail),
      2 => Ok(Self::ZenlessZoneZero),
      3 => Ok(Self::MiliastraWonderland),
      other => Err(format!("Unknown AccountBusiness value: {other}",)),
    }
  }
}

impl<'de> Deserialize<'de> for AccountBusiness {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: Deserializer<'de>,
  {
    let n = u8::deserialize(deserializer)?;
    Self::try_from(n).map_err(serde::de::Error::custom)
  }
}

impl Serialize for AccountBusiness {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    (*self as u8).serialize(serializer)
  }
}

impl Type<Sqlite> for AccountBusiness {
  fn type_info() -> SqliteTypeInfo {
    u8::type_info()
  }

  fn compatible(ty: &SqliteTypeInfo) -> bool {
    u8::compatible(ty)
  }
}

impl<'r> Encode<'r, Sqlite> for AccountBusiness {
  fn encode_by_ref(&self, buf: &mut Vec<SqliteArgumentValue<'r>>) -> Result<IsNull, BoxDynError> {
    (*self as u8).encode_by_ref(buf)
  }
}

impl Decode<'_, Sqlite> for AccountBusiness {
  fn decode(value: SqliteValueRef) -> Result<Self, BoxDynError> {
    let n = u8::decode(value)?;
    Self::try_from(n).map_err(Into::into)
  }
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Account {
  pub business: AccountBusiness,
  pub uid: u32,
  pub data_folder: String,
  pub properties: Option<JsonProperties>,
}

impl<'r> FromRow<'r, SqliteRow> for Account {
  fn from_row(row: &'r SqliteRow) -> Result<Self, sqlx::Error> {
    Ok(Self {
      business: row.try_get("business")?,
      uid: row.try_get("uid")?,
      data_folder: row.try_get("data_folder")?,
      properties: row.try_get("properties")?,
    })
  }
}

impl_questioner_with_handlers! {
  #[account_handlers]
  Account of AccountQuestioner,

  #[database_find_accounts]
  "SELECT * FROM `HG_ACCOUNTS` WHERE `business` = ?;"
    = find_accounts { business: AccountBusiness }: fetch_all -> Vec<Account>,

  #[database_find_account]
  "SELECT * FROM `HG_ACCOUNTS` WHERE `business` = ? AND `uid` = ?;"
    = find_account { business: AccountBusiness, uid: u32 }: fetch_optional -> Option<Account>,

  #[database_create_account]
  "INSERT INTO `HG_ACCOUNTS` (`business`, `uid`, `data_folder`, `properties`) VALUES (?, ?, ?, ?) RETURNING *;"
    = create_account {
        business: AccountBusiness,
        uid: u32,
        data_folder: &str,
        properties: Option<JsonProperties>
      }: fetch_one -> Account,

  #[database_update_account_data_folder]
  "UPDATE `HG_ACCOUNTS` SET `data_folder` = ? WHERE `business` = ? AND `uid` = ? RETURNING *;"
    = update_account_data_folder {
        data_folder: &str,
        business: AccountBusiness,
        uid: u32
      }: fetch_optional -> Option<Account>,

  #[database_update_account_properties]
  "UPDATE `HG_ACCOUNTS` SET `properties` = ? WHERE `business` = ? AND `uid` = ? RETURNING *;"
    = update_account_properties {
        properties: Option<JsonProperties>,
        business: AccountBusiness,
        uid: u32
      }: fetch_optional -> Option<Account>,

  #[database_update_account_data_folder_and_properties]
  "UPDATE `HG_ACCOUNTS` SET `data_folder` = ?, `properties` = ? WHERE `business` = ? AND `uid` = ? RETURNING *;"
    = update_account_data_folder_and_properties {
        data_folder: &str,
        properties: Option<JsonProperties>,
        business: AccountBusiness,
        uid: u32
      }: fetch_optional -> Option<Account>,

  #[database_delete_account]
  "DELETE FROM `HG_ACCOUNTS` WHERE `business` = ? AND `uid` = ? RETURNING *;"
    = delete_account { business: AccountBusiness, uid: u32 }: fetch_optional -> Option<Account>,
}
