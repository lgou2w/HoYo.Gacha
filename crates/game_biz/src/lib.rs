#![forbid(unsafe_code)]

use std::fmt;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Game {
  /// 'Genshin Impact'
  Hk4e,
  /// 'Honkai: Star Rail'
  Hkrpg,
  /// 'Zenless Zone Zero'
  Nap,
}

impl Game {
  #[inline]
  pub const fn as_str(&self) -> &'static str {
    match self {
      Self::Hk4e => "hk4e",
      Self::Hkrpg => "hkrpg",
      Self::Nap => "nap",
    }
  }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Server {
  /// CN
  Official,
  /// Global
  Oversea,
}

impl Server {
  #[inline]
  pub const fn as_str(&self) -> &'static str {
    match self {
      Self::Official => "official",
      Self::Oversea => "oversea",
    }
  }
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub struct GameBiz {
  // Avoid manual construction
  pub(crate) game: Game,
  pub(crate) server: Server,
  pub(crate) region: &'static str,
  #[cfg(feature = "timezone")]
  pub(crate) timezone: time::UtcOffset,
  #[cfg(not(feature = "timezone"))]
  pub(crate) timezone: i8,
}

impl fmt::Debug for GameBiz {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.debug_tuple("GameBiz") // Tuple, not Struct
      .field(&self.game)
      .field(&self.server)
      .field(&self.region)
      // No timezone field
      .finish()
  }
}

impl GameBiz {
  #[inline]
  pub const fn game(&self) -> Game {
    self.game
  }

  #[inline]
  pub const fn server(&self) -> Server {
    self.server
  }

  #[inline]
  pub const fn is_official(&self) -> bool {
    matches!(self.server, Server::Official)
  }

  #[inline]
  pub const fn is_oversea(&self) -> bool {
    matches!(self.server, Server::Oversea)
  }

  #[inline]
  pub const fn region(&self) -> &'static str {
    self.region
  }

  #[cfg(feature = "timezone")]
  #[inline]
  pub const fn timezone(&self) -> time::UtcOffset {
    self.timezone
  }

  #[cfg(not(feature = "timezone"))]
  #[inline]
  pub const fn timezone(&self) -> i8 {
    self.timezone
  }
}

macro_rules! impl_dict {
  ($($name:ident: $s:expr,)*) => {
    $(const $name: &str = $s;)*
  }
}

// Strings constants. (sort by alphabet)
//   don't export
impl_dict! {
  CN_GF01            : "cn_gf01",
  CN_QD01            : "cn_qd01",
  HK4E_CN            : "hk4e_cn",
  HK4E_CN_BIN        : "YuanShen",
  HK4E_CN_DATA       : "YuanShen_Data",
  HK4E_CN_NAME       : "原神",
  HK4E_GLOBAL        : "hk4e_global",
  HK4E_GLOBAL_BIN    : "GenshinImpact",
  HK4E_GLOBAL_DATA   : "GenshinImpact_Data",
  HK4E_GLOBAL_NAME   : "Genshin Impact",
  HKRPG_CN           : "hkrpg_cn",
  HKRPG_CN_BIN       : "StarRail",
  HKRPG_CN_DATA      : "StarRail_Data",
  HKRPG_CN_NAME      : "崩坏：星穹铁道",
  HKRPG_GLOBAL       : "hkrpg_global",
  HKRPG_GLOBAL_BIN   : HKRPG_CN_BIN,
  HKRPG_GLOBAL_DATA  : HKRPG_CN_DATA,
  HKRPG_GLOBAL_NAME  : "Honkai: Star Rail",
  NAP_CN             : "nap_cn",
  NAP_CN_BIN         : "ZenlessZoneZero",
  NAP_CN_DATA        : "ZenlessZoneZero_Data",
  NAP_CN_NAME        : "绝区零",
  NAP_GLOBAL         : "nap_global",
  NAP_GLOBAL_BIN     : NAP_CN_BIN,
  NAP_GLOBAL_DATA    : NAP_CN_DATA,
  NAP_GLOBAL_NAME    : "Zenless Zone Zero",
  OS_ASIA            : "os_asia",
  OS_CHT             : "os_cht",
  OS_EURO            : "os_euro",
  OS_USA             : "os_usa",
  PROD_GF_CN         : "prod_gf_cn",
  PROD_GF_JP         : "prod_gf_jp",
  PROD_GF_EU         : "prod_gf_eu",
  PROD_GF_SG         : "prod_gf_sg",
  PROD_GF_US         : "prod_gf_us",
  PROD_OFFICIAL_ASIA : "prod_official_asia",
  PROD_OFFICIAL_CHT  : "prod_official_cht",
  PROD_OFFICIAL_EUR  : "prod_official_eur",
  PROD_OFFICIAL_USA  : "prod_official_usa",
  PROD_QD_CN         : "prod_qd_cn",
}

