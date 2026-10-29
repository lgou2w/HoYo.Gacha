macro_rules! str_consts {
  ($($name:ident: $s:expr,)*) => {
    // Don't export
    $(const $name: &str = $s;)*
  }
}

// Strings constants. (sort by alphabet)
str_consts! {
  CN_GF01            : "cn_gf01",
  CN_QD01            : "cn_qd01",
  HK4E               : "hk4e",
  HK4E_CN            : "hk4e_cn",
  HK4E_CN_BIN        : "YuanShen",
  HK4E_CN_DATA       : "YuanShen_Data",
  HK4E_CN_NAME       : "原神",
  HK4E_GLOBAL        : "hk4e_global",
  HK4E_GLOBAL_BIN    : "GenshinImpact",
  HK4E_GLOBAL_DATA   : "GenshinImpact_Data",
  HK4E_GLOBAL_NAME   : "Genshin Impact",
  HKRPG              : "hkrpg",
  HKRPG_CN           : "hkrpg_cn",
  HKRPG_CN_BIN       : "StarRail",
  HKRPG_CN_DATA      : "StarRail_Data",
  HKRPG_CN_NAME      : "崩坏：星穹铁道",
  HKRPG_GLOBAL       : "hkrpg_global",
  HKRPG_GLOBAL_BIN   : HKRPG_CN_BIN,
  HKRPG_GLOBAL_DATA  : HKRPG_CN_DATA,
  HKRPG_GLOBAL_NAME  : "Honkai: Star Rail",
  NAP                : "nap",
  NAP_CN             : "nap_cn",
  NAP_CN_BIN         : "ZenlessZoneZero",
  NAP_CN_DATA        : "ZenlessZoneZero_Data",
  NAP_CN_NAME        : "绝区零",
  NAP_GLOBAL         : "nap_global",
  NAP_GLOBAL_BIN     : NAP_CN_BIN,
  NAP_GLOBAL_DATA    : NAP_CN_DATA,
  NAP_GLOBAL_NAME    : "Zenless Zone Zero",
  OFFICIAL           : "official",
  OS_ASIA            : "os_asia",
  OS_CHT             : "os_cht",
  OS_EURO            : "os_euro",
  OS_USA             : "os_usa",
  OVERSEA            : "oversea",
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

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum Game {
  /// `Genshin Impact`
  Hk4e,
  /// `Honkai: Star Rail`
  Hkrpg,
  /// `Zenless Zone Zero`
  Nap,
}

impl Game {
  /// Returns the `codename` of this `Game`.
  #[inline]
  pub const fn as_str(&self) -> &'static str {
    match self {
      Self::Hk4e => HK4E,
      Self::Hkrpg => HKRPG,
      Self::Nap => NAP,
    }
  }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum Server {
  /// Official (CN)
  Official,
  /// Global
  Oversea,
}

impl Server {
  /// Returns the `codename` of this `Server`.
  #[inline]
  pub const fn as_str(&self) -> &'static str {
    match self {
      Self::Official => OFFICIAL,
      Self::Oversea => OVERSEA,
    }
  }
}

/// A struct that represents a combination of `Game` and `Server`, providing a unique identifier for each game-server pair.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct GameServer {
  pub(crate) game: Game,
  pub(crate) server: Server,
}

macro_rules! impl_game_servers {
  ($($name:ident => $game:ident, $server:ident),*,) => {
    $(
      pub const $name: GameServer = GameServer {
        game: Game::$game,
        server: Server::$server,
      };
    )*
  };
}

impl GameServer {
  // Define constants for each combination of Game and Server
  impl_game_servers! {
    // 'Genshin Impact' variants
    HK4E_CN      => Hk4e, Official,
    HK4E_GLOBAL  => Hk4e, Oversea,

    // 'Honkai: Star Rail' variants
    HKRPG_CN     => Hkrpg, Official,
    HKRPG_GLOBAL => Hkrpg, Oversea,

    // 'Zenless Zone Zero' variants
    NAP_CN       => Nap, Official,
    NAP_GLOBAL   => Nap, Oversea,
  }

  #[inline]
  pub const fn game(&self) -> Game {
    self.game
  }

  #[inline]
  pub const fn server(&self) -> Server {
    self.server
  }

  #[inline]
  pub const fn is_hk4e(&self) -> bool {
    matches!(self.game, Game::Hk4e)
  }

  #[inline]
  pub const fn is_hkrpg(&self) -> bool {
    matches!(self.game, Game::Hkrpg)
  }

  #[inline]
  pub const fn is_nap(&self) -> bool {
    matches!(self.game, Game::Nap)
  }

  #[inline]
  pub const fn is_official(&self) -> bool {
    matches!(self.server, Server::Official)
  }

