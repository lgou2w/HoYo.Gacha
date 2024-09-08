use std::collections::hash_map::{Entry as MapEntry, Keys};
use std::collections::{HashMap, HashSet};

use once_cell::sync::OnceCell;
use serde::Deserialize;

use super::Business;

// Json Metadata

type JsonMetadata = HashMap<Business, Vec<JsonMetadataStruct>>;

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct JsonMetadataStruct {
  pub category: String,
  pub entries: Vec<JsonEntry>,
  pub i18n: HashMap<String, JsonI18n>,
}

#[derive(Clone, Deserialize)]
#[serde(untagged)]
enum JsonEntry {
  Restricted(String, u8),
  Permanent(String, u8, bool),
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct JsonI18n {
  pub category: String,
  pub entries: Vec<String>,
}

// Wrapped Metadata

#[derive(Debug)]
pub struct Metadata(
  // Business : ( Locale : Struct )
  HashMap<Business, HashMap<String, MetadataStruct>>,
);

impl Metadata {
  #[inline]
  pub fn obtain<'a>(
    &'a self,
    business: Business,
    locale: impl AsRef<str>,
  ) -> Option<&'a MetadataStruct> {
    self.0.get(&business)?.get(locale.as_ref())
  }

  #[inline]
  pub fn businesses(&self) -> Keys<'_, Business, HashMap<String, MetadataStruct>> {
    self.0.keys()
  }

  #[inline]
  pub fn locales(&self, business: Business) -> Option<Keys<'_, String, MetadataStruct>> {
    self.0.get(&business).map(|locales| locales.keys())
  }

  #[inline]
  pub fn categories(
    &self,
    business: Business,
    locale: impl AsRef<str>,
  ) -> Option<HashMap<&'static str, &'_ str>> {
    self.0.get(&business)?.get(locale.as_ref()).map(|r#struct| {
      r#struct
        .categories
        .iter()
        .map(|(category, category_name)| (*category, category_name.as_str()))
        .collect()
    })
  }
}

#[derive(Debug)]
pub struct MetadataStruct {
  pub locale: String,                            // Locale: en-us, zh-cn, etc...
  categories: HashMap<&'static str, String>,     // Category: Category Name
  entries: HashMap<String, MetadataStructEntry>, // Id: Entry
  reverses: OnceCell<HashMap<String, MetadataStructNameId>>, // Name: Id (Lazy init)
}

#[derive(Debug)]
pub struct MetadataStructEntry {
  pub category: &'static str, // Avoid too many String allocations
  pub name: String,
  pub rank: u8,
  pub restricted: bool,
}

#[derive(Debug)]
pub enum MetadataStructNameId {
  Unique(String),
  Multiple(HashSet<String>),
}

#[derive(Debug, PartialEq, Eq, Hash)]
pub struct MetadataStructEntryRef<'a> {
  pub locale: &'a str,
  pub category: &'a str,
  pub category_name: &'a str,
  pub id: &'a str,
  pub name: &'a str,
  pub rank: u8,
  pub restricted: bool,
}

impl MetadataStruct {
  pub const CATEGORY_CHARACTER: &'static str = "Character";
  pub const CATEGORY_WEAPON: &'static str = "Weapon";
  pub const CATEGORY_BANGBOO: &'static str = "Bangboo"; // 'Zenless Zone Zero' only
  pub const KNOWN_CATEGORIES: [&'static str; 3] = [
    Self::CATEGORY_CHARACTER,
    Self::CATEGORY_WEAPON,
    Self::CATEGORY_BANGBOO,
  ];

  pub fn ids(&self) -> Keys<String, MetadataStructEntry> {
    self.entries.keys()
  }

  pub fn names(&self) -> Keys<String, MetadataStructNameId> {
    self.reverses().keys()
  }

  pub fn from_id<'a, 'id: 'a>(&'a self, id: &'id str) -> Option<MetadataStructEntryRef<'a>> {
    self.entries.get(id).map(|entry| self.entry_ref(id, entry))
  }

