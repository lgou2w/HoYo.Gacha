use std::ops::{Deref, DerefMut};

use serde::{Deserialize, Serialize};
use serde_json::{Map as JsonMap, Value as JsonValue};
use sqlx::encode::IsNull;
use sqlx::error::BoxDynError;
use sqlx::sqlite::{SqliteArgumentValue, SqliteTypeInfo, SqliteValueRef};
use sqlx::{Decode, Encode, Sqlite, Type};

#[derive(Clone, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(transparent)]
pub struct JsonProperties(JsonMap<String, JsonValue>);

impl Deref for JsonProperties {
  type Target = JsonMap<String, JsonValue>;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl DerefMut for JsonProperties {
  fn deref_mut(&mut self) -> &mut Self::Target {
    &mut self.0
  }
}

impl FromIterator<(String, JsonValue)> for JsonProperties {
  fn from_iter<T: IntoIterator<Item = (String, JsonValue)>>(iter: T) -> Self {
    Self(JsonMap::from_iter(iter))
  }
}

impl Type<Sqlite> for JsonProperties {
  fn type_info() -> SqliteTypeInfo {
    String::type_info()
  }

  fn compatible(ty: &SqliteTypeInfo) -> bool {
    String::compatible(ty)
  }
}

impl<'r> Encode<'r, Sqlite> for JsonProperties {
  fn encode_by_ref(&self, buf: &mut Vec<SqliteArgumentValue<'r>>) -> Result<IsNull, BoxDynError> {
    serde_json::to_string(self)
      .map_err(|e| format!("Failed when serializing json properties: {e:?}"))?
      .encode_by_ref(buf)
  }
}

impl Decode<'_, Sqlite> for JsonProperties {
  fn decode(value: SqliteValueRef) -> Result<Self, BoxDynError> {
    serde_json::from_str(&String::decode(value)?)
      .map_err(|e| format!("Failed when deserializing json properties: {e:?}").into())
  }
}
