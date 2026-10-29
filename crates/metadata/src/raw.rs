use std::collections::{HashMap, HashSet};

use time::OffsetDateTime;

// Raw JSON Schema (PascalCase)
//
// [
//   {
//     Id: u8,                   // Business id (0: Hk4e, 1: Hkrpg, 2: Nap, 3: Beyond)
//     Categories: [
//       {
//         Category: String,     // Category
//         Items: [              // Items
//           [u32, u8]           // Item id : Rank type
//         ],
//         I18n: {
//           [String]: {         // Locale
//             Category: String, // Category local name
//             Items: [String]   // The count and index correspond one-to-one with the Items
//           }
//         }
//       }
//     ],
//     Banners: [
//       {
//         GachaType: u32,
//         StartTime: "2025-01-01T06:00:00+08:00", // RFC 3339
//         EndTime  : "2025-01-01T06:00:00+08:00", // RFC 3339
//         UpGolden : [u32],                       // Item id set
//         UpPurple : [u32],                       // ↑
//         Version  : Option<String>               // 1.0, 2.1
//       }
//     ],
//
//     // Since v1.3.0
//     // Business-wide version timeline. `point -> version`.
//     Versions: [
//       ["1.0", "2020-09-15T06:00:00+08:00"],
//       ["1.1", "2020-11-01T06:00:00+08:00"],
//       ["1.2", "2020-12-01T06:00:00+08:00"],
//     ]
//   }
// ]
//

#[derive(Debug)]
#[cfg_attr(feature = "json", derive(serde::Deserialize), serde(transparent))]
pub struct RawMetadata(Vec<RawBusiness>);

impl RawMetadata {
  #[inline]
  pub fn into_inner(self) -> Vec<RawBusiness> {
    self.0
  }
}

impl AsRef<[RawBusiness]> for RawMetadata {
  #[inline]
  fn as_ref(&self) -> &[RawBusiness] {
    &self.0
  }
}

impl From<Vec<RawBusiness>> for RawMetadata {
  #[inline]
  fn from(value: Vec<RawBusiness>) -> Self {
    Self(value)
  }
}

#[derive(Debug)]
#[cfg_attr(
  feature = "json",
  derive(serde::Deserialize),
  serde(rename_all = "PascalCase")
)]
pub struct RawBusiness {
  pub id: u8,
  pub categories: Vec<RawCategory>,
  pub banners: Vec<RawBanner>,
  /// Business-wide version timeline. Consulted when a banner has no
  /// [`RawBanner::version`] of its own — i.e. Permanent, Collab, and
  /// Bangboo banners whose version changes over time.
  pub versions: Option<Vec<RawVersionPoint>>,
}

#[derive(Debug)]
#[cfg_attr(
  feature = "json",
  derive(serde::Deserialize),
  serde(rename_all = "PascalCase")
)]
pub struct RawCategory {
  /// Category key (e.g. `Character`, `Weapon`).
  pub category: String,
  /// `(item_id, rank_type)` pairs.
  #[cfg_attr(feature = "json", serde(alias = "Entries"))] // For Legacy
  pub items: Vec<(u32, u8)>,
  /// `locale` → localized names.
  pub i18n: HashMap<String, RawLocale>,
}

#[derive(Debug)]
#[cfg_attr(
  feature = "json",
  derive(serde::Deserialize),
  serde(rename_all = "PascalCase")
)]
pub struct RawLocale {
  /// Localized category name.
  pub category: String,
  /// Localized item names. Index-aligned with `RawCategory::items`.
  #[cfg_attr(feature = "json", serde(alias = "Entries"))] // For Legacy
  pub items: Vec<String>,
}

#[derive(Debug)]
#[cfg_attr(
  feature = "json",
  derive(serde::Deserialize),
  serde(rename_all = "PascalCase")
)]
pub struct RawBanner {
  pub gacha_type: u32,
  //pub gacha_id: Option<u32>, // 'Honkai: Star Rail' only // Deprecated since v1.2.0
  #[cfg_attr(feature = "json", serde(with = "time::serde::rfc3339"))]
  pub start_time: OffsetDateTime,
  #[cfg_attr(feature = "json", serde(with = "time::serde::rfc3339"))]
  pub end_time: OffsetDateTime,
  pub up_golden: HashSet<u32>,
  pub up_purple: HashSet<u32>,
  pub version: Option<String>,
}

#[derive(Debug)]
pub struct RawVersionPoint {
  pub version: String,
  pub since: OffsetDateTime,
}

#[cfg(feature = "json")]
impl<'de> serde::Deserialize<'de> for RawVersionPoint {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: serde::Deserializer<'de>,
  {
    use serde::Deserialize;
    use time::format_description::well_known::Rfc3339;

    // Both tuple slots are strings; `since` is RFC 3339.
    let (version, since): (String, String) = Deserialize::deserialize(deserializer)?;
    let since = OffsetDateTime::parse(&since, &Rfc3339).map_err(serde::de::Error::custom)?;
    Ok(Self { version, since })
  }
}