  #[inline]
  pub const fn is_oversea(&self) -> bool {
    matches!(self.server, Server::Oversea)
  }

  /// Returns the `codename` of this `GameServer`.
  #[inline]
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

  /// Returns the display name of this `GameServer`.
  #[inline]
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

  /// Returns the binary executable name of this `GameServer`. (Without extension)
  #[inline]
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

  /// Returns the game data folder name of the game installed for this `GameServer`.
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

  /// Resolves a `GameServer` instance based on the provided `codename`.
  pub fn resolve(codename: &str) -> Option<Self> {
    match codename {
      // 'Genshin Impact'
      HK4E_CN => Some(Self::HK4E_CN),
      HK4E_GLOBAL => Some(Self::HK4E_GLOBAL),

      // 'Honkai: Star Rail'
      HKRPG_CN => Some(Self::HKRPG_CN),
      HKRPG_GLOBAL => Some(Self::HKRPG_GLOBAL),

      // 'Zenless Zone Zero'
      NAP_CN => Some(Self::NAP_CN),
      NAP_GLOBAL => Some(Self::NAP_GLOBAL),

      _ => None,
    }
  }
}

#[cfg(not(feature = "timezone"))]
pub const TIMEZONE_COMMON: i8 = 8;
#[cfg(not(feature = "timezone"))]
pub const TIMEZONE_EUROPE: i8 = 1;
#[cfg(not(feature = "timezone"))]
pub const TIMEZONE_AMERICA: i8 = -5;

#[cfg(feature = "timezone")]
pub const TIMEZONE_COMMON: time::UtcOffset = time::macros::offset!(+8);
#[cfg(feature = "timezone")]
pub const TIMEZONE_EUROPE: time::UtcOffset = time::macros::offset!(+1);
#[cfg(feature = "timezone")]
pub const TIMEZONE_AMERICA: time::UtcOffset = time::macros::offset!(-5);

/// A `Gamebiz` instance, with a `region` and `timezone`.
/// The `Gamebiz` struct represents a specific combination of a game, server, region, and timezone. It provides a unique identifier for each game-server pair and includes additional information such as the region and timezone associated with that combination.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct Gamebiz {
  pub(crate) inner: GameServer,
  pub(crate) region: &'static str,
  #[cfg(not(feature = "timezone"))]
  pub(crate) timezone: i8,
  #[cfg(feature = "timezone")]
  pub(crate) timezone: time::UtcOffset,
}

impl std::fmt::Display for Gamebiz {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    f.debug_tuple("Gamebiz") // Tuple, not Struct
      .field(&self.inner.game)
      .field(&self.inner.server)
      .field(&self.region)
      // No timezone field
      .finish()
  }
}

macro_rules! impl_gamebizs {
  ($($name:ident => $inner:ident, $region:expr, $timezone:expr),*,) => {
    $(
      pub const $name: Gamebiz = Gamebiz {
        inner: GameServer::$inner,
        region: $region,
        timezone: $timezone,
      };
    )*
  };
}

impl Gamebiz {
  // Define constants for each combination of GameServer, region, and timezone
  impl_gamebizs! {
    // 'Genshin Impact' variants
    HK4E_CN_GF01     => HK4E_CN,     CN_GF01, TIMEZONE_COMMON,
    HK4E_CN_QD01     => HK4E_CN,     CN_QD01, TIMEZONE_COMMON,
    HK4E_GLOBAL_ASIA => HK4E_GLOBAL, OS_ASIA, TIMEZONE_COMMON,
    HK4E_GLOBAL_EURO => HK4E_GLOBAL, OS_EURO, TIMEZONE_EUROPE,
    HK4E_GLOBAL_USA  => HK4E_GLOBAL, OS_USA,  TIMEZONE_AMERICA,
    HK4E_GLOBAL_CHT  => HK4E_GLOBAL, OS_CHT,  TIMEZONE_COMMON,

    // 'Honkai: Star Rail' variants
    HKRPG_CN_GF       => HKRPG_CN,     PROD_GF_CN,         TIMEZONE_COMMON,
    HKRPG_CN_QD       => HKRPG_CN,     PROD_QD_CN,         TIMEZONE_COMMON,
    HKRPG_GLOBAL_ASIA => HKRPG_GLOBAL, PROD_OFFICIAL_ASIA, TIMEZONE_COMMON,
    HKRPG_GLOBAL_EURO => HKRPG_GLOBAL, PROD_OFFICIAL_EUR,  TIMEZONE_EUROPE,
    HKRPG_GLOBAL_USA  => HKRPG_GLOBAL, PROD_OFFICIAL_USA,  TIMEZONE_AMERICA,
    HKRPG_GLOBAL_CHT  => HKRPG_GLOBAL, PROD_OFFICIAL_CHT,  TIMEZONE_COMMON,

    // 'Zenless Zone Zero' variants
    NAP_CN        => NAP_CN,     PROD_GF_CN, TIMEZONE_COMMON,
    NAP_GLOBAL_JP => NAP_GLOBAL, PROD_GF_JP, TIMEZONE_COMMON, // Asia
    NAP_GLOBAL_EU => NAP_GLOBAL, PROD_GF_EU, TIMEZONE_EUROPE,
    NAP_GLOBAL_US => NAP_GLOBAL, PROD_GF_US, TIMEZONE_AMERICA,
    NAP_GLOBAL_SG => NAP_GLOBAL, PROD_GF_SG, TIMEZONE_COMMON,
  }

