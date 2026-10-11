use crate::{Game, GameServer, Gamebiz, Server};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum GachaLogEndpoint {
  // All
  Standard,
  /// Only the `Genshin Impact: Miliastra Wonderland` Ode banners.
  Hk4eBeyond,
  /// Only the `Honkai: Star Rail` Collaboration banners.
  HkrpgCollab,
  // /// Only the `Honkai: Star Rail` Blind Box banner.
  // HkrpgBlindBox,
}

pub trait GachaLogEndpointProvider {
  /// Returns the `endpoint` URL for this `provider`.
  fn gacha_log_endpoint(&self, endpoint: GachaLogEndpoint) -> Option<&'static str>;
}

pub const HK4E_OFFICIAL_STANDARD: &str =
  "https://public-operation-hk4e.mihoyo.com/gacha_info/api/getGachaLog";
pub const HK4E_OFFICIAL_BEYOND: &str =
  "https://public-operation-hk4e.mihoyo.com/gacha_info/api/getBeyondGachaLog";
pub const HK4E_OVERSEA_STANDARD: &str =
  "https://public-operation-hk4e-sg.hoyoverse.com/gacha_info/api/getGachaLog";
pub const HK4E_OVERSEA_BEYOND: &str =
  "https://public-operation-hk4e-sg.hoyoverse.com/gacha_info/api/getBeyondGachaLog";

pub const HKRPG_OFFICIAL_STANDARD: &str =
  "https://public-operation-hkrpg.mihoyo.com/common/hkrpg_gacha_record/api/getGachaLog";
pub const HKRPG_OFFICIAL_COLLAB: &str =
  "https://public-operation-hkrpg.mihoyo.com/common/hkrpg_gacha_record/api/getLdGachaLog";
// pub const HKRPG_OFFICIAL_BLIND_BOX: &str =
//   "https://public-operation-hkrpg.mihoyo.com/common/hkrpg_gacha_record/api/getBlindBoxLog";
pub const HKRPG_OVERSEA_STANDARD: &str =
  "https://public-operation-hkrpg-sg.hoyoverse.com/common/hkrpg_gacha_record/api/getGachaLog";
pub const HKRPG_OVERSEA_COLLAB: &str =
  "https://public-operation-hkrpg-sg.hoyoverse.com/common/hkrpg_gacha_record/api/getLdGachaLog";
// pub const HKRPG_OVERSEA_BLIND_BOX: &str =
//   "https://public-operation-hkrpg-sg.hoyoverse.com/common/hkrpg_gacha_record/api/getBlindBoxLog";

pub const NAP_OFFICIAL_STANDARD: &str =
  "https://public-operation-nap.mihoyo.com/common/gacha_record/api/getGachaLog";
pub const NAP_OVERSEA_STANDARD: &str =
  "https://public-operation-nap-sg.hoyoverse.com/common/gacha_record/api/getGachaLog";

impl GachaLogEndpointProvider for (Game, Server) {
  fn gacha_log_endpoint(&self, endpoint: GachaLogEndpoint) -> Option<&'static str> {
    match ((self.0, self.1), endpoint) {
      ((Game::Hk4e, Server::Official), GachaLogEndpoint::Standard) => Some(HK4E_OFFICIAL_STANDARD),
      ((Game::Hk4e, Server::Official), GachaLogEndpoint::Hk4eBeyond) => Some(HK4E_OFFICIAL_BEYOND),
      ((Game::Hk4e, Server::Oversea), GachaLogEndpoint::Standard) => Some(HK4E_OVERSEA_STANDARD),
      ((Game::Hk4e, Server::Oversea), GachaLogEndpoint::Hk4eBeyond) => Some(HK4E_OVERSEA_BEYOND),
      ((Game::Hkrpg, Server::Official), GachaLogEndpoint::Standard) => {
        Some(HKRPG_OFFICIAL_STANDARD)
      }
      ((Game::Hkrpg, Server::Official), GachaLogEndpoint::HkrpgCollab) => {
        Some(HKRPG_OFFICIAL_COLLAB)
      }
      // ((Game::Hkrpg, Server::Official), GachaLogEndpoint::HkrpgBlindBox) => {
      //   Some(HKRPG_OFFICIAL_BLIND_BOX)
      // }
      ((Game::Hkrpg, Server::Oversea), GachaLogEndpoint::Standard) => Some(HKRPG_OVERSEA_STANDARD),
      ((Game::Hkrpg, Server::Oversea), GachaLogEndpoint::HkrpgCollab) => Some(HKRPG_OVERSEA_COLLAB),
      // ((Game::Hkrpg, Server::Oversea), GachaLogEndpoint::HkrpgBlindBox) => {
      //   Some(HKRPG_OVERSEA_BLIND_BOX)
      // }
      ((Game::Nap, Server::Official), GachaLogEndpoint::Standard) => Some(NAP_OFFICIAL_STANDARD),
      ((Game::Nap, Server::Oversea), GachaLogEndpoint::Standard) => Some(NAP_OVERSEA_STANDARD),
      _ => None,
    }
  }
}

impl GachaLogEndpointProvider for GameServer {
  fn gacha_log_endpoint(&self, endpoint: GachaLogEndpoint) -> Option<&'static str> {
    (self.game, self.server).gacha_log_endpoint(endpoint)
  }
}

impl GachaLogEndpointProvider for Gamebiz {
  fn gacha_log_endpoint(&self, endpoint: GachaLogEndpoint) -> Option<&'static str> {
    (self.inner.game, self.inner.server).gacha_log_endpoint(endpoint)
  }
}