  pub fn from_name<'a, 'name: 'a>(
    &'a self,
    name: &'name str,
  ) -> Option<HashSet<MetadataStructEntryRef<'a>>> {
    match self.reverses().get(name)? {
      MetadataStructNameId::Unique(id) => Some(HashSet::from_iter([
        self.entry_ref(id, self.entries.get(id)?)
      ])),
      MetadataStructNameId::Multiple(ids) => Some(
        ids
          .iter()
          .filter_map(|id| self.entries.get(id).map(|entry| self.entry_ref(id, entry)))
          .collect(),
      ),
    }
  }

  pub fn from_name_first<'a, 'name: 'a>(
    &'a self,
    name: &'name str,
  ) -> Option<MetadataStructEntryRef<'a>> {
    match self.reverses().get(name)? {
      MetadataStructNameId::Unique(id) => Some(self.entry_ref(id, self.entries.get(id)?)),
      MetadataStructNameId::Multiple(ids) => ids
        .iter()
        .next()
        .and_then(|id| self.entries.get(id).map(|entry| self.entry_ref(id, entry))),
    }
  }

  fn reverses(&self) -> &HashMap<String, MetadataStructNameId> {
    self.reverses.get_or_init(|| {
      type NameId = MetadataStructNameId;

      let mut name_ids = HashMap::with_capacity(self.entries.len());
      for (id, entry) in &self.entries {
        name_ids
          .entry(entry.name.clone())
          .and_modify(|name_id| match name_id {
            NameId::Unique(prev_id) => {
              *name_id = NameId::Multiple(HashSet::from_iter([prev_id.clone(), id.clone()]));
            }
            NameId::Multiple(ids) => {
              ids.insert(id.clone());
            }
          })
          .or_insert(NameId::Unique(id.clone()));
      }
      name_ids
    })
  }

  #[inline]
  fn entry_ref<'a, 'id: 'a>(
    &'a self,
    id: &'id str,
    entry: &'a MetadataStructEntry,
  ) -> MetadataStructEntryRef<'a> {
    MetadataStructEntryRef {
      locale: &self.locale,
      category: entry.category,
      category_name: self.categories.get(entry.category).unwrap(), // SAFETY
      id,
      name: &entry.name,
      rank: entry.rank,
      restricted: entry.restricted,
    }
  }
}

// Convert multiple category structures into (Locale: MetadataStruct) hashmap
fn convert_json_structs(structs: Vec<JsonMetadataStruct>) -> HashMap<String, MetadataStruct> {
  let sum_i18n = structs.iter().map(|r#struct| r#struct.i18n.len()).sum();
  let mut locales: HashMap<String, MetadataStruct> = HashMap::with_capacity(sum_i18n);

  for JsonMetadataStruct {
    category,
    entries,
    i18n,
  } in structs
  {
    let entries_len = entries.len();
    let category: &'static str = match category.as_str() {
      MetadataStruct::CATEGORY_CHARACTER => MetadataStruct::CATEGORY_CHARACTER,
      MetadataStruct::CATEGORY_WEAPON => MetadataStruct::CATEGORY_WEAPON,
      MetadataStruct::CATEGORY_BANGBOO => MetadataStruct::CATEGORY_BANGBOO,
      _ => panic!(
        "Unsupported metadata category: {category} (Allowed: {})",
        MetadataStruct::KNOWN_CATEGORIES.join(", ")
      ),
    };

    for (
      locale,
      JsonI18n {
        category: category_name,
        entries: names,
      },
    ) in i18n
    {
      let new_entries = entries.clone().into_iter().zip(names).fold(
        HashMap::with_capacity(entries_len),
        |mut acc, (entry, name)| {
          let (id, rank, restricted) = match entry {
            JsonEntry::Restricted(id, rank) => (id, rank, true),
            JsonEntry::Permanent(id, rank, is_permanent) => (id, rank, !is_permanent),
          };

          acc.insert(
            id,
            MetadataStructEntry {
              category,
              name,
              rank,
              restricted,
            },
          );
          acc
        },
      );

      match locales.entry(locale.clone()) {
        MapEntry::Occupied(mut o) => {
          let r#struct = o.get_mut();
          r#struct.entries.extend(new_entries);
          r#struct.categories.insert(category, category_name.clone());
        }
        MapEntry::Vacant(o) => {
          o.insert(MetadataStruct {
            locale,
            categories: HashMap::from_iter([(category, category_name.clone())]),
            entries: new_entries,
            reverses: OnceCell::new(),
          });
        }
      }
    }
  }

  locales
}

