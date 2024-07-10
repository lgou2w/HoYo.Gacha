use std::borrow::Cow;
use std::collections::HashMap;

use paste::paste;
use serde::Deserialize;

use crate::gacha::dict::{
  Category, GachaDictionary, GachaDictionaryEntry, GachaDictionaryEntryItemId,
};
use crate::models::Business;

fn read_dictionaries<'a>(
  lang: &'a str,
  bytes: &'a [u8],
) -> Result<HashMap<Cow<'a, str>, GachaDictionaryEntry<'a>>, serde_json::Error> {
  // {
  //   "category": "character",
  //   "category_name": "角色",
  //   "entries": {
  //     "神里绫华": ["10000002", 5],
  //     "旅行者": [["10000005", "10000007"], 5]
  //   }
  // }
  // {
  //   "category": "weapon",
  //   "category_name": "武器",
  //   "entries": {
  //     "雾切之回光": ["11509", 5]
  //   }
  // }
  #[derive(Deserialize)]
  struct DictionaryObject<'a> {
    category: Category,
    category_name: &'a str,
    entries: HashMap<Cow<'a, str>, (GachaDictionaryEntryItemId<'a>, u8)>,
  }

  let objects: Vec<DictionaryObject> = serde_json::from_slice(bytes)?;

  let total = objects.iter().map(|object| object.entries.len()).sum();
  let mut entries = HashMap::with_capacity(total);

  for object in objects {
    #[cfg(debug_assertions)]
    debug_assert!(!object.category_name.is_empty());

    for (item_name, (item_id, rank_type)) in object.entries {
      #[cfg(debug_assertions)]
      debug_assert!(!item_name.is_empty());

      entries.insert(
        item_name.clone(),
        GachaDictionaryEntry {
          lang,
          category: object.category.clone(),
          category_name: object.category_name,
          item_name,
          item_id,
          rank_type,
        },
      );
    }
  }

  Ok(entries)
}

macro_rules! embedded {
  ($(
    $embedded:ident {
      $business:ident,
      $(
        $field:ident = $lang:literal -> $file:literal
      ),*
    }
  ),*) => {
    paste! {
      $(
        pub mod $embedded {
          use once_cell::sync::Lazy;
          use tracing::info;

          use crate::gacha::dict::GachaDictionary;
          use crate::gacha::dict::embedded::read_dictionaries;
          use crate::models::Business;

          pub const BUSINESS: &'static Business = &Business::$business;

          $(
            pub static [<LANG_ $field>]: Lazy<GachaDictionary> = Lazy::new(|| {
              info!(
                message = "Initialize the embedded dictionary file...",
                business = %Business::$business,
                lang = $lang,
                file = $file
              );

              let entries = read_dictionaries($lang, &include_bytes!($file)[..])
                .expect("Error initializing embedded dictionary file");

              GachaDictionary::new(entries)
            });
          )*

          /// `cfg(test)`: Dereference, triggering lazy load
          #[cfg(test)]
          pub fn validation_lazy_read() {
            $(
              let _ = *[<LANG_ $field>];
            )*
          }
        }
      )*

      pub fn dictionary(
        business: &Business,
        lang: &str
      ) -> Option<&'static GachaDictionary<'static>> {
        match business {
          $(
            $embedded::BUSINESS => {
              match lang {
                $($lang => Some(&$embedded::[<LANG_ $field>]),)*
                _ => None
              }
            },
          )*
        }
      }
    }
  };
}

embedded!(
  genshin_impact {
    GenshinImpact,
    ZH_CHS = "zh-cn" -> "./genshin_impact/zh-chs.json",
    ZH_CHT = "zh-tw" -> "./genshin_impact/zh-cht.json",
    DE_DE  = "de-de" -> "./genshin_impact/de-de.json",
    EN_US  = "en-us" -> "./genshin_impact/en-us.json",
    ES_ES  = "es-es" -> "./genshin_impact/es-es.json",
    FR_FR  = "fr-fr" -> "./genshin_impact/fr-fr.json",
    ID_ID  = "id-id" -> "./genshin_impact/id-id.json",
    IT_IT  = "it-it" -> "./genshin_impact/it-it.json",
    JA_JP  = "ja-jp" -> "./genshin_impact/ja-jp.json",
    KO_KR  = "ko-kr" -> "./genshin_impact/ko-kr.json",
    PT_PT  = "pt-pt" -> "./genshin_impact/pt-pt.json",
    RU_RU  = "ru-ru" -> "./genshin_impact/ru-ru.json",
    TH_TH  = "th-th" -> "./genshin_impact/th-th.json",
    TR_TR  = "tr-tr" -> "./genshin_impact/tr-tr.json",
    VI_VN  = "vi-vn" -> "./genshin_impact/vi-vn.json"
  },
  honkai_star_rail {
    HonkaiStarRail,
    ZH_CHS = "zh-cn" -> "./honkai_star_rail/zh-chs.json",
    ZH_CHT = "zh-tw" -> "./honkai_star_rail/zh-cht.json",
    DE_DE  = "de-de" -> "./honkai_star_rail/de-de.json",
    EN_US  = "en-us" -> "./honkai_star_rail/en-us.json",
    ES_ES  = "es-es" -> "./honkai_star_rail/es-es.json",
    FR_FR  = "fr-fr" -> "./honkai_star_rail/fr-fr.json",
    ID_ID  = "id-id" -> "./honkai_star_rail/id-id.json",
    JA_JP  = "ja-jp" -> "./honkai_star_rail/ja-jp.json",
    // Regexp: \{RUBY_(B|E)[^}]*(?=\})\}
    // JA_JP_RUBY = "ja-jp-ruby" -> "./honkai_star_rail/ja-jp-ruby.json",
    KO_KR  = "ko-kr" -> "./honkai_star_rail/ko-kr.json",
    PT_PT  = "pt-pt" -> "./honkai_star_rail/pt-pt.json",
    RU_RU  = "ru-ru" -> "./honkai_star_rail/ru-ru.json",
    TH_TH  = "th-th" -> "./honkai_star_rail/th-th.json",
    VI_VN  = "vi-vn" -> "./honkai_star_rail/vi-vn.json"
  },
  zenless_zone_zero {
    ZenlessZoneZero,
    // TODO: Embedded
  }
);

pub fn name(
  business: &Business,
  lang: &str,
  item_name: &str,
) -> Option<&'static GachaDictionaryEntry<'static>> {
  dictionary(business, lang).and_then(|dictionary| dictionary.name(item_name))
}

pub fn id(
  business: &Business,
  lang: &str,
  item_id: &str,
) -> Option<&'static GachaDictionaryEntry<'static>> {
  dictionary(business, lang).and_then(|dictionary| dictionary.id(item_id))
}

// Tests

#[cfg(test)]
mod tests {
  use crate::models::Business;

  #[test]
  fn test_lazy_read() {
    assert_eq!(super::genshin_impact::BUSINESS, &Business::GenshinImpact);
    assert_eq!(super::honkai_star_rail::BUSINESS, &Business::HonkaiStarRail);
    super::genshin_impact::validation_lazy_read();
    super::honkai_star_rail::validation_lazy_read();
  }
}
