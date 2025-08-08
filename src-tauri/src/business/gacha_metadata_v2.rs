use std::collections::{HashMap, HashSet, hash_map};
use std::fmt;
use std::str::FromStr;
use std::sync::atomic::AtomicBool;
use std::sync::{Arc, LazyLock, OnceLock, RwLock};
use std::time::Instant;

use serde::{Deserialize, Deserializer, Serialize};
use sha1::{Digest, Sha1};
use time::OffsetDateTime;
use time::serde::rfc3339;
use tracing::info;

use crate::models::{Business, GachaRecord};

// region: Raw Json Metadata

type RawGachaMetadata = Vec<RawGachaMetadataBusiness>;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawGachaMetadataBusiness {
  pub business: Business,
  pub categories: Vec<RawGachaMetadataCategorization>,
  pub banners: Vec<RawGachaMetadataBanner>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawGachaMetadataCategorization {
  pub category: String,
  pub entries: Vec<(u32, u8)>,
  pub i18n: HashMap<String, RawGachaMetadataI18n>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawGachaMetadataI18n {
  pub category: String,
  pub entries: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawGachaMetadataBanner {
  pub gacha_type: u32,
  pub gacha_id: Option<u32>, // 'Honkai: Star Rail' only
  #[serde(with = "rfc3339")]
  pub start_time: OffsetDateTime,
  #[serde(with = "rfc3339")]
  pub end_time: OffsetDateTime,
  pub up_golden: HashSet<u32>,
  pub up_purple: HashSet<u32>,
  pub version: Option<GameVersion>,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct GameVersion {
  pub major: u16,
  pub minor: u16,
}

impl FromStr for GameVersion {
  type Err = String;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    let parts: Vec<&str> = s.split('.').collect();
    if parts.len() != 2 {
      return Err("Invalid game version format".into());
    }

    let major = parts[0]
      .parse()
      .map_err(|_| "Invalid major game version".to_owned())?;
    let minor = parts[1]
      .parse()
      .map_err(|_| "Invalid minor game version".to_owned())?;

    Ok(GameVersion { major, minor })
  }
}

impl fmt::Display for GameVersion {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}.{}", self.major, self.minor)
  }
}

impl Serialize for GameVersion {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::Serializer,
  {
    self.to_string().serialize(serializer)
  }
}

impl<'de> Deserialize<'de> for GameVersion {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: Deserializer<'de>,
  {
    let s = String::deserialize(deserializer)?;
    GameVersion::from_str(&s).map_err(serde::de::Error::custom)
  }
}

// endregion

#[derive(Debug)]
pub struct GachaMetadata {
  pub metadata: HashMap<Business, GachaMetadataBusiness>,
  pub hash: String, // SHA-1
}

#[derive(Debug)]
pub struct GachaMetadataBusiness {
  pub locales: HashMap<String, GachaMetadataLocale>,
  // Banner Groups:
  //   Genshin Impact    : GachaType -> Banners
  //   Honkai: Star Rail : GachaId   -> Banners
  //   Zenless Zone Zero : GachaType -> Banners
  pub banners: HashMap<u32, Vec<GachaMetadataBanner>>,
}

#[derive(Debug)]
pub struct GachaMetadataLocale {
  pub locale: String,                        // Locale: en-us, zh-cn, etc...
  categories: HashMap<&'static str, String>, // Category: Category Name
  entries: HashMap<u32, GachaMetadataEntry>, // Id: Entry
  reverses: OnceLock<HashMap<String, GachaMetadataEntryNameId>>, // Name: Id (Lazy init)
}

#[derive(Debug)]
pub struct GachaMetadataEntry {
  pub category: &'static str, // Avoid too many String allocations
  pub name: String,
  pub rank: u8,
}

#[derive(Debug)]
pub enum GachaMetadataEntryNameId {
  Unique(u32),
  Many(HashSet<u32>),
}

#[derive(Debug, PartialEq, Eq, Hash)]
pub struct GachaMetadataEntryRef<'a> {
  pub locale: &'a str,
  pub category: &'static str, // Category type name
  pub category_name: &'a str, // Category locale name
  pub id: u32,
  pub name: &'a str, // Entry locale name
  pub rank: u8,
}

#[derive(Debug)]
pub struct GachaMetadataBanner {
  pub gacha_type: u32,
  pub gacha_id: Option<u32>, // 'Honkai: Star Rail' only
  pub start_time: OffsetDateTime,
  pub end_time: OffsetDateTime,
  pub up_golden: HashSet<u32>,
  pub up_purple: HashSet<u32>,
  pub version: Option<GameVersion>,
}

