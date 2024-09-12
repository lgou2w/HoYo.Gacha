pub mod de {
  use std::fmt;

  use serde::de::IntoDeserializer;
  use serde::{Deserialize, Deserializer};

  pub fn string_as_number<'de, D, T>(de: D) -> Result<T, D::Error>
  where
    D: Deserializer<'de>,
    T: TryFrom<u64>,
    T::Error: fmt::Display,
  {
    let str = String::deserialize(de)?;
    let num = str.parse::<u64>().map_err(serde::de::Error::custom)?;
    T::try_from(num).map_err(serde::de::Error::custom)
  }

  pub fn string_as_number_option<'de, D, T>(de: D) -> Result<Option<T>, D::Error>
  where
    D: Deserializer<'de>,
    T: TryFrom<u64>,
    T::Error: fmt::Display,
  {
    let opt = Option::<String>::deserialize(de)?;
    match opt {
      None => Ok(None),
      Some(s) => string_as_number(s.into_deserializer()).map(Some),
    }
  }

  pub fn empty_string_as_none<'de, D, T>(de: D) -> Result<Option<T>, D::Error>
  where
    D: Deserializer<'de>,
    T: Deserialize<'de>,
  {
    let opt = Option::<String>::deserialize(de)?;
    match opt.as_deref() {
      None | Some("") => Ok(None),
      Some(s) => T::deserialize(s.into_deserializer()).map(Some),
    }
  }
}
