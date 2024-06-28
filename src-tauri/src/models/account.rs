use std::fmt;
use std::ops::{Deref, DerefMut};

use num_enum::{IntoPrimitive, TryFromPrimitive};
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use time::serde::rfc3339;
use time::OffsetDateTime;

/// Account Business

#[derive(
  Copy,
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
  Hash,
)]
#[repr(u8)]
pub enum Business {
  GenshinImpact = 0,
  HonkaiStarRail = 1,
  // ZenlessZoneZero = 2, // TODO: 07/04
}

impl Business {
  pub fn name(&self) -> &'static str {
    match *self {
      Business::GenshinImpact => "Genshin Impact",
      Business::HonkaiStarRail => "Honkai: Star Rail",
      // Business::ZenlessZoneZero => "Zenless Zone Zero",
    }
  }

  pub fn codename(&self) -> &'static str {
    match *self {
      Business::GenshinImpact => "hk4e",
      Business::HonkaiStarRail => "hkrpg",
      // Business::ZenlessZoneZero => "nap",
    }
  }
}

impl fmt::Display for Business {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self.name())
  }
}

/// Account Unique ID

#[derive(Copy, Clone, Debug, Deserialize, Serialize, PartialEq, Eq, PartialOrd, Ord, Hash)]
#[serde(transparent)]
pub struct AccountIdentifier(u32);

impl AccountIdentifier {
  pub const MIN: Self = Self(100_000_000);
  pub const MAX: Self = Self(999_999_999);
}

impl Deref for AccountIdentifier {
  type Target = u32;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl PartialEq<u32> for AccountIdentifier {
  fn eq(&self, other: &u32) -> bool {
    self.0.eq(other)
  }
}

impl PartialOrd<u32> for AccountIdentifier {
  fn partial_cmp(&self, other: &u32) -> Option<std::cmp::Ordering> {
    self.0.partial_cmp(other)
  }
}

impl fmt::Display for AccountIdentifier {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    self.0.fmt(f)
  }
}

impl TryFrom<u32> for AccountIdentifier {
  type Error = String;

  fn try_from(value: u32) -> Result<Self, Self::Error> {
    if value >= *Self::MIN && value <= *Self::MAX {
      Ok(Self(value))
    } else {
      Err(format!(
        "Incorrect account uid value: {value} (Expected: [{min}, {max}])",
        min = Self::MIN,
        max = Self::MAX
      ))
    }
  }
}

/// Account Server

#[allow(clippy::upper_case_acronyms)]
#[derive(Copy, Clone, Debug, PartialEq, Eq, Hash)]
#[repr(u8)]
pub enum AccountServer {
  Official = 1,
  Channel,
  USA = 10,
  Euro,
  Asia,
  Cht,
}

impl AccountIdentifier {
  /// Returns the first digit from `1` to `9`.
  pub fn first_digit(&self) -> u8 {
    (**self as f32 / *Self::MIN as f32).floor() as _
  }

  pub fn detect_server(&self) -> AccountServer {
    match self.first_digit() {
      1..=4 => AccountServer::Official,
      5 => AccountServer::Channel,
      6 => AccountServer::USA,
      7 => AccountServer::Euro,
      8 => AccountServer::Asia,
      9 => AccountServer::Cht,
      _ => unreachable!(), // SAFETY
    }
  }
}

/// Account Properties

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(transparent)]
pub struct AccountProperties(serde_json::Map<String, serde_json::Value>);

impl Deref for AccountProperties {
  type Target = serde_json::Map<String, serde_json::Value>;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl DerefMut for AccountProperties {
  fn deref_mut(&mut self) -> &mut Self::Target {
    &mut self.0
  }
}

/// Account

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Account {
  pub id: u32,
  pub business: Business,
  pub uid: AccountIdentifier,
  pub game_data_dir: String,
  pub gacha_url: Option<String>,
  #[serde(with = "rfc3339::option")]
  pub gacha_url_updated_at: Option<OffsetDateTime>,
  pub properties: Option<AccountProperties>,
  #[serde(with = "rfc3339")]
  pub created_at: OffsetDateTime,
}

// HACK: Account Business and Unique ID
//   The role of `id` is just the database serial number.
//   Other fields as properties.
impl PartialEq for Account {
  fn eq(&self, other: &Self) -> bool {
    self.business == other.business && self.uid == other.uid
  }
}

impl PartialOrd for Account {
  fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
    Some(
      self
        .business
        .cmp(&other.business)
        .then(self.uid.cmp(&other.uid)),
    )
  }
}

// Tests

#[cfg(test)]
mod tests {
  use serde_json::{from_str as from_json, to_string as to_json, Number, Value};
  use time::macros::datetime;

  use super::*;

  #[test]
  fn test_serialize() {
    let mut account = Account {
      id: 1,
      business: Business::GenshinImpact,
      uid: AccountIdentifier::try_from(100_000_001).unwrap(),
      game_data_dir: "empty".into(),
      gacha_url: None,
      gacha_url_updated_at: None,
      properties: None,
      created_at: datetime!(2023-01-01 00:00:00).assume_utc(),
    };

    assert!(matches!(
      to_json(&account).as_deref(),
      Ok(
        r#"{"id":1,"business":0,"uid":100000001,"gameDataDir":"empty","gachaUrl":null,"gachaUrlUpdatedAt":null,"properties":null,"createdAt":"2023-01-01T00:00:00Z"}"#
      )
    ));

    account.gacha_url.replace("some gacha url".into());
    account.gacha_url_updated_at.replace(account.created_at);
    account.properties.replace(Default::default());
    account
      .properties
      .as_mut()
      .unwrap()
      .insert("foo".into(), "bar".into());

    assert!(matches!(
      to_json(&account).as_deref(),
      Ok(
        r#"{"id":1,"business":0,"uid":100000001,"gameDataDir":"empty","gachaUrl":"some gacha url","gachaUrlUpdatedAt":"2023-01-01T00:00:00Z","properties":{"foo":"bar"},"createdAt":"2023-01-01T00:00:00Z"}"#
      )
    ));
  }

  #[test]
  fn test_deserialize() {
    let json = r#"
      {
        "id": 1,
        "business": 0,
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

    let account = from_json::<Account>(json).unwrap();
    assert_eq!(account.id, 1);
    assert_eq!(account.business, Business::GenshinImpact);
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