impl GachaMetadata {
  pub const CATEGORY_CHARACTER: &'static str = "Character";
  pub const CATEGORY_WEAPON: &'static str = "Weapon";
  pub const CATEGORY_BANGBOO: &'static str = "Bangboo"; // 'Zenless Zone Zero' only
  pub const KNOWN_CATEGORIES: [&'static str; 3] = [
    Self::CATEGORY_CHARACTER,
    Self::CATEGORY_WEAPON,
    Self::CATEGORY_BANGBOO,
  ];

  #[cfg(test)]
  pub fn businesses(&self) -> hash_map::Keys<'_, Business, GachaMetadataBusiness> {
    self.metadata.keys()
  }

  #[cfg(test)]
  pub fn locales(
    &self,
    business: Business,
  ) -> Option<hash_map::Keys<'_, String, GachaMetadataLocale>> {
    self
      .metadata
      .get(&business)
      .map(|business| business.locales.keys())
  }

  #[cfg(test)]
  pub fn categories(
    &self,
    business: Business,
    locale: impl AsRef<str>,
  ) -> Option<HashMap<&'static str, &'_ str>> {
    self
      .metadata
      .get(&business)?
      .locales
      .get(locale.as_ref())
      .map(|locale| {
        locale
          .categories
          .iter()
          .map(|(category, category_name)| (*category, category_name.as_str()))
          .collect()
      })
  }

  pub fn locale(
    &self,
    business: Business,
    locale: impl AsRef<str>,
  ) -> Option<&GachaMetadataLocale> {
    self.metadata.get(&business)?.locales.get(locale.as_ref())
  }

  pub fn banners(&self, business: Business, gacha_type: u32) -> Option<&[GachaMetadataBanner]> {
    self
      .metadata
      .get(&business)?
      .banners
      .get(&gacha_type)
      .map(Vec::as_slice)
  }

  pub fn banner_from_record(&self, record: &GachaRecord) -> Option<&GachaMetadataBanner> {
    self
      .banners(record.business, record.gacha_type)?
      .iter()
      .find(|banner| {
        assert_eq!(banner.gacha_type, record.gacha_type);

        let in_time_range = record.time >= banner.start_time && record.time <= banner.end_time;
        match record.business {
          Business::GenshinImpact | Business::ZenlessZoneZero => in_time_range,
          Business::HonkaiStarRail => in_time_range && record.gacha_id == banner.gacha_id,
        }
      })
  }
}

impl GachaMetadataLocale {
  #[cfg(test)]
  pub fn ids(&self) -> hash_map::Keys<u32, GachaMetadataEntry> {
    self.entries.keys()
  }

  #[cfg(test)]
  pub fn names(&self) -> hash_map::Keys<String, GachaMetadataEntryNameId> {
    self.reverses().keys()
  }

  pub fn entry_from_id<'a>(&'a self, id: u32) -> Option<GachaMetadataEntryRef<'a>> {
    self.entries.get(&id).map(|entry| self.entry_ref(entry, id))
  }

  pub fn entry_from_name<'a, 'name: 'a>(
    &'a self,
    name: &'name str,
  ) -> Option<HashSet<GachaMetadataEntryRef<'a>>> {
    match self.reverses().get(name)? {
      GachaMetadataEntryNameId::Unique(id) => Some(HashSet::from_iter([
        self.entry_ref(self.entries.get(id)?, *id)
      ])),
      GachaMetadataEntryNameId::Many(ids) => Some(
        ids
          .iter()
          .filter_map(|id| self.entries.get(id).map(|entry| self.entry_ref(entry, *id)))
          .collect(),
      ),
    }
  }

  pub fn entry_from_name_first<'a, 'name: 'a>(
    &'a self,
    name: &'name str,
  ) -> Option<GachaMetadataEntryRef<'a>> {
    match self.reverses().get(name)? {
      GachaMetadataEntryNameId::Unique(id) => Some(self.entry_ref(self.entries.get(id)?, *id)),
      GachaMetadataEntryNameId::Many(ids) => ids
        .iter()
        .next()
        .and_then(|id| self.entries.get(id).map(|entry| self.entry_ref(entry, *id))),
    }
  }

  #[inline]
  fn entry_ref<'a>(&'a self, entry: &'a GachaMetadataEntry, id: u32) -> GachaMetadataEntryRef<'a> {
    GachaMetadataEntryRef {
      locale: &self.locale,
      category: entry.category,
      category_name: self.categories.get(entry.category).unwrap(), // SAFETY
      id,
      name: &entry.name,
      rank: entry.rank,
    }
  }

  fn reverses(&self) -> &HashMap<String, GachaMetadataEntryNameId> {
    self.reverses.get_or_init(|| {
      let mut name_ids = HashMap::with_capacity(self.entries.len());
      for (id, entry) in &self.entries {
        name_ids
          .entry(entry.name.clone())
          .and_modify(|name_id| match name_id {
            GachaMetadataEntryNameId::Unique(prev_id) => {
              *name_id = GachaMetadataEntryNameId::Many(HashSet::from_iter([*prev_id, *id]));
            }
            GachaMetadataEntryNameId::Many(ids) => {
              ids.insert(*id);
            }
          })
          .or_insert(GachaMetadataEntryNameId::Unique(*id));
      }
      name_ids
    })
  }
}

