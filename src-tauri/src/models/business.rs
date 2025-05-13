use std::collections::HashMap;
use std::env;
use std::fmt::{self, Display};
use std::path::{Path, PathBuf};
use std::sync::LazyLock;

use num_enum::{IntoPrimitive, TryFromPrimitive};
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};

/// Business

#[derive(
  Copy,
  Clone,
  Debug,
  Deserialize_repr,
  Serialize_repr,
  IntoPrimitive,
  TryFromPrimitive,
  PartialEq,
  Eq,
  PartialOrd,
  Ord,
  Hash,
)]
#[repr(u8)]
pub enum Business {
  GenshinImpact = 0,
  HonkaiStarRail = 1,
  ZenlessZoneZero = 2,
}

impl fmt::Display for Business {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{self:?}")
  }
}

/// Business region

#[derive(Copy, Clone, Debug, Deserialize, Serialize, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum BusinessRegion {
  Official,
  Global,
}

impl Display for BusinessRegion {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{self:?}")
  }
}

/// Business and Region internals
pub struct BizInternals {
  pub business: Business,
  pub region: BusinessRegion,
  pub codename: &'static str,
  pub display_name: &'static str,
  /// Name of the game's entry executable (without suffix)
  pub executable_name: &'static str,
  pub data_folder_name: &'static str,
}

macro_rules! biz {
  ($business:ident, $region:ident, $codename:literal, $display_name:literal, $executable_name:literal, $data_folder_name:literal) => {
    BizInternals {
      business: Business::$business,
      region: BusinessRegion::$region,
      codename: $codename,
      display_name: $display_name,
      executable_name: $executable_name,
      data_folder_name: $data_folder_name,
    }
  };
}

pub const BIZ_GENSHIN_IMPACT_OFFICIAL: BizInternals = biz!(
  GenshinImpact,
  Official,
  "hk4e_cn",
  "原神",
  "YuanShen",
  "YuanShen_Data"
);

pub const BIZ_GENSHIN_IMPACT_GLOBAL: BizInternals = biz!(
  GenshinImpact,
  Global,
  "hk4e_global",
  "Genshin Impact",
  "GenshinImpact",
  "GenshinImpact_Data"
);

pub const BIZ_HONKAI_STAR_RAIL_OFFICIAL: BizInternals = biz!(
  HonkaiStarRail,
  Official,
  "hkrpg_cn",
  "崩坏：星穹铁道",
  "StarRail",
  "StarRail_Data"
);

pub const BIZ_HONKAI_STAR_RAIL_GLOBAL: BizInternals = biz!(
  HonkaiStarRail,
  Global,
  "hkrpg_global",
  "Honkai: Star Rail",
  "StarRail",
  "StarRail_Data"
);

pub const BIZ_ZENLESS_ZONE_ZERO_OFFICIAL: BizInternals = biz!(
  ZenlessZoneZero,
  Official,
  "nap_cn",
  "绝区零",
  "ZenlessZoneZero",
  "ZenlessZoneZero_Data"
);

pub const BIZ_ZENLESS_ZONE_ZERO_GLOBAL: BizInternals = biz!(
  ZenlessZoneZero,
  Global,
  "nap_global",
  "Zenless Zone Zero",
  "ZenlessZoneZero",
  "ZenlessZoneZero_Data"
);

static BIZ_INTERNALS: LazyLock<HashMap<(Business, BusinessRegion), &'static BizInternals>> =
  LazyLock::new(|| {
    use Business::*;
    use BusinessRegion::*;
    HashMap::from_iter([
      ((GenshinImpact, Official), &BIZ_GENSHIN_IMPACT_OFFICIAL),
      ((GenshinImpact, Global), &BIZ_GENSHIN_IMPACT_GLOBAL),
      ((HonkaiStarRail, Official), &BIZ_HONKAI_STAR_RAIL_OFFICIAL),
      ((HonkaiStarRail, Global), &BIZ_HONKAI_STAR_RAIL_GLOBAL),
      ((ZenlessZoneZero, Official), &BIZ_ZENLESS_ZONE_ZERO_OFFICIAL),
      ((ZenlessZoneZero, Global), &BIZ_ZENLESS_ZONE_ZERO_GLOBAL),
    ])
  });

