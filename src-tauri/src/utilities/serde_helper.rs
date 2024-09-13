pub mod de {
  use std::fmt::Display;

  use serde::de::IntoDeserializer;
  use serde::{Deserialize, Deserializer};

  pub fn string_as_number<'de, D, T>(de: D) -> Result<T, D::Error>
  where
    D: Deserializer<'de>,
    T: TryFrom<u64>,
    T::Error: Display,
  {
    let str = String::deserialize(de)?;
    let num = str.parse::<u64>().map_err(serde::de::Error::custom)?;
    T::try_from(num).map_err(serde::de::Error::custom)
  }

  pub fn string_as_number_option<'de, D, T>(de: D) -> Result<Option<T>, D::Error>
  where
    D: Deserializer<'de>,
    T: TryFrom<u64>,
    T::Error: Display,
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

pub mod ser {
  use std::fmt::Display;

  use serde::Serializer;

  pub fn number_as_string<T, S>(num: &T, ser: S) -> Result<S::Ok, S::Error>
  where
    T: Display,
    S: Serializer,
  {
    ser.serialize_str(&num.to_string())
  }

  pub fn option_number_as_string<T, S>(num: &Option<T>, ser: S) -> Result<S::Ok, S::Error>
  where
    T: Display,
    S: Serializer,
  {
    match num {
      None => ser.serialize_none(),
      Some(n) => ser.serialize_str(&n.to_string()),
    }
  }
}
