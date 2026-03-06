use crate::{Game, GameBiz};

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct Uid {
  // Avoid manual construction
  pub(crate) biz: &'static GameBiz,
  pub(crate) v: u32,
}

impl Uid {
  #[inline]
  pub const fn game_biz(&self) -> &'static GameBiz {
    self.biz
  }

  #[inline]
  pub const fn value(&self) -> u32 {
    self.v
  }
}

impl Uid {
  /// Checks if the given `uid` number is valid for the specified `game`.
  #[inline]
  pub const fn is_valid(game: Game, uid: u32) -> bool {
    Self::validate(game, uid).is_some()
  }

  /// Validates and constructs a `Uid` from the given `game` and `uid` number.
  ///
  /// Returns `None` if the `uid` is invalid for the specified game.
  pub const fn validate(game: Game, uid: u32) -> Option<Self> {
    // Count the number of digits in the UID
    let digits = if uid == 0 {
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

      digits(uid)
    };

    let biz = match (game, digits) {
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
      (Game::Hk4e, 9 | 10) => match (uid / 10_u32.pow(9 - 1)) % 10 {
        1..=4 => &GameBiz::HK4E_CN_GF01,
        5 => &GameBiz::HK4E_CN_QD01,
        6 => &GameBiz::HK4E_GLOBAL_USA,
        7 => &GameBiz::HK4E_GLOBAL_EURO,
        8 => &GameBiz::HK4E_GLOBAL_ASIA,
        9 => &GameBiz::HK4E_GLOBAL_CHT,
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
      (Game::Hkrpg, 9 | 10) => match (uid / 10_u32.pow(9 - 1)) % 10 {
        1..=4 => &GameBiz::HKRPG_CN_GF,
        5 => &GameBiz::HKRPG_CN_QD,
        6 => &GameBiz::HKRPG_GLOBAL_USA,
        7 => &GameBiz::HKRPG_GLOBAL_EURO,
        8 => &GameBiz::HKRPG_GLOBAL_ASIA,
        9 => &GameBiz::HKRPG_GLOBAL_CHT,
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
        &GameBiz::NAP_CN
      }

      // Zenless Zone Zero
      // 10-digit UID: 1 7 0000 0000
      //               ↑ ↑
      //               │ └── Region digit (2nd position)
      //               └── Currently observed as 1, but not confirmed to be fixed.
      //                   FIXME: May need adaptation if other starting digits appear.
      (Game::Nap, 10) => match (uid / 10_u32.pow(9 - 1)) % 10 {
        0 => &GameBiz::NAP_GLOBAL_US,
        3 => &GameBiz::NAP_GLOBAL_JP,
        5 => &GameBiz::NAP_GLOBAL_EU,
        7 => &GameBiz::NAP_GLOBAL_SG,
        _ => return None,
      },

      // Unsupported game or invalid digit count
      _ => return None,
    };

    Some(Self { biz, v: uid })
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  macro_rules! valid_case {
    ($game:ident, $uid:expr, $expected_biz:ident) => {
      assert!(
        Uid::is_valid(Game::$game, $uid),
        "UID {} should be valid for {:?}",
        $uid,
        Game::$game
      );
      let uid = Uid::validate(Game::$game, $uid).unwrap();
      assert_eq!(uid.biz, &GameBiz::$expected_biz);
      assert_eq!(uid.v, $uid);
    };
  }

  macro_rules! invalid_case {
    ($game:ident, $uid:expr) => {
      assert!(
        !Uid::is_valid(Game::$game, $uid),
        "UID {} should be invalid for {:?}",
        $uid,
        Game::$game
      );
      assert!(
        Uid::validate(Game::$game, $uid).is_none(),
        "UID {} should return None for {:?}",
        $uid,
        Game::$game
      );
    };
  }

  #[test]
  fn test_genshin_impact() {
    // Valid 9-digit UIDs
    valid_case! { Hk4e, 100_000_000, HK4E_CN_GF01 }
    valid_case! { Hk4e, 200_000_000, HK4E_CN_GF01 }
    valid_case! { Hk4e, 500_000_000, HK4E_CN_QD01 }
    valid_case! { Hk4e, 600_000_000, HK4E_GLOBAL_USA }
    valid_case! { Hk4e, 700_000_000, HK4E_GLOBAL_EURO }
    valid_case! { Hk4e, 800_000_000, HK4E_GLOBAL_ASIA }
    valid_case! { Hk4e, 900_000_000, HK4E_GLOBAL_CHT }

    // Valid 10-digit UIDs
    valid_case! { Hk4e, 1_100_000_000, HK4E_CN_GF01 }
    valid_case! { Hk4e, 1_500_000_000, HK4E_CN_QD01 }
    valid_case! { Hk4e, 1_600_000_000, HK4E_GLOBAL_USA }
    valid_case! { Hk4e, 1_800_000_000, HK4E_GLOBAL_ASIA }

    // Invalid UIDs
    invalid_case! { Hk4e, 0 }
    invalid_case! { Hk4e, 12_345_678 } // 8-digit
    invalid_case! { Hk4e, 1_000_000_000 } // 10-digit invalid region 0
  }

  #[test]
  fn test_honkai_star_rail() {
    // Valid 9-digit UIDs
    valid_case! { Hkrpg, 100_000_000, HKRPG_CN_GF }
    valid_case! { Hkrpg, 500_000_000, HKRPG_CN_QD }
    valid_case! { Hkrpg, 600_000_000, HKRPG_GLOBAL_USA }
    valid_case! { Hkrpg, 700_000_000, HKRPG_GLOBAL_EURO }
    valid_case! { Hkrpg, 800_000_000, HKRPG_GLOBAL_ASIA }
    valid_case! { Hkrpg, 900_000_000, HKRPG_GLOBAL_CHT }

    // Valid 10-digit UIDs
    valid_case! { Hkrpg, 1_100_000_000, HKRPG_CN_GF }
    valid_case! { Hkrpg, 1_500_000_000, HKRPG_CN_QD }
    valid_case! { Hkrpg, 1_600_000_000, HKRPG_GLOBAL_USA }
    valid_case! { Hkrpg, 1_800_000_000, HKRPG_GLOBAL_ASIA }

    // Invalid UIDs
    invalid_case! { Hkrpg, 0 }
    invalid_case! { Hkrpg, 12_345_678 } // 8-digit
    invalid_case! { Hkrpg, 1_000_000_000 } // 10-digit invalid region 0
  }

  #[test]
  fn test_zenless_zone_zero() {
    // Valid 8-digit UIDs (all CN official)
    valid_case! { Nap, 10_000_000, NAP_CN }
    valid_case! { Nap, 12_345_678, NAP_CN }
    valid_case! { Nap, 99_999_999, NAP_CN }

    // Valid 10-digit UIDs
    valid_case! { Nap, 1_000_000_000, NAP_GLOBAL_US }
    valid_case! { Nap, 1_300_000_000, NAP_GLOBAL_JP }
    valid_case! { Nap, 1_500_000_000, NAP_GLOBAL_EU }
    valid_case! { Nap, 1_700_000_000, NAP_GLOBAL_SG }

    // Invalid UIDs
    invalid_case! { Nap, 0 }
    invalid_case! { Nap, 1_234_567 } // 7-digit
    invalid_case! { Nap, 123_456_789 } // 9-digit (unsupported)
    invalid_case! { Nap, 1_100_000_000 } // 10-digit invalid region 1
    invalid_case! { Nap, 1_200_000_000 } // 10-digit invalid region 2
    invalid_case! { Nap, 1_400_000_000 } // 10-digit invalid region 4
    invalid_case! { Nap, 1_600_000_000 } // 10-digit invalid region 6
    invalid_case! { Nap, 1_800_000_000 } // 10-digit invalid region 8
    invalid_case! { Nap, 1_900_000_000 } // 10-digit invalid region 9
  }

  #[test]
  fn test_common_invalid_cases() {
    // Test zero UID for all games
    invalid_case! { Hk4e, 0 }
    invalid_case! { Hkrpg, 0 }
    invalid_case! { Nap, 0 }

    // Test wrong digit lengths
    invalid_case! { Hk4e, 1_234_567 } // 7-digit
    invalid_case! { Hk4e, 123 } // 3-digit
    invalid_case! { Hkrpg, 1_234_567 } // 7-digit
    invalid_case! { Hkrpg, 12_345 } // 5-digit
    invalid_case! { Nap, 123_456 } // 6-digit
    invalid_case! { Nap, 1_234 } // 4-digit
  }

  #[test]
  fn test_uid_properties() {
    // Test that Uid struct properties are correctly set for each game
    let test_cases = [
      (Game::Hk4e, 100_000_000, GameBiz::HK4E_CN_GF01),
      (Game::Hkrpg, 600_000_000, GameBiz::HKRPG_GLOBAL_USA),
      (Game::Nap, 10_000_000, GameBiz::NAP_CN),
    ];

    for (game, v, expected_biz) in test_cases {
      let uid = Uid::validate(game, v).unwrap();
      assert_eq!(uid.biz, &expected_biz);
      assert_eq!(uid.v, v);
    }
  }
}