impl GachaMetadataBanner {
  #[inline]
  pub fn in_up_golden(&self, id: u32) -> bool {
    self.up_golden.contains(&id)
  }

  #[inline]
  pub fn in_up_purple(&self, id: u32) -> bool {
    self.up_purple.contains(&id)
  }
}

// RawGachaMetadata -> GachaMetadata.metadata
fn from_raw_gacha_metadata(raw: RawGachaMetadata) -> HashMap<Business, GachaMetadataBusiness> {
  let businesses = raw.len();

  raw.into_iter().fold(
    HashMap::with_capacity(businesses),
    |mut acc, raw_business| {
      let RawGachaMetadataBusiness {
        business,
        categories,
        banners,
      } = raw_business;

      let locales = {
        let sum_i18n = categories
          .iter()
          .map(|categorization| categorization.i18n.len())
          .sum();

        let mut result: HashMap<String, GachaMetadataLocale> = HashMap::with_capacity(sum_i18n);

        for RawGachaMetadataCategorization {
          category,
          entries,
          i18n,
        } in categories
        {
          let entries_len = entries.len();
          let category: &'static str = match category.as_str() {
            GachaMetadata::CATEGORY_CHARACTER => GachaMetadata::CATEGORY_CHARACTER,
            GachaMetadata::CATEGORY_WEAPON => GachaMetadata::CATEGORY_WEAPON,
            GachaMetadata::CATEGORY_BANGBOO => GachaMetadata::CATEGORY_BANGBOO,
            _ => panic!(
              "Unsupported metadata category: {category} (Allowed: {})",
              GachaMetadata::KNOWN_CATEGORIES.join(", ")
            ),
          };

          for (
            locale,
            RawGachaMetadataI18n {
              category: category_name,
              entries: names,
            },
          ) in i18n
          {
            // See: https://github.com/lgou2w/HoYo.Gacha/issues/92
            assert_eq!(
              entries_len,
              names.len(),
              "Entries and names length mismatch for category '{category}' in locale '{locale}' ({business})"
            );

            let new_entries = entries.clone().into_iter().zip(names).fold(
              HashMap::with_capacity(entries_len),
              |mut acc, ((id, rank), name)| {
                acc.insert(
                  id,
                  GachaMetadataEntry {
                    category,
                    name,
                    rank,
                  },
                );
                acc
              },
            );

            match result.entry(locale.clone()) {
              hash_map::Entry::Occupied(mut o) => {
                let locale = o.get_mut();
                locale.entries.extend(new_entries);
                locale.categories.insert(category, category_name.clone());
              }
              hash_map::Entry::Vacant(o) => {
                o.insert(GachaMetadataLocale {
                  locale,
                  categories: HashMap::from_iter([(category, category_name.clone())]),
                  entries: new_entries,
                  reverses: OnceLock::new(),
                });
              }
            }
          }
        }

        result
      };

      let banners = {
        let mut result: HashMap<u32, Vec<GachaMetadataBanner>> = HashMap::new();

        for banner in banners {
          result
            .entry(banner.gacha_type)
            .or_default()
            .push(GachaMetadataBanner {
              gacha_type: banner.gacha_type,
              gacha_id: banner.gacha_id,
              start_time: banner.start_time,
              end_time: banner.end_time,
              up_golden: banner.up_golden,
              up_purple: banner.up_purple,
              version: banner.version,
            })
        }

        result
      };

      acc.insert(business, GachaMetadataBusiness { locales, banners });
      acc
    },
  )
}

