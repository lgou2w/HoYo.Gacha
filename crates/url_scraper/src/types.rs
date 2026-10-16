use serde::de::IntoDeserializer;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use time::PrimitiveDateTime;
use time::format_description::FormatItem;
use time::macros::format_description;

pub type GachaType = u32;

/// Known gacha types for each business.
///
/// A closed set — new games must add a variant here. Every `match` on this
/// enum will fail to compile until the new variant is handled, which keeps
/// `permanent()` and `values()` in sync with the game list.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum KnownGachaType {
  /// 'Genshin Impact'
  Hk4e,
  /// 'Honkai: Star Rail'
  Hkrpg,
  /// 'Zenless Zone Zero'
  Nap,
  /// 'Genshin Impact: Miliastra Wonderland'
  Beyond,
}

impl KnownGachaType {
  /// Returns the permanent gacha type for the game.
  #[inline]
  pub const fn permanent(&self) -> GachaType {
    match self {
      Self::Hk4e => GachaTypes::Hk4e::PERMANENT,
      Self::Hkrpg => GachaTypes::Hkrpg::PERMANENT,
      Self::Nap => GachaTypes::Nap::PERMANENT,
      Self::Beyond => GachaTypes::Beyond::PERMANENT,
    }
  }

  /// Returns all known gacha types for the game.
  #[inline]
  pub const fn values(&self) -> &'static [GachaType] {
    match self {
      Self::Hk4e => GachaTypes::Hk4e::VALUES,
      Self::Hkrpg => GachaTypes::Hkrpg::VALUES,
      Self::Nap => GachaTypes::Nap::VALUES,
      Self::Beyond => GachaTypes::Beyond::VALUES,
    }
  }
}

/// Known Gacha types constant modules.
///
/// Each module is a flat namespace of `pub const` values; the enums
/// [`KnownGachaType`] is the type-level handle used by callers.
#[allow(non_snake_case)]
pub mod GachaTypes {
  use super::GachaType;

  /// For 'Genshin Impact'
  pub mod Hk4e {
    use super::GachaType;

    pub const BEGINNER: GachaType = 100;
    pub const PERMANENT: GachaType = 200;
    /// Character (Shares pity value with `Character - 2`)
    pub const CHARACTER: GachaType = 301;
    /// Character - 2 (Shares pity value with `Character`)
    pub const CHARACTER2: GachaType = 400;
    pub const WEAPON: GachaType = 302;
    /// Chronicled and Lightrace.
    /// When the type is Lightrace, the value of the `op_gacha_type` field is `5001`.
    pub const CHRONICLED: GachaType = 500;

    pub const VALUES: &[GachaType] = &[
      PERMANENT, CHARACTER, CHARACTER2, WEAPON, CHRONICLED, BEGINNER, // Low priority
    ];
  }

  /// For 'Honkai: Star Rail'
  pub mod Hkrpg {
    use super::GachaType;

    pub const BEGINNER: GachaType = 2;
    pub const PERMANENT: GachaType = 1;
    pub const CHARACTER: GachaType = 11;
    pub const LIGHTCONE: GachaType = 12;
    pub const COLLAB_CHARACTER: GachaType = 21;
    pub const COLLAB_LIGHTCONE: GachaType = 22;

    pub const VALUES: &[GachaType] = &[
      PERMANENT,
      CHARACTER,
      LIGHTCONE,
      COLLAB_CHARACTER,
      COLLAB_LIGHTCONE,
      BEGINNER, // Low priority
    ];
  }

  /// For 'Zenless Zone Zero'
  pub mod Nap {
    use super::GachaType;

    pub const PERMANENT: GachaType = 1;
    pub const CHARACTER: GachaType = 2;
    pub const WENGINE: GachaType = 3;
    pub const BANGBOO: GachaType = 5;
    pub const EXCLUSIVE_RESCREENING: GachaType = 102;
    pub const WENGINE_REVERBERATION: GachaType = 103;

    pub const VALUES: &[GachaType] = &[
      PERMANENT,
      CHARACTER,
      WENGINE,
      BANGBOO,
      EXCLUSIVE_RESCREENING,
      WENGINE_REVERBERATION,
    ];
  }

  /// For 'Genshin Impact: Miliastra Wonderland'
  pub mod Beyond {
    use super::GachaType;

    pub const PERMANENT: GachaType = 1000;
    /// Event Ode.
    /// Includes: Manekin (Male) and Manekina (Female) event odes.
    pub const EVENT: GachaType = 2000;

