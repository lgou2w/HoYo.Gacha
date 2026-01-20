use std::collections::{HashMap, HashSet};

use serde::Deserialize;
use time::OffsetDateTime;
use time::serde::rfc3339;

// Raw JSON Schema (PascalCase)
//
// [
//   {
//     Id: u8,                   // Business id (0: Hk4e, 1: Hkrpg, 2: Nap, 3: Beyond)
//     Categories: [
//       {
//         Category: String,     // Category
//         Entries: [            // Entries
//           [u32, u8]           // Item id : Rank type
//         ],
//         I18n: {
//           [String]: {         // Locale
//             Category: String, // Category local name
//             Entries: [String] // The count and index correspond one-to-one with the Entries
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
//     ]
//   }
// ]
//

#[derive(Debug, Deserialize)]
#[serde(transparent)]
pub struct RawMetadata(Vec<RawMetadataBusiness>);

impl RawMetadata {
  /// 'Genshin Impact'
  pub const BUSINESS_HK4E: u8 = 0;
  /// 'Honkai: Star Rail'
  pub const BUSINESS_HKRPG: u8 = 1;
  /// 'Zenless Zone Zero'
  pub const BUSINESS_NAP: u8 = 2;
  /// 'Genshin Impact: Miliastra Wonderland'
  pub const BUSINESS_BEYOND: u8 = 3;

  #[inline]
  pub fn into_inner(self) -> Vec<RawMetadataBusiness> {
    self.0
  }
}

impl AsRef<Vec<RawMetadataBusiness>> for RawMetadata {
  fn as_ref(&self) -> &Vec<RawMetadataBusiness> {
    &self.0
  }
}

impl From<Vec<RawMetadataBusiness>> for RawMetadata {
  fn from(value: Vec<RawMetadataBusiness>) -> Self {
    Self(value)
  }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct RawMetadataBusiness {
  pub id: u8,
  pub categories: Vec<RawMetadataCategorization>,
  pub banners: Vec<RawMetadataBanner>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct RawMetadataCategorization {
  pub category: String,                       // category
  pub entries: Vec<(u32, u8)>,                // (item_id, rank_type)
  pub i18n: HashMap<String, RawMetadataI18n>, // (locale: i18n)
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct RawMetadataI18n {
  pub category: String,     // category local name
  pub entries: Vec<String>, // entries name
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct RawMetadataBanner {
  pub gacha_type: u32,
  //pub gacha_id: Option<u32>, // 'Honkai: Star Rail' only // Deprecated since v1.2.0
  #[serde(with = "rfc3339")]
  pub start_time: OffsetDateTime,
  #[serde(with = "rfc3339")]
  pub end_time: OffsetDateTime,
  pub up_golden: HashSet<u32>,
  pub up_purple: HashSet<u32>,
  pub version: Option<String>,
}

#[cfg(feature = "json")]
impl RawMetadata {
  #[inline]
  pub fn from_slice(bytes: &[u8]) -> serde_json::Result<Self> {
    serde_json::from_slice(bytes)
  }

  #[allow(clippy::should_implement_trait)]
  #[inline]
  pub fn from_str(s: &str) -> serde_json::Result<Self> {
    serde_json::from_str(s)
  }

  #[inline]
  pub fn from_reader<R: std::io::Read>(rdr: R) -> serde_json::Result<Self> {
    serde_json::from_reader(rdr)
  }
}
