use rusqlite::types::{FromSql, FromSqlError, FromSqlResult, ToSqlOutput, ValueRef};
use rusqlite::{Row, ToSql};
use serde::{Deserialize, Deserializer, Serialize, Serializer};

use crate::database::impl_questioner_with_handlers;
use crate::database::schemas::Properties;

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[repr(u8)]
pub enum AccountBusiness {
  GenshinImpact = 0,
  HonkaiStarRail = 1,
  ZenlessZoneZero = 2,
  MiliastraWonderland = 3,
}

impl AccountBusiness {
  /// Return the string representation of the `AccountBusiness` variant.
  #[inline]
  pub const fn as_str(&self) -> &'static str {
    match self {
      Self::GenshinImpact => "GenshinImpact",
      Self::HonkaiStarRail => "HonkaiStarRail",
      Self::ZenlessZoneZero => "ZenlessZoneZero",
      Self::MiliastraWonderland => "MiliastraWonderland",
    }
  }

  /// Return the corresponding `hg_gamebiz::Game` for the `AccountBusiness`.
  #[inline]
  pub const fn as_game(&self) -> hg_gamebiz::Game {
    match self {
      Self::GenshinImpact | Self::MiliastraWonderland => hg_gamebiz::Game::Hk4e,
      Self::HonkaiStarRail => hg_gamebiz::Game::Hkrpg,
      Self::ZenlessZoneZero => hg_gamebiz::Game::Nap,
    }
  }
}

impl From<AccountBusiness> for u8 {
  fn from(val: AccountBusiness) -> Self {
    val as _
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

// Serde

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

// Rusqlite

impl FromSql for AccountBusiness {
  fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
    let n = u8::column_result(value)?;
    Self::try_from(n).map_err(|err| FromSqlError::Other(err.into()))
  }
}

impl ToSql for AccountBusiness {
  fn to_sql(&self) -> Result<ToSqlOutput<'_>, rusqlite::Error> {
    Ok(ToSqlOutput::from(*self as u8))
  }
}

// Account

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct Account {
  pub business: AccountBusiness,
  pub uid: u32,
  pub data_folder: String,
  pub properties: Option<Properties>,
}

// FromRow

impl TryFrom<&Row<'_>> for Account {
  type Error = rusqlite::Error;

  fn try_from(row: &Row<'_>) -> Result<Self, Self::Error> {
    Ok(Self {
      business: row.get("business")?,
      uid: row.get("uid")?,
      data_folder: row.get("data_folder")?,
      properties: row.get("properties")?,
    })
  }
}

// Questioner

impl_questioner_with_handlers! {
  #[account_handlers]
  Account of AccountQuestioner,

  #[database_find_accounts]
  "SELECT * FROM `HG_ACCOUNTS` WHERE `business` = ?1;"
    = find_accounts { business: AccountBusiness }: fetch_all -> Vec<Account>,

  #[database_find_account]
  "SELECT * FROM `HG_ACCOUNTS` WHERE `business` = ?1 AND `uid` = ?2;"
    = find_account { business: AccountBusiness, uid: u32 }: fetch_optional -> Option<Account>,

  #[database_create_account]
  "INSERT INTO `HG_ACCOUNTS` (`business`, `uid`, `data_folder`, `properties`) VALUES (?1, ?2, ?3, ?4) RETURNING *;"
    = create_account {
        business: AccountBusiness,
        uid: u32,
        data_folder: String,
        properties: Option<String>
      }: fetch_one -> Account,

  #[database_update_account_data_folder]
  "UPDATE `HG_ACCOUNTS` SET `data_folder` = ?3 WHERE `business` = ?1 AND `uid` = ?2 RETURNING *;"
    = update_account_data_folder {
        business: AccountBusiness,
        uid: u32,
        data_folder: String
      }: fetch_optional -> Option<Account>,

  #[database_update_account_properties]
  "UPDATE `HG_ACCOUNTS` SET `properties` = ?3 WHERE `business` = ?1 AND `uid` = ?2 RETURNING *;"
    = update_account_properties {
        business: AccountBusiness,
        uid: u32,
        properties: Option<String>
      }: fetch_optional -> Option<Account>,

  #[database_update_account_data_folder_and_properties]
  "UPDATE `HG_ACCOUNTS` SET `data_folder` = ?3, `properties` = ?4 WHERE `business` = ?1 AND `uid` = ?2 RETURNING *;"
    = update_account_data_folder_and_properties {
        business: AccountBusiness,
        uid: u32,
        data_folder: String,
        properties: Option<String>
      }: fetch_optional -> Option<Account>,

  #[database_delete_account]
  "DELETE FROM `HG_ACCOUNTS` WHERE `business` = ?1 AND `uid` = ?2 RETURNING *;"
    = delete_account { business: AccountBusiness, uid: u32 }: fetch_optional -> Option<Account>,
}
