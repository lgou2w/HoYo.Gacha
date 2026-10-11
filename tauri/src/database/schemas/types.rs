use std::ops::{Deref, DerefMut};

use rusqlite::ToSql;
use rusqlite::types::{FromSql, FromSqlError, FromSqlResult, ToSqlOutput, ValueRef};
use serde::{Deserialize, Serialize};

pub type JsonValue = serde_json::Value;
pub type JsonMap<K, V> = serde_json::Map<K, V>;

/// A wrapper around `serde_json::Map<String, serde_json::Value>` that implements `Deserialize` and `Serialize`.
/// This is used to store arbitrary JSON data in the database.
#[derive(Clone, Debug, Default, Deserialize, Serialize, PartialEq, Eq)]
#[serde(transparent)]
pub struct Properties(JsonMap<String, JsonValue>);

impl Properties {
  #[inline]
  pub fn new() -> Self {
    Self(JsonMap::new())
  }

  #[inline]
  pub fn with_capacity(capacity: usize) -> Self {
    Self(JsonMap::with_capacity(capacity))
  }
}

impl Deref for Properties {
  type Target = JsonMap<String, JsonValue>;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl DerefMut for Properties {
  fn deref_mut(&mut self) -> &mut Self::Target {
    &mut self.0
  }
}

impl FromIterator<(String, JsonValue)> for Properties {
  fn from_iter<T: IntoIterator<Item = (String, JsonValue)>>(iter: T) -> Self {
    Self(JsonMap::from_iter(iter))
  }
}

// Rusqlite

impl FromSql for Properties {
  fn column_result(value: ValueRef<'_>) -> FromSqlResult<Self> {
    let s = String::column_result(value)?;
    serde_json::from_str(&s).map_err(FromSqlError::other)
  }
}

impl ToSql for Properties {
  fn to_sql(&self) -> Result<ToSqlOutput<'_>, rusqlite::Error> {
    let s = serde_json::to_string(self)
      .map_err(|err| rusqlite::Error::ToSqlConversionFailure(err.into()))?;
    Ok(ToSqlOutput::from(s))
  }
}
