use std::str::FromStr;

use serde::Serialize;
use serde::de::DeserializeOwned;

use super::{Database, KvQuestioner, SqlxError};
use crate::models::Kv;

// region: Kvs

pub struct KvMut<'a, 'key> {
  pub database: &'a Database,
  pub key: &'key str,
}

#[allow(dead_code)]
impl<'a, 'key> KvMut<'a, 'key> {
  pub fn from(database: &'a Database, key: &'key str) -> Self {
    Self { database, key }
  }

  #[inline]
  pub async fn remove(&self) -> Result<Option<Kv>, SqlxError> {
    KvQuestioner::delete_kv(self.database, self.key.into()).await
  }

  #[inline]
  pub async fn read(&self) -> Result<Option<Kv>, SqlxError> {
    KvQuestioner::find_kv(self.database, self.key.into()).await
  }

  #[inline]
  pub async fn read_val(&self) -> Result<Option<String>, SqlxError> {
    Ok(self.read().await?.map(|kv| kv.val))
  }

  #[inline]
  pub async fn read_val_parse<R>(&self) -> Result<Option<Result<R, R::Err>>, SqlxError>
  where
    R: FromStr,
  {
    Ok(self.read_val().await?.map(|val| R::from_str(&val)))
  }

  #[inline]
  pub async fn read_val_into<R>(&self) -> Result<Option<R>, SqlxError>
  where
    R: From<String>,
  {
    Ok(self.read_val().await?.map(R::from))
  }

  #[inline]
  pub async fn try_read_val<R>(&self) -> Result<Option<Result<R, R::Error>>, SqlxError>
  where
    R: TryFrom<String>,
  {
    Ok(self.read_val().await?.map(R::try_from))
  }

  #[inline]
  pub async fn try_read_val_json<R>(
    &self,
  ) -> Result<Option<Result<R, serde_json::Error>>, SqlxError>
  where
    R: DeserializeOwned,
  {
    Ok(self.read_val().await?.map(|val| serde_json::from_str(&val)))
  }

  #[inline]
  pub async fn write(&self, val: impl Into<String>) -> Result<Kv, SqlxError> {
    KvQuestioner::upsert_kv(self.database, self.key.into(), val.into(), None).await
  }

  #[inline]
  pub async fn try_write<T>(&self, val: T) -> Result<Result<Kv, SqlxError>, T::Error>
  where
    T: TryInto<String>,
  {
    let val = T::try_into(val)?;
    Ok(self.write(val).await)
  }

  #[inline]
  pub async fn try_write_json<T>(&self, val: &T) -> Result<Result<Kv, SqlxError>, serde_json::Error>
  where
    T: Serialize,
  {
    let val = serde_json::to_string(val)?;
    Ok(self.write(val).await)
  }
}

// endregion