impl BizInternals {
  pub fn mapped(business: Business, region: BusinessRegion) -> &'static Self {
    BIZ_INTERNALS
      .get(&(business, region))
      .unwrap_or_else(|| panic!("No biz internal mapping value with key: {business}.{region}"))
  }

  pub fn is_official(&self) -> bool {
    matches!(self.region, BusinessRegion::Official)
  }

  #[inline]
  pub fn join_executable_file(&self, folder: impl AsRef<Path>) -> PathBuf {
    let mut executable = folder.as_ref().join(self.executable_name);
    executable.set_extension(env::consts::EXE_EXTENSION);
    executable
  }
}

#[derive(Copy, Clone, Debug, Deserialize, Serialize, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum ServerRegion {
  /// Official: CN, PRODCN
  Official,
  ///
  /// Official: CN, Channel \
  /// Genshin Impact & Honkai: Star Rail only
  ///
  Channel,
  /// Global: Asia
  Asia,
  /// Global: Europe
  Europe,
  /// Global: America
  America,
  /// Global: TW, HK, MO
  Cht,
}

impl ServerRegion {
  pub fn from_uid(business: Business, uid: u32) -> Option<Self> {
    let digits = if uid == 0 {
      return None;
    } else {
      (uid as f64).log10().floor() as u32 + 1
    };

    match (business, digits) {
      (Business::GenshinImpact | Business::HonkaiStarRail, 9 | 10) => {
        let server_digit = (uid / 10_u32.pow(9 - 1)) % 10;
        match server_digit {
          1..=4 => Some(Self::Official),
          5 => Some(Self::Channel),
          6 => Some(Self::America),
          7 => Some(Self::Europe),
          8 => Some(Self::Asia),
          9 => Some(Self::Cht),
          _ => None,
        }
      }
      (Business::ZenlessZoneZero, 8) => Some(Self::Official),
      (Business::ZenlessZoneZero, 10) => {
        let server_digit = (uid / 10_u32.pow(9 - 1)) % 10;
        match server_digit {
          0 => Some(Self::America),
          3 => Some(Self::Asia),
          5 => Some(Self::Europe),
          7 => Some(Self::Cht),
          _ => None,
        }
      }
      _ => None,
    }
  }
}

impl Business {
  #[inline]
  pub fn detect_uid_server_region(&self, uid: u32) -> Option<ServerRegion> {
    ServerRegion::from_uid(*self, uid)
  }

  pub fn detect_uid_business_region(&self, uid: u32) -> Option<BusinessRegion> {
    match self.detect_uid_server_region(uid)? {
      ServerRegion::Official | ServerRegion::Channel => Some(BusinessRegion::Official),
      ServerRegion::Asia | ServerRegion::Europe | ServerRegion::America | ServerRegion::Cht => {
        Some(BusinessRegion::Global)
      }
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_gi_hsr_uids() {
    let cases = [
      (
        vec![1_0000_0000, 2_0000_0000, 3_0000_0000, 4_0000_0000],
        ServerRegion::Official,
      ),
      (vec![5_0000_0000, 15_0000_0000], ServerRegion::Channel),
      (vec![6_0000_0000, 16_0000_0000], ServerRegion::America),
      (vec![7_0000_0000, 17_0000_0000], ServerRegion::Europe),
      (vec![8_0000_0000, 18_0000_0000], ServerRegion::Asia),
      (vec![9_0000_0000, 19_0000_0000], ServerRegion::Cht),
    ];

    for (uids, expected_region) in cases {
      for uid in uids {
        assert_eq!(
          Business::GenshinImpact.detect_uid_server_region(uid),
          Some(expected_region)
        );
        assert_eq!(
          Business::HonkaiStarRail.detect_uid_server_region(uid),
          Some(expected_region)
        );
      }
    }
  }

  #[test]
  fn test_zzz_uids() {
    let cases = [
      (
        vec![1000_0000, 2000_0000, 3000_0000, 4000_0000],
        ServerRegion::Official,
      ),
      (vec![10_0000_0000], ServerRegion::America),
      (vec![13_0000_0000], ServerRegion::Asia),
      (vec![15_0000_0000], ServerRegion::Europe),
      (vec![17_0000_0000], ServerRegion::Cht),
    ];

    for (uids, expected_region) in cases {
      for uid in uids {
        assert_eq!(
          Business::ZenlessZoneZero.detect_uid_server_region(uid),
          Some(expected_region)
        );
      }
    }
  }
}
