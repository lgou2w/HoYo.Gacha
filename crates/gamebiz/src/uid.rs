use crate::{Game, Gamebiz};

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct Uid {
  pub(crate) gamebiz: Gamebiz,
  pub(crate) v: u32,
}

impl Uid {
  #[inline]
  pub const fn gamebiz(&self) -> Gamebiz {
    self.gamebiz
  }

  #[inline]
  pub const fn value(&self) -> u32 {
    self.v
  }
}

impl std::ops::Deref for Uid {
  type Target = u32;

  #[inline]
  fn deref(&self) -> &Self::Target {
    &self.v
  }
}

impl Uid {
  /// Validates and parse a `Uid` from the given `game` and `uid` value.
  ///
  /// Returns `None` if the `uid` value is invalid for the specified game.
  pub const fn parse(game: Game, value: u32) -> Option<Self> {
    // Count the number of digits in the UID
    let digits = if value == 0 {
      return None;
    } else {
      // This inner function counts the digits in a u32 number.
      // It is guaranteed not to be 0.
      #[inline]
      const fn digits(mut n: u32) -> u32 {
        let mut c = 0;
        while n > 0 {
          n /= 10;
          c += 1;
        }
        c
      }

      digits(value)
    };

    let gamebiz = match (game, digits) {
      // Genshin Impact
      // 9-digit UID:  1 0000 0000
      //               ↑
      //               └── Region digit (1st position)
      //
      // 10-digit UID: 1 7 0000 0000
      //               ↑ ↑
      //               │ └── Region digit (2nd position)
      //               └── Currently observed as 1, but not confirmed to be fixed.
      //                   FIXME: May need adaptation if other starting digits appear.
      (Game::Hk4e, 9 | 10) => match (value / 10_u32.pow(9 - 1)) % 10 {
        1..=4 => Gamebiz::HK4E_CN_GF01,
        5 => Gamebiz::HK4E_CN_QD01,
        6 => Gamebiz::HK4E_GLOBAL_USA,
        7 => Gamebiz::HK4E_GLOBAL_EURO,
        8 => Gamebiz::HK4E_GLOBAL_ASIA,
        9 => Gamebiz::HK4E_GLOBAL_CHT,
        _ => return None,
      },

      // Honkai: Star Rail
      //
      // Like Genshin Impact,
      // 9-digit UID:  1 0000 0000
      //               ↑
      //               └── Region digit (1st position)
      //
      // 10-digit UID: 1 7 0000 0000
      //               ↑ ↑
      //               │ └── Region digit (2nd position)
      //               └── Currently observed as 1, but not confirmed to be fixed.
      //                   FIXME: May need adaptation if other starting digits appear.
      (Game::Hkrpg, 9 | 10) => match (value / 10_u32.pow(9 - 1)) % 10 {
        1..=4 => Gamebiz::HKRPG_CN_GF,
        5 => Gamebiz::HKRPG_CN_QD,
        6 => Gamebiz::HKRPG_GLOBAL_USA,
        7 => Gamebiz::HKRPG_GLOBAL_EURO,
        8 => Gamebiz::HKRPG_GLOBAL_ASIA,
        9 => Gamebiz::HKRPG_GLOBAL_CHT,
        _ => return None,
      },

      // Zenless Zone Zero
      // 8-digit UID:  0000 0000
      //               (All are Official CN server)
      //
      // FIXME: Note: 9-digit UID might also be official. Unable to determine at this time,
      //          as the 8-digit limit has not yet been reached.
      (Game::Nap, 8) => {
        // There are no Channel businesses, all are official CN business.
        Gamebiz::NAP_CN
      }

      // Zenless Zone Zero
      // 10-digit UID: 1 7 0000 0000
      //               ↑ ↑
      //               │ └── Region digit (2nd position)
      //               └── Currently observed as 1, but not confirmed to be fixed.
      //                   FIXME: May need adaptation if other starting digits appear.
      (Game::Nap, 10) => match (value / 10_u32.pow(9 - 1)) % 10 {
        0 => Gamebiz::NAP_GLOBAL_US,
        3 => Gamebiz::NAP_GLOBAL_JP,
        5 => Gamebiz::NAP_GLOBAL_EU,
        7 => Gamebiz::NAP_GLOBAL_SG,
        _ => return None,
      },

      // Unsupported game or invalid digit count
      _ => return None,
    };

    Some(Self { gamebiz, v: value })
  }
}
