use std::hash::{Hash, Hasher};
use std::ops::{Deref, DerefMut};

use serde::{Deserialize, Serialize};

use super::Business;

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
  pub business: Business,
  pub uid: u32,
  pub data_dir: String,
  pub gacha_url: Option<String>,
  pub properties: Option<AccountProperties>,
}

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

impl Hash for Account {
  fn hash<H: Hasher>(&self, state: &mut H) {
    self.business.hash(state);
    self.uid.hash(state);
  }
}

// Tests

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_serialize() {
    let mut account = Account {
      business: Business::GenshinImpact,
      uid: 100_000_001,
      data_dir: "empty".into(),
      gacha_url: None,
      properties: None,
    };

    assert!(matches!(
      serde_json::to_string(&account).as_deref(),
      Ok(r#"{"business":0,"uid":100000001,"dataDir":"empty","gachaUrl":null,"properties":null}"#)
    ));

    account.gacha_url.replace("some gacha url".into());
    account.properties.replace(Default::default());
    account
      .properties
      .as_mut()
      .unwrap()
      .insert("foo".into(), "bar".into());

    assert!(matches!(
      serde_json::to_string(&account).as_deref(),
      Ok(
        r#"{"business":0,"uid":100000001,"dataDir":"empty","gachaUrl":"some gacha url","properties":{"foo":"bar"}}"#
      )
    ));
  }

  #[test]
  fn test_deserialize() {
    let json = r#"
      {
        "business": 0,
        "uid": 100000001,
        "dataDir": "some game data dir",
        "gachaUrl": "some gacha url",
        "properties": {
          "foo": "bar",
          "num": 123456
        }
      }
    "#;

    let account = serde_json::from_str::<Account>(json).unwrap();
    assert_eq!(account.business, Business::GenshinImpact);
    assert_eq!(account.uid, 100_000_001);
    assert_eq!(account.gacha_url.as_deref(), Some("some gacha url"));

    assert_eq!(
      account.properties.as_ref().and_then(|f| f.get("foo")),
      Some(&serde_json::Value::String("bar".into()))
    );
    assert_eq!(
      account.properties.as_ref().and_then(|f| f.get("num")),
      Some(&serde_json::Value::Number(serde_json::Number::from(123456)))
    );
  }
}