    /// Manekin Cosmetic Event Ode (Male)
    pub const EVENT_MANEKIN: GachaType = 20011;
    /// Manekin Cosmetic Event Ode - 2 (Male)
    pub const EVENT_MANEKIN2: GachaType = 20012;

    /// Manekina Cosmetic Event Ode (Female)
    pub const EVENT_MANEKINA: GachaType = 20021;
    /// Manekina Cosmetic Event Ode - 2 (Female)
    pub const EVENT_MANEKINA2: GachaType = 20022;

    pub const VALUES: &[GachaType] = &[PERMANENT, EVENT];
  }
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct MihoyoResponse<T> {
  pub retcode: i32,
  pub message: String,
  pub data: Option<T>,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct GachaLogs {
  pub list: Vec<GachaLog>,
  /// Except for `Genshin Impact: Miliastra Wonderland`
  #[serde(skip_serializing_if = "Option::is_none", default = "Option::default")]
  pub region: Option<String>,
  #[serde(skip_serializing_if = "Option::is_none", default = "Option::default")]
  pub region_time_zone: Option<i8>,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct GachaLog {
  pub id: String,

  #[serde(with = "helpers::string_number_into")]
  pub uid: u32,

  // Except for 'Genshin Impact: Miliastra Wonderland'
  #[serde(
    with = "helpers::string_number_into::option",
    skip_serializing_if = "Option::is_none",
    default = "Option::default"
  )]
  pub gacha_type: Option<u32>,

  // 'Genshin Impact: Miliastra Wonderland' first
  // 'Genshin Impact' since v6.6 (2026/05/20)
  //   See: https://github.com/lgou2w/HoYo.Gacha/issues/172
  #[serde(
    with = "helpers::string_number_into::option",
    skip_serializing_if = "Option::is_none",
    default = "Option::default"
  )]
  pub op_gacha_type: Option<u32>,

  // 'Honkai: Star Rail', 'Zenless Zone Zero' only
  #[serde(
    with = "helpers::empty_string_number_into",
    skip_serializing_if = "Option::is_none",
    default = "Option::default"
  )]
  pub gacha_id: Option<u32>,

  #[serde(
    with = "helpers::empty_string_number_into",
    skip_serializing_if = "Option::is_none",
    default = "Option::default"
  )]
  pub rank_type: Option<u32>,

  // Except for 'Genshin Impact: Miliastra Wonderland'
  // See the default function above.
  #[serde(
    with = "helpers::string_number_into",
    default = "gacha_log_default_count"
  )]
  pub count: u32,

  #[serde(with = "gacha_log_time_format")]
  pub time: PrimitiveDateTime,

  // Except for 'Genshin Impact: Miliastra Wonderland'
  #[serde(skip_serializing_if = "Option::is_none", default = "Option::default")]
  pub lang: Option<String>,

  // `name`      -> Normally
  // `item_name` -> 'Genshin Impact: Miliastra Wonderland'
  #[serde(
    alias = "name",
    deserialize_with = "helpers::de_empty_string_as_none",
    skip_serializing_if = "Option::is_none",
    default = "Option::default"
  )]
  pub item_name: Option<String>,

  #[serde(
    deserialize_with = "helpers::de_empty_string_as_none",
    skip_serializing_if = "Option::is_none",
    default = "Option::default"
  )]
  pub item_type: Option<String>,

  // Except for 'Genshin Impact'
  #[serde(
    with = "helpers::empty_string_number_into",
    skip_serializing_if = "Option::is_none",
    default = "Option::default"
  )]
  pub item_id: Option<u32>,

  //- 'Genshin Impact: Miliastra Wonderland' only
  #[serde(skip_serializing_if = "Option::is_none", default = "Option::default")]
  pub region: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none", default = "Option::default")]
  pub schedule_id: Option<String>,

  #[serde(skip_serializing_if = "Option::is_none", default = "Option::default")]
  pub is_up: Option<String>,
  //-
}

impl GachaLog {
  /// Returns the preferred gacha type. If both `gacha_type` and `op_gacha_type` are present, `gacha_type` is returned.
  ///   * `Genshin Impact: Miliastra Wonderland` only has `op_gacha_type`.
  ///   * `Genshin Impact` since v6.6 `[Luna IV]` (2026/05/20) has both `gacha_type` and `op_gacha_type`.
  ///   * `Genshin Impact` since v6.7 `[Luna IIV]` (2026/07/01) a new `Chronicled` variant of `Lightrace` has been added. When `gacha_type` is `500` and `op_gacha_type` is `5001`, it represents `Lightrace`.
  ///
  /// Returns `0` if both fields are missing, which should not happen in normal cases.
  #[inline]
  pub fn preferred_gacha_type(&self) -> u32 {
    self.gacha_type.or(self.op_gacha_type).unwrap_or(0)
  }

