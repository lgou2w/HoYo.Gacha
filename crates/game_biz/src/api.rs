#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum GachaLogEndpointType {
  /// All
  Standard,
  /// Only the `Genshin Impact: Miliastra Wonderland` Ode banners.
  Beyond,
  /// Only the `Honkai: Star Rail` Collaboration banners.
  Collaboration,
}

macro_rules! impl_gacha_log_api_endpoints {
  ($((($game:ident, $server:ident), $endpoint:ident) -> $base_url:literal,)*) => {
    impl crate::GameBiz {
      pub const fn gacha_log_api_endpoint(
        &self,
        endpoint_type: GachaLogEndpointType,
      ) -> Option<&'static str> {
        match ((self.game, self.server), endpoint_type) {
          $(
            (
              (crate::Game::$game, crate::Server::$server),
              GachaLogEndpointType::$endpoint
            ) => Some($base_url),
          )*
          _ => None,
        }
      }
    }
  };
}

// Known Gacha Log API endpoints for Game biz
impl_gacha_log_api_endpoints! {
  // 'Genshin Impact'
  ((Hk4e, Official) , Standard)      -> "https://public-operation-hk4e.mihoyo.com/gacha_info/api/getGachaLog",
  ((Hk4e, Oversea)  , Standard)      -> "https://public-operation-hk4e-sg.hoyoverse.com/gacha_info/api/getGachaLog",
  // 'Genshin Impact: Miliastra Wonderland' Ode
  ((Hk4e, Official) , Beyond)        -> "https://public-operation-hk4e.mihoyo.com/gacha_info/api/getBeyondGachaLog",
  ((Hk4e, Oversea)  , Beyond)        -> "https://public-operation-hk4e-sg.hoyoverse.com/gacha_info/api/getBeyondGachaLog",

  // 'Honkai: Star Rail'
  ((Hkrpg, Official), Standard)      -> "https://public-operation-hkrpg.mihoyo.com/common/gacha_record/api/getGachaLog",
  ((Hkrpg, Oversea) , Standard)      -> "https://public-operation-hkrpg-sg.hoyoverse.com/common/gacha_record/api/getGachaLog",
  // 'Honkai: Star Rail' Collaboration
  ((Hkrpg, Official), Collaboration) -> "https://public-operation-hkrpg.mihoyo.com/common/gacha_record/api/getLdGachaLog",
  ((Hkrpg, Oversea) , Collaboration) -> "https://public-operation-hkrpg-sg.hoyoverse.com/common/gacha_record/api/getLdGachaLog",

  // 'Zenless Zone Zero'
  ((Nap, Official)  , Standard)      -> "https://public-operation-nap.mihoyo.com/common/gacha_record/api/getGachaLog",
  ((Nap, Oversea)   , Standard)      -> "https://public-operation-nap-sg.hoyoverse.com/common/gacha_record/api/getGachaLog",
}
