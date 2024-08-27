use std::collections::HashMap;
use std::env;
use std::fmt::{self, Display};
use std::path::{Path, PathBuf};

use num_enum::{IntoPrimitive, TryFromPrimitive};
use once_cell::sync::Lazy;
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
  pub business: &'static Business,
  pub region: &'static BusinessRegion,
  pub codename: &'static str,
  pub display_name: &'static str,
  /// Name of the game's entry executable (without suffix)
  pub executable_name: &'static str,
  pub data_folder_name: &'static str,
}

macro_rules! biz {
  ($business:ident, $region:ident, $codename:literal, $display_name:literal, $executable_name:literal, $data_folder_name:literal) => {
    BizInternals {
      business: &Business::$business,
      region: &BusinessRegion::$region,
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

impl BizInternals {
  pub const GENSHIN_IMPACT_OFFICIAL: &'static Self = &BIZ_GENSHIN_IMPACT_OFFICIAL;
  pub const GENSHIN_IMPACT_GLOBAL: &'static Self = &BIZ_GENSHIN_IMPACT_GLOBAL;
  pub const HONKAI_STAR_RAIL_OFFICIAL: &'static Self = &BIZ_HONKAI_STAR_RAIL_OFFICIAL;
  pub const HONKAI_STAR_RAIL_GLOBAL: &'static Self = &BIZ_HONKAI_STAR_RAIL_GLOBAL;
  pub const ZENLESS_ZONE_ZERO_OFFICIAL: &'static Self = &BIZ_ZENLESS_ZONE_ZERO_OFFICIAL;
  pub const ZENLESS_ZONE_ZERO_GLOBAL: &'static Self = &BIZ_ZENLESS_ZONE_ZERO_GLOBAL;

  #[inline]
  pub fn join_executable_file(&self, folder: impl AsRef<Path>) -> PathBuf {
    let mut executable = folder.as_ref().join(self.executable_name);
    executable.set_extension(env::consts::EXE_EXTENSION);
    executable
  }
}

static BIZ_INTERNALS: Lazy<
  HashMap<(&'static Business, &'static BusinessRegion), &'static BizInternals>,
> = Lazy::new(|| {
  use Business::*;
  use BusinessRegion::*;

  let mut m = HashMap::with_capacity(6);
  m.insert(
    (&GenshinImpact, &Official),
    BizInternals::GENSHIN_IMPACT_OFFICIAL,
  );
  m.insert(
    (&GenshinImpact, &Global),
    BizInternals::GENSHIN_IMPACT_GLOBAL,
  );
  m.insert(
    (&HonkaiStarRail, &Official),
    BizInternals::HONKAI_STAR_RAIL_OFFICIAL,
  );
  m.insert(
    (&HonkaiStarRail, &Global),
    BizInternals::HONKAI_STAR_RAIL_GLOBAL,
  );
  m.insert(
    (&ZenlessZoneZero, &Official),
    BizInternals::ZENLESS_ZONE_ZERO_OFFICIAL,
  );
  m.insert(
    (&ZenlessZoneZero, &Global),
    BizInternals::ZENLESS_ZONE_ZERO_GLOBAL,
  );
  m
});

impl BizInternals {
  pub fn mapped<'a>(business: &'a Business, region: &'a BusinessRegion) -> &'static Self {
    BIZ_INTERNALS
      .get(&(business, region))
      .unwrap_or_else(|| panic!("No biz internal mapping value with key: {business}.{region}"))
  }

  pub fn is_official(&self) -> bool {
    matches!(self.region, BusinessRegion::Official)
  }
}