  /// Returns `true` if the `op_gacha_type` field is present.
  #[inline]
  pub const fn has_op_gacha_type(&self) -> bool {
    self.op_gacha_type.is_some()
  }

  /// Returns `true` if the `item_id` field is present.
  /// Except for 'Genshin Impact'.
  #[inline]
  pub const fn has_item_id(&self) -> bool {
    self.item_id.is_some()
  }
}

pub type GachaLogsResponse = MihoyoResponse<GachaLogs>;

// Gacha Log use this format `yyyy-MM-dd HH:mm:ss`,
// but the timezone depends on the specific UID and the corresponding server.
pub const GACHA_LOG_TIME_FORMAT: &[FormatItem<'_>] =
  format_description! { "[year]-[month]-[day] [hour]:[minute]:[second]" };

// serde helper
time::serde::format_description! {
  pub gacha_log_time_format, PrimitiveDateTime, GACHA_LOG_TIME_FORMAT
}

/// 'Genshin Impact: Miliastra Wonderland' does not have this field,
/// possibly to reduce data size. Therefore, the default value is 1.
#[inline]
pub const fn gacha_log_default_count() -> u32 {
  1
}

/// Serde helpers
pub mod helpers {
  use super::*;

  /// Serialize numbers as strings and deserialize strings into numbers.
  ///   * `123` --ser--> `"123"`
  ///   * `"123"` --de-> `123`
  pub mod string_number_into {
    use super::*;

    pub fn serialize<T, S>(num: &T, ser: S) -> Result<S::Ok, S::Error>
    where
      T: std::fmt::Display,
      S: Serializer,
    {
      ser.serialize_str(&num.to_string())
    }

    pub fn deserialize<'de, D, T>(de: D) -> Result<T, D::Error>
    where
      D: Deserializer<'de>,
      T: TryFrom<u64>,
      T::Error: std::fmt::Display,
    {
      let str = String::deserialize(de)?;
      let num = str.parse::<u64>().map_err(serde::de::Error::custom)?;
      T::try_from(num).map_err(serde::de::Error::custom)
    }

    /// Serialize Option numbers as strings and deserialize strings into Option numbers.
    ///   * `None` --ser|de-> `None`
    ///   * `Some(123)` --ser--> `"123"`
    ///   * `"123"` --de-> `Some(123)`
    pub mod option {
      use super::*;

      pub fn serialize<T, S>(num: &Option<T>, ser: S) -> Result<S::Ok, S::Error>
      where
        T: std::fmt::Display,
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
        T::Error: std::fmt::Display,
      {
        let opt = Option::<String>::deserialize(de)?;
        match opt {
          None => Ok(None),
          Some(s) => super::deserialize(s.into_deserializer()).map(Some),
        }
      }
    }
  }

  /// Deserialize empty strings as None, otherwise deserialize normally.
  ///   * `None` --de--> `None`
  ///   * `""` --de--> `None`
  ///   * `"123"` --de--> `Some("123")`
  pub fn de_empty_string_as_none<'de, D, T>(de: D) -> Result<Option<T>, D::Error>
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

  /// Serialize Option numbers as strings and deserialize empty strings into None, otherwise deserialize strings into numbers.
  ///  * `None` --ser|de-> `None`
  ///  * `Some(123)` --ser--> `"123"`
  ///  * `""` --de--> `None`
  ///  * `"123"` --de--> `Some(123)`
  pub mod empty_string_number_into {
    use super::*;

    pub fn serialize<T, S>(num: &Option<T>, ser: S) -> Result<S::Ok, S::Error>
    where
      T: std::fmt::Display,
      S: Serializer,
    {
      super::string_number_into::option::serialize(num, ser)
    }

    pub fn deserialize<'de, D>(de: D) -> Result<Option<u32>, D::Error>
    where
      D: Deserializer<'de>,
    {
      let opt: Option<String> = super::de_empty_string_as_none(de)?;
      match opt {
        None => Ok(None),
        Some(s) => {
          let num: u64 = super::string_number_into::deserialize(s.into_deserializer())?;
          let res = u32::try_from(num).map_err(serde::de::Error::custom)?;
          Ok(Some(res))
        }
      }
    }
  }
}