  #[inline]
  pub const fn game(&self) -> Game {
    self.inner.game
  }

  #[inline]
  pub const fn server(&self) -> Server {
    self.inner.server
  }

  #[inline]
  pub const fn region(&self) -> &'static str {
    self.region
  }

  #[cfg(not(feature = "timezone"))]
  #[inline]
  pub const fn timezone(&self) -> i8 {
    self.timezone
  }

  #[cfg(feature = "timezone")]
  #[inline]
  pub const fn timezone(&self) -> time::UtcOffset {
    self.timezone
  }

  #[inline]
  pub const fn is_hk4e(&self) -> bool {
    self.inner.is_hk4e()
  }

  #[inline]
  pub const fn is_hkrpg(&self) -> bool {
    self.inner.is_hkrpg()
  }

  #[inline]
  pub const fn is_nap(&self) -> bool {
    self.inner.is_nap()
  }

  #[inline]
  pub const fn is_official(&self) -> bool {
    self.inner.is_official()
  }

  #[inline]
  pub const fn is_oversea(&self) -> bool {
    self.inner.is_oversea()
  }

  #[inline]
  pub const fn codename(&self) -> &'static str {
    self.inner.codename()
  }

  #[inline]
  pub const fn display_name(&self) -> &'static str {
    self.inner.display_name()
  }

  #[inline]
  pub const fn bin_name(&self) -> &'static str {
    self.inner.bin_name()
  }

  #[inline]
  pub const fn data_folder_name(&self) -> &'static str {
    self.inner.data_folder_name()
  }

  /// Resolves a `Gamebiz` instance based on the provided `codename` and `region`.
  pub fn resolve(codename: &str, region: &str) -> Option<Self> {
    match (codename, region) {
      // 'Genshin Impact'
      (HK4E_CN, CN_GF01) => Some(Self::HK4E_CN_GF01),
      (HK4E_CN, CN_QD01) => Some(Self::HK4E_CN_QD01),
      (HK4E_GLOBAL, OS_ASIA) => Some(Self::HK4E_GLOBAL_ASIA),
      (HK4E_GLOBAL, OS_EURO) => Some(Self::HK4E_GLOBAL_EURO),
      (HK4E_GLOBAL, OS_USA) => Some(Self::HK4E_GLOBAL_USA),
      (HK4E_GLOBAL, OS_CHT) => Some(Self::HK4E_GLOBAL_CHT),

      // 'Honkai: Star Rail'
      (HKRPG_CN, PROD_GF_CN) => Some(Self::HKRPG_CN_GF),
      (HKRPG_CN, PROD_QD_CN) => Some(Self::HKRPG_CN_QD),
      (HKRPG_GLOBAL, PROD_OFFICIAL_ASIA) => Some(Self::HKRPG_GLOBAL_ASIA),
      (HKRPG_GLOBAL, PROD_OFFICIAL_EUR) => Some(Self::HKRPG_GLOBAL_EURO),
      (HKRPG_GLOBAL, PROD_OFFICIAL_USA) => Some(Self::HKRPG_GLOBAL_USA),
      (HKRPG_GLOBAL, PROD_OFFICIAL_CHT) => Some(Self::HKRPG_GLOBAL_CHT),

      // 'Zenless Zone Zero'
      (NAP_CN, PROD_GF_CN) => Some(Self::NAP_CN),
      (NAP_GLOBAL, PROD_GF_JP) => Some(Self::NAP_GLOBAL_JP),
      (NAP_GLOBAL, PROD_GF_EU) => Some(Self::NAP_GLOBAL_EU),
      (NAP_GLOBAL, PROD_GF_US) => Some(Self::NAP_GLOBAL_US),
      (NAP_GLOBAL, PROD_GF_SG) => Some(Self::NAP_GLOBAL_SG),

      _ => None,
    }
  }
}