macro_rules! impl_game_biz {
  ($name:ident { $game:ident, $server:ident, $region:expr, $timezone:expr }) => {
    pub const $name: GameBiz = GameBiz {
      game: Game::$game,
      server: Server::$server,
      region: $region,
      timezone: $timezone,
    };
  };
}

#[cfg(feature = "timezone")]
const TIMEZONE_COMMON: time::UtcOffset = time::macros::offset!(+8);
#[cfg(feature = "timezone")]
const TIMEZONE_EUROPE: time::UtcOffset = time::macros::offset!(+1);
#[cfg(feature = "timezone")]
const TIMEZONE_AMERICA: time::UtcOffset = time::macros::offset!(-5);

#[cfg(not(feature = "timezone"))]
const TIMEZONE_COMMON: i8 = 8;
#[cfg(not(feature = "timezone"))]
const TIMEZONE_EUROPE: i8 = 1;
#[cfg(not(feature = "timezone"))]
const TIMEZONE_AMERICA: i8 = -5;

impl GameBiz {
  // 'Genshin Impact' variants
  impl_game_biz! { HK4E_CN_GF01     { Hk4e, Official, CN_GF01, TIMEZONE_COMMON } }
  impl_game_biz! { HK4E_CN_QD01     { Hk4e, Official, CN_QD01, TIMEZONE_COMMON } }
  impl_game_biz! { HK4E_GLOBAL_ASIA { Hk4e, Oversea,  OS_ASIA, TIMEZONE_COMMON } }
  impl_game_biz! { HK4E_GLOBAL_EURO { Hk4e, Oversea,  OS_EURO, TIMEZONE_EUROPE } }
  impl_game_biz! { HK4E_GLOBAL_USA  { Hk4e, Oversea,  OS_USA, TIMEZONE_AMERICA } }
  impl_game_biz! { HK4E_GLOBAL_CHT  { Hk4e, Oversea,  OS_CHT,  TIMEZONE_COMMON } }

  // 'Honkai: Star Rail' variants
  impl_game_biz! { HKRPG_CN_GF       { Hkrpg, Official, PROD_GF_CN,         TIMEZONE_COMMON } }
  impl_game_biz! { HKRPG_CN_QD       { Hkrpg, Official, PROD_QD_CN,         TIMEZONE_COMMON } }
  impl_game_biz! { HKRPG_GLOBAL_ASIA { Hkrpg, Oversea,  PROD_OFFICIAL_ASIA, TIMEZONE_COMMON } }
  impl_game_biz! { HKRPG_GLOBAL_EURO { Hkrpg, Oversea,  PROD_OFFICIAL_EUR,  TIMEZONE_EUROPE } }
  impl_game_biz! { HKRPG_GLOBAL_USA  { Hkrpg, Oversea,  PROD_OFFICIAL_USA, TIMEZONE_AMERICA } }
  impl_game_biz! { HKRPG_GLOBAL_CHT  { Hkrpg, Oversea,  PROD_OFFICIAL_CHT,  TIMEZONE_COMMON } }

  // 'Zenless Zone Zero' variants
  impl_game_biz! { NAP_CN        { Nap, Official, PROD_GF_CN,  TIMEZONE_COMMON } }
  impl_game_biz! { NAP_GLOBAL_JP { Nap, Official, PROD_GF_JP,  TIMEZONE_COMMON } } // Asia
  impl_game_biz! { NAP_GLOBAL_EU { Nap, Oversea,  PROD_GF_EU,  TIMEZONE_EUROPE } }
  impl_game_biz! { NAP_GLOBAL_US { Nap, Oversea,  PROD_GF_US, TIMEZONE_AMERICA } }
  impl_game_biz! { NAP_GLOBAL_SG { Nap, Oversea,  PROD_GF_SG,  TIMEZONE_COMMON } }
}