pub enum MetadataSource<'a> {
  Bytes(&'a [u8]),
  Str(&'a str),
}

impl Metadata {
  pub fn from_json(source: MetadataSource<'_>) -> serde_json::Result<Self> {
    let json: JsonMetadata = match source {
      MetadataSource::Bytes(slice) => serde_json::from_slice(slice)?,
      MetadataSource::Str(str) => serde_json::from_str(str)?,
    };

    let inner = json
      .into_iter()
      .map(|(business, structs)| (business, convert_json_structs(structs)))
      .collect();

    Ok(Self(inner))
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_example() {
    let metadata = Metadata::from_json(MetadataSource::Str(
      r#"
      {
        "0": [
          {
            "Category": "Character",
            "Entries": [
              ["10000002", 5],
              ["10000003", 5, true],
              ["10000005", 5, true],
              ["10000007", 5, true]
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
              ["11509", 5]
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
        ]
      }"#,
    ))
    .unwrap();

    assert!(metadata.businesses().eq([Business::GenshinImpact].iter()));

    assert!(metadata
      .locales(Business::GenshinImpact)
      .unwrap()
      // Because the keys of a HashMap is unordered
      .any(|locale| locale == "en-us" || locale == "zh-cn"));

    assert!(metadata
      .categories(Business::GenshinImpact, "en-us")
      .unwrap()
      .into_iter()
      .any(|(category, category_name)| {
        category == MetadataStruct::CATEGORY_CHARACTER && category_name == "Character"
          || category == MetadataStruct::CATEGORY_WEAPON && category_name == "Weapon"
      }));

    assert!(metadata
      .categories(Business::GenshinImpact, "zh-cn")
      .unwrap()
      .into_iter()
      .any(|(category, category_name)| {
        category == MetadataStruct::CATEGORY_CHARACTER && category_name == "角色"
          || category == MetadataStruct::CATEGORY_WEAPON && category_name == "武器"
      }));

    let mut s = metadata.obtain(Business::GenshinImpact, "en-us").unwrap();

    assert!(s.ids().any(|id| id == "10000002"
      || id == "10000003"
      || id == "10000005"
      || id == "10000007"
      || id == "11509"));

    assert!(s.names().any(|name| name == "Kamisato Ayaka"
      || name == "Jean"
      || name == "Traveler"
      || name == "Mistsplitter Reforged"));

    assert_eq!(
      s.from_id("10000002"),
      Some(MetadataStructEntryRef {
        locale: "en-us",
        category: MetadataStruct::CATEGORY_CHARACTER,
        category_name: "Character",
        id: "10000002",
        name: "Kamisato Ayaka",
        rank: 5,
        restricted: true
      })
    );

    assert_eq!(
      s.from_name_first("Jean"),
      Some(MetadataStructEntryRef {
        locale: "en-us",
        category: MetadataStruct::CATEGORY_CHARACTER,
        category_name: "Character",
        id: "10000003",
        name: "Jean",
        rank: 5,
        restricted: false
      })
    );

    assert_eq!(
      s.from_name("Traveler"),
      Some(HashSet::from_iter([
        MetadataStructEntryRef {
          locale: "en-us",
          category: MetadataStruct::CATEGORY_CHARACTER,
          category_name: "Character",
          id: "10000005",
          name: "Traveler",
          rank: 5,
          restricted: false
        },
        MetadataStructEntryRef {
          locale: "en-us",
          category: MetadataStruct::CATEGORY_CHARACTER,
          category_name: "Character",
          id: "10000007",
          name: "Traveler",
          rank: 5,
          restricted: false
        }
      ]))
    );

    assert_eq!(
      s.from_name_first("Mistsplitter Reforged"),
      Some(MetadataStructEntryRef {
        locale: "en-us",
        category: MetadataStruct::CATEGORY_WEAPON,
        category_name: "Weapon",
        id: "11509",
        name: "Mistsplitter Reforged",
        rank: 5,
        restricted: true
      })
    );

    assert_eq!(s.from_name_first("Kamisato Ayaka"), s.from_id("10000002"));
    assert_eq!(s.from_name_first("Jean"), s.from_id("10000003"));
    assert_eq!(
      s.from_name("Traveler"),
      Some(HashSet::from_iter([
        s.from_id("10000005").unwrap(),
        s.from_id("10000007").unwrap()
      ]))
    );
    assert_eq!(
      s.from_name_first("Mistsplitter Reforged"),
      s.from_id("11509")
    );

    s = metadata.obtain(Business::GenshinImpact, "zh-cn").unwrap();

    assert!(s.ids().any(|id| id == "10000002"
      || id == "10000003"
      || id == "10000005"
      || id == "10000007"
      || id == "11509"));

    assert!(s
      .names()
      .any(|name| name == "神里绫华" || name == "琴" || name == "旅行者" || name == "雾切之回光"));

    assert_eq!(
      s.from_name_first("神里绫华"),
      Some(MetadataStructEntryRef {
        locale: "zh-cn",
        category: MetadataStruct::CATEGORY_CHARACTER,
        category_name: "角色",
        id: "10000002",
        name: "神里绫华",
        rank: 5,
        restricted: true
      })
    );

    assert_eq!(
      s.from_id("10000003"),
      Some(MetadataStructEntryRef {
        locale: "zh-cn",
        category: MetadataStruct::CATEGORY_CHARACTER,
        category_name: "角色",
        id: "10000003",
        name: "琴",
        rank: 5,
        restricted: false
      })
    );

    assert_eq!(
      s.from_name("旅行者"),
      Some(HashSet::from_iter([
        MetadataStructEntryRef {
          locale: "zh-cn",
          category: MetadataStruct::CATEGORY_CHARACTER,
          category_name: "角色",
          id: "10000005",
          name: "旅行者",
          rank: 5,
          restricted: false
        },
        MetadataStructEntryRef {
          locale: "zh-cn",
          category: MetadataStruct::CATEGORY_CHARACTER,
          category_name: "角色",
          id: "10000007",
          name: "旅行者",
          rank: 5,
          restricted: false
        }
      ]))
    );

    assert_eq!(
      s.from_id("11509"),
      Some(MetadataStructEntryRef {
        locale: "zh-cn",
        category: MetadataStruct::CATEGORY_WEAPON,
        category_name: "武器",
        id: "11509",
        name: "雾切之回光",
        rank: 5,
        restricted: true
      })
    );

    assert_eq!(s.from_name_first("神里绫华"), s.from_id("10000002"));
    assert_eq!(s.from_name_first("琴"), s.from_id("10000003"));
    assert_eq!(
      s.from_name("旅行者"),
      Some(HashSet::from_iter([
        s.from_id("10000005").unwrap(),
        s.from_id("10000007").unwrap()
      ]))
    );
    assert_eq!(s.from_name_first("雾切之回光"), s.from_id("11509"));
  }
}
