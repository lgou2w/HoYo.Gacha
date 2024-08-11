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
  pub data_folder: String,
  pub gacha_url: Option<String>,
  pub properties: Option<AccountProperties>,
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
      data_folder: "empty".into(),
      gacha_url: None,
      properties: None,
    };

    assert!(matches!(
      serde_json::to_string(&account).as_deref(),
      Ok(
        r#"{"business":0,"uid":100000001,"dataFolder":"empty","gachaUrl":null,"properties":null}"#
      )
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
        r#"{"business":0,"uid":100000001,"dataFolder":"empty","gachaUrl":"some gacha url","properties":{"foo":"bar"}}"#
      )
    ));
  }

  #[test]
  fn test_deserialize() {
    let json = r#"
      {
        "business": 0,
        "uid": 100000001,
        "dataFolder": "some data folder",
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
    assert_eq!(account.data_folder, "some data folder");
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
