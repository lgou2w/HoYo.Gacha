use std::collections::{HashMap, HashSet};

use time::macros::datetime;

use crate::def::bake;
use crate::raw::{RawMetadata, RawMetadataBusiness};
use crate::raw::{RawMetadataBanner, RawMetadataCategorization, RawMetadataI18n};

macro_rules! raw_metadata {
  (
    $(
      {
        id: $id:expr,
        categories: [
          $(
            {
              category: $cat:expr,
              entries: [ $( ($item_id:expr, $rank:expr) ),* $(,)? ],
              i18n: {
                $(
                  $locale:expr => {
                    category: $i18n_cat:expr,
                    entries: [ $( $i18n_entry:expr ),* $(,)? ]
                  }
                ),* $(,)?
              }
            }
          ),* $(,)?
        ],
        banners: [
          $(
            {
              gacha_type: $gacha_type:expr,
              start_time: $start_time:expr,
              end_time: $end_time:expr,
              up_golden: [$($golden:expr),* $(,)? ],
              up_purple: [$($purple:expr),* $(,)? ],
              version: $version:expr
            }
          ),* $(,)?
        ]
      }
    ),* $(,)?
  ) => {{
    let mut out: Vec<RawMetadataBusiness> = Vec::new();

    $(
      let mut categories_vec: Vec<RawMetadataCategorization> = Vec::new();
      $(
        let mut i18n_map: HashMap<String, RawMetadataI18n> = HashMap::new();
        $(
          let i18n_entries = vec![$($i18n_entry.to_string()),*];
          i18n_map.insert(
            $locale.to_string(),
            RawMetadataI18n {
              category: $i18n_cat.to_string(),
              entries: i18n_entries,
            },
          );
        )*

        categories_vec.push(RawMetadataCategorization {
          category: $cat.to_string(),
          entries: vec![$( ($item_id as u32, $rank as u8) ),*],
          i18n: i18n_map,
        });
      )*

      let mut banners_vec: Vec<RawMetadataBanner> = Vec::new();
      $(
        banners_vec.push(RawMetadataBanner {
          gacha_type: $gacha_type as u32,
          start_time: $start_time,
          end_time: $end_time,
          up_golden: HashSet::from_iter([$($golden),*]),
          up_purple: HashSet::from_iter([$($purple),*]),
          version: $version,
        });
      )*

      out.push(RawMetadataBusiness {
        id: $id,
        categories: categories_vec,
        banners: banners_vec,
      });
    )*

    RawMetadata::from(out)
  }};
}

#[test]
fn test_bake_metadata() {
  let raw: RawMetadata = raw_metadata!({
    id: 0,
    categories: [
      {
        category: "Character",
        entries: [
          (10000002, 5),
          (10000003, 5),
          (10000005, 5),
          (10000007, 5),
        ],
        i18n: {
          "en-us" => {
            category: "Character",
            entries: [
              "Kamisato Ayaka",
              "Jean",
              "Traveler",
              "Traveler"
            ]
          },
          "zh-cn" => {
            category: "角色",
            entries: [
              "神里绫华",
              "琴",
              "旅行者",
              "旅行者"
            ]
          },
        }
      },
      {
        category: "Weapon",
        entries: [
          (11509, 5)
        ],
        i18n: {
          "en-us" => {
            category: "Weapon",
            entries: ["Mistsplitter Reforged"]
          },
          "zh-cn" => {
            category: "武器",
            entries: ["雾切之回光"]
          },
        }
      }
    ],
    banners: [
      {
        gacha_type: 100,
        start_time: datetime!(2020-09-15 06:00:00 +08:00),
        end_time: datetime!(9999-12-31 23:59:59 +08:00),
        up_golden: [],
        up_purple: [],
        version: None
      },
    ]
  });

  let baked = bake(raw).unwrap();

  assert!(baked.locale(0, "en-us").is_some());
  assert!(baked.locale(0, "zh-cn").is_some());

  // TODO: more asserts
}