fn sha1sum(slice: impl AsRef<[u8]>) -> String {
  Sha1::digest(slice.as_ref())
    .into_iter()
    .fold(String::with_capacity(40), |mut output, b| {
      use std::fmt::Write;
      let _ = write!(output, "{b:02x}"); // lowercase
      output
    })
}

impl GachaMetadata {
  pub fn from_bytes(slice: impl AsRef<[u8]>) -> serde_json::Result<Self> {
    let raw = serde_json::from_slice::<RawGachaMetadata>(slice.as_ref())?;
    let metadata = from_raw_gacha_metadata(raw);

    Ok(Self {
      metadata,
      hash: sha1sum(slice),
    })
  }
}

// Activate Metadata

static ACTIVATE_METADATA_UPDATING: AtomicBool = AtomicBool::new(false);
static ACTIVATE_METADATA: LazyLock<RwLock<Arc<GachaMetadata>>> = LazyLock::new(|| {
  const EMBEDDED_RAW_METADATA: &[u8] = include_bytes!("./gacha_metadata_v2.json");

  let start = Instant::now();
  let metadata = GachaMetadata::from_bytes(EMBEDDED_RAW_METADATA)
    .expect("Failed to load embedded gacha metadata");

  info!(
    message = "Embedded gacha metadata loaded successfully",
    elapsed = ?start.elapsed(),
    %metadata.hash,
  );

  RwLock::new(Arc::new(metadata))
});

impl GachaMetadata {
  pub fn current() -> &'static Self {
    let guard = ACTIVATE_METADATA
      .read()
      .expect("Gacha metadata lock poisoned");

    unsafe { &*Arc::as_ptr(&guard) }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_embedded_metadata() {
    let _ = GachaMetadata::current();
  }

