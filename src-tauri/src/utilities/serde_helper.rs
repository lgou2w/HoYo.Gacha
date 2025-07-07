pub mod string_number_into {
  use std::fmt::Display;

  use serde::{Deserialize, Deserializer, Serializer};

  pub fn serialize<T, S>(num: &T, ser: S) -> Result<S::Ok, S::Error>
  where
    T: Display,
    S: Serializer,
  {
    ser.serialize_str(&num.to_string())
  }

  pub fn deserialize<'de, D, T>(de: D) -> Result<T, D::Error>
  where
    D: Deserializer<'de>,
    T: TryFrom<u64>,
    T::Error: Display,
  {
    let str = String::deserialize(de)?;
    let num = str.parse::<u64>().map_err(serde::de::Error::custom)?;
    T::try_from(num).map_err(serde::de::Error::custom)
  }

  pub mod option {
    use serde::de::IntoDeserializer;

    use super::*;

    pub fn serialize<T, S>(num: &Option<T>, ser: S) -> Result<S::Ok, S::Error>
    where
      T: Display,
      S: Serializer,
    {
      match num {
        None => ser.serialize_none(),
        Some(n) => ser.serialize_str(&n.to_string()),
      }
    }

    pub fn deserialize<'de, D, T>(de: D) -> Result<Option<T>, D::Error>
    where
      D: Deserializer<'de>,
      T: TryFrom<u64>,
      T::Error: Display,
    {
      let opt = Option::<String>::deserialize(de)?;
      match opt {
        None => Ok(None),
        Some(s) => super::deserialize(s.into_deserializer()).map(Some),
      }
    }
  }
}

pub mod de {
  use serde::de::IntoDeserializer;
  use serde::{Deserialize, Deserializer};

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