impl GameBiz {
  /// Returns the `codename` of this `GameBiz`.
  pub const fn codename(&self) -> &'static str {
    match (self.game, self.server) {
      (Game::Hk4e, Server::Official) => HK4E_CN,
      (Game::Hk4e, Server::Oversea) => HK4E_GLOBAL,
      (Game::Hkrpg, Server::Official) => HKRPG_CN,
      (Game::Hkrpg, Server::Oversea) => HKRPG_GLOBAL,
      (Game::Nap, Server::Official) => NAP_CN,
      (Game::Nap, Server::Oversea) => NAP_GLOBAL,
    }
  }

  /// Finds a `GameBiz` by its `codename` and `region`.
  pub fn from_codename(s: &str, region: &str) -> Option<&'static Self> {
    macro_rules! case {
      ($(($s:pat, $region:pat) => $biz:ident,)*) => {
        match (s, region) {
          $(($s, $region) => Some(&Self::$biz),)*
          _ => None,
        }
      };
    }

    case! {
      // Genshin Impact
      (HK4E_CN    , CN_GF01) => HK4E_CN_GF01,
      (HK4E_CN    , CN_QD01) => HK4E_CN_QD01,
      (HK4E_GLOBAL, OS_ASIA) => HK4E_GLOBAL_ASIA,
      (HK4E_GLOBAL, OS_EURO) => HK4E_GLOBAL_EURO,
      (HK4E_GLOBAL, OS_USA)  => HK4E_GLOBAL_USA,
      (HK4E_GLOBAL, OS_CHT)  => HK4E_GLOBAL_CHT,

      // Honkai: Star Rail
      (HKRPG_CN    , PROD_GF_CN)         => HKRPG_CN_GF,
      (HKRPG_CN    , PROD_QD_CN)         => HKRPG_CN_QD,
      (HKRPG_GLOBAL, PROD_OFFICIAL_ASIA) => HKRPG_GLOBAL_ASIA,
      (HKRPG_GLOBAL, PROD_OFFICIAL_EUR)  => HKRPG_GLOBAL_EURO,
      (HKRPG_GLOBAL, PROD_OFFICIAL_USA)  => HKRPG_GLOBAL_USA,
      (HKRPG_GLOBAL, PROD_OFFICIAL_CHT)  => HKRPG_GLOBAL_CHT,

      // Zenless Zone Zero
      (NAP_CN    , PROD_GF_CN) => NAP_CN,
      (NAP_GLOBAL, PROD_GF_JP) => NAP_GLOBAL_JP,
      (NAP_GLOBAL, PROD_GF_EU) => NAP_GLOBAL_EU,
      (NAP_GLOBAL, PROD_GF_US) => NAP_GLOBAL_US,
      (NAP_GLOBAL, PROD_GF_SG) => NAP_GLOBAL_SG,
    }
  }

  /// Returns the display name of this `GameBiz`.
  pub const fn display_name(&self) -> &'static str {
    match (self.game, self.server) {
      (Game::Hk4e, Server::Official) => HK4E_CN_NAME,
      (Game::Hk4e, Server::Oversea) => HK4E_GLOBAL_NAME,
      (Game::Hkrpg, Server::Official) => HKRPG_CN_NAME,
      (Game::Hkrpg, Server::Oversea) => HKRPG_GLOBAL_NAME,
      (Game::Nap, Server::Official) => NAP_CN_NAME,
      (Game::Nap, Server::Oversea) => NAP_GLOBAL_NAME,
    }
  }

  /// Returns the binary executable name of this `GameBiz`. (Without extension)
  pub const fn bin_name(&self) -> &'static str {
    match (self.game, self.server) {
      (Game::Hk4e, Server::Official) => HK4E_CN_BIN,
      (Game::Hk4e, Server::Oversea) => HK4E_GLOBAL_BIN,
      (Game::Hkrpg, Server::Official) => HKRPG_CN_BIN,
      (Game::Hkrpg, Server::Oversea) => HKRPG_GLOBAL_BIN,
      (Game::Nap, Server::Official) => NAP_CN_BIN,
      (Game::Nap, Server::Oversea) => NAP_GLOBAL_BIN,
    }
  }

  /// Returns the game data folder name of the game installed for this `GameBiz`.
  pub const fn data_folder_name(&self) -> &'static str {
    match (self.game, self.server) {
      (Game::Hk4e, Server::Official) => HK4E_CN_DATA,
      (Game::Hk4e, Server::Oversea) => HK4E_GLOBAL_DATA,
      (Game::Hkrpg, Server::Official) => HKRPG_CN_DATA,
      (Game::Hkrpg, Server::Oversea) => HKRPG_GLOBAL_DATA,
      (Game::Nap, Server::Official) => NAP_CN_DATA,
      (Game::Nap, Server::Oversea) => NAP_GLOBAL_DATA,
    }
  }
}

// Exports
mod api;
mod uid;

pub use api::*;
pub use uid::*;