  #[test]
  fn test_example() {
    let json = r#"
      [
        {
          "Business": 0,
          "Categories": [
            {
              "Category": "Character",
              "Entries": [
                [10000002, 5],
                [10000003, 5],
                [10000005, 5],
                [10000007, 5]
              ],
              "I18n": {
                "en-us": {
                  "Category": "Character",
                  "Entries": [
                    "Kamisato Ayaka",
                    "Jean",
                    "Traveler",
                    "Traveler"
                  ]
                },
                "zh-cn": {
                  "Category": "角色",
                  "Entries": [
                    "神里绫华",
                    "琴",
                    "旅行者",
                    "旅行者"
                  ]
                }
              }
            },
            {
              "Category": "Weapon",
              "Entries": [
                [11509, 5]
              ],
              "I18n": {
                "en-us": {
                  "Category": "Weapon",
                  "Entries": [
                    "Mistsplitter Reforged"
                  ]
                },
                "zh-cn": {
                  "Category": "武器",
                  "Entries": [
                    "雾切之回光"
                  ]
                }
              }
            }
          ],
          "Banners": []
        }
      ]"#;

    let metadata = GachaMetadata::from_bytes(json.as_bytes()).unwrap();

    assert!(metadata.businesses().eq([Business::GenshinImpact].iter()));

    assert!(
      metadata
        .locales(Business::GenshinImpact)
        .unwrap()
        // Because the keys of a HashMap is unordered
        .any(|locale| locale == "en-us" || locale == "zh-cn")
    );

    assert!(
      metadata
        .categories(Business::GenshinImpact, "en-us")
        .unwrap()
        .into_iter()
        .any(|(category, category_name)| {
          category == GachaMetadata::CATEGORY_CHARACTER && category_name == "Character"
            || category == GachaMetadata::CATEGORY_WEAPON && category_name == "Weapon"
        })
    );

    assert!(
      metadata
        .categories(Business::GenshinImpact, "zh-cn")
        .unwrap()
        .into_iter()
        .any(|(category, category_name)| {
          category == GachaMetadata::CATEGORY_CHARACTER && category_name == "角色"
            || category == GachaMetadata::CATEGORY_WEAPON && category_name == "武器"
        })
    );

    let mut s = metadata.locale(Business::GenshinImpact, "en-us").unwrap();

    assert!(s.ids().any(|id| *id == 10000002
      || *id == 10000003
      || *id == 10000005
      || *id == 10000007
      || *id == 11509));

    assert!(s.names().any(|name| name == "Kamisato Ayaka"
      || name == "Jean"
      || name == "Traveler"
      || name == "Mistsplitter Reforged"));

    assert_eq!(
      s.entry_from_id(10000002),
      Some(GachaMetadataEntryRef {
        locale: "en-us",
        category: GachaMetadata::CATEGORY_CHARACTER,
        category_name: "Character",
        id: 10000002,
        name: "Kamisato Ayaka",
        rank: 5,
      })
    );

    assert_eq!(
      s.entry_from_name_first("Jean"),
      Some(GachaMetadataEntryRef {
        locale: "en-us",
        category: GachaMetadata::CATEGORY_CHARACTER,
        category_name: "Character",
        id: 10000003,
        name: "Jean",
        rank: 5,
      })
    );

    assert_eq!(
      s.entry_from_name("Traveler"),
      Some(HashSet::from_iter([
        GachaMetadataEntryRef {
          locale: "en-us",
          category: GachaMetadata::CATEGORY_CHARACTER,
          category_name: "Character",
          id: 10000005,
          name: "Traveler",
          rank: 5,
        },
        GachaMetadataEntryRef {
          locale: "en-us",
          category: GachaMetadata::CATEGORY_CHARACTER,
          category_name: "Character",
          id: 10000007,
          name: "Traveler",
          rank: 5,
        }
      ]))
    );

    assert_eq!(
      s.entry_from_name_first("Mistsplitter Reforged"),
      Some(GachaMetadataEntryRef {
        locale: "en-us",
        category: GachaMetadata::CATEGORY_WEAPON,
        category_name: "Weapon",
        id: 11509,
        name: "Mistsplitter Reforged",
        rank: 5,
      })
    );

    assert_eq!(
      s.entry_from_name_first("Kamisato Ayaka"),
      s.entry_from_id(10000002)
    );
    assert_eq!(s.entry_from_name_first("Jean"), s.entry_from_id(10000003));
    assert_eq!(
      s.entry_from_name("Traveler"),
      Some(HashSet::from_iter([
        s.entry_from_id(10000005).unwrap(),
        s.entry_from_id(10000007).unwrap()
      ]))
    );
    assert_eq!(
      s.entry_from_name_first("Mistsplitter Reforged"),
      s.entry_from_id(11509)
    );

    s = metadata.locale(Business::GenshinImpact, "zh-cn").unwrap();

    assert!(s.ids().any(|id| *id == 10000002
      || *id == 10000003
      || *id == 10000005
      || *id == 10000007
      || *id == 11509));

    assert!(
      s.names()
        .any(|name| name == "神里绫华" || name == "琴" || name == "旅行者" || name == "雾切之回光")
    );

    assert_eq!(
      s.entry_from_name_first("神里绫华"),
      Some(GachaMetadataEntryRef {
        locale: "zh-cn",
        category: GachaMetadata::CATEGORY_CHARACTER,
        category_name: "角色",
        id: 10000002,
        name: "神里绫华",
        rank: 5,
      })
    );

    assert_eq!(
      s.entry_from_id(10000003),
      Some(GachaMetadataEntryRef {
        locale: "zh-cn",
        category: GachaMetadata::CATEGORY_CHARACTER,
        category_name: "角色",
        id: 10000003,
        name: "琴",
        rank: 5,
      })
    );

    assert_eq!(
      s.entry_from_name("旅行者"),
      Some(HashSet::from_iter([
        GachaMetadataEntryRef {
          locale: "zh-cn",
          category: GachaMetadata::CATEGORY_CHARACTER,
          category_name: "角色",
          id: 10000005,
          name: "旅行者",
          rank: 5,
        },
        GachaMetadataEntryRef {
          locale: "zh-cn",
          category: GachaMetadata::CATEGORY_CHARACTER,
          category_name: "角色",
          id: 10000007,
          name: "旅行者",
          rank: 5,
        }
      ]))
    );

    assert_eq!(
      s.entry_from_id(11509),
      Some(GachaMetadataEntryRef {
        locale: "zh-cn",
        category: GachaMetadata::CATEGORY_WEAPON,
        category_name: "武器",
        id: 11509,
        name: "雾切之回光",
        rank: 5,
      })
    );

    assert_eq!(
      s.entry_from_name_first("神里绫华"),
      s.entry_from_id(10000002)
    );
    assert_eq!(s.entry_from_name_first("琴"), s.entry_from_id(10000003));
    assert_eq!(
      s.entry_from_name("旅行者"),
      Some(HashSet::from_iter([
        s.entry_from_id(10000005).unwrap(),
        s.entry_from_id(10000007).unwrap()
      ]))
    );
    assert_eq!(
      s.entry_from_name_first("雾切之回光"),
      s.entry_from_id(11509)
    );
  }
}
