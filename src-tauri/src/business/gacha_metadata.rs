use std::collections::hash_map::{Entry as MapEntry, Keys};
use std::collections::{HashMap, HashSet};
use std::error::Error as StdError;
use std::fmt::{self, Debug};
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, LazyLock, OnceLock, RwLock};
use std::time::{Duration, Instant};

use serde::Deserialize;
use sha1::{Digest, Sha1};
use time::OffsetDateTime;
use time::serde::rfc3339;
use tracing::{error, info};

use crate::consts;

use super::Business;

// Raw Json Metadata

type RawGachaMetadata = HashMap<Business, Vec<RawGachaMetadataCategorization>>;

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawGachaMetadataCategorization {
  pub category: String,
  pub entries: Vec<RawGachaMetadataEntry>,
  pub i18n: HashMap<String, RawGachaMetadataI18n>,
}

#[derive(Clone, Deserialize)]
#[serde(untagged)]
enum RawGachaMetadataEntry {
  Limited(String, u8),
  LimitedDeadline(String, u8, #[serde(with = "rfc3339")] OffsetDateTime),
  Permanent(String, u8, bool),
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawGachaMetadataI18n {
  pub category: String,
  pub entries: Vec<String>,
}

// Wrapped

#[derive(Debug, PartialEq, Eq, Hash)]
pub enum GachaMetadataEntryLimited {
  // Permanent
  No,
  // Limited
  Yes,
  // Before the deadline, it was limited.
  Deadline(OffsetDateTime),
}

#[derive(Debug)]
pub struct GachaMetadataEntry {
  pub category: &'static str, // Avoid too many String allocations
  pub name: String,
  pub rank: u8,
  pub limited: GachaMetadataEntryLimited,
}

#[derive(Debug)]
pub enum GachaMetadataEntryNameId {
  Unique(String),
  Multiple(HashSet<String>),
}

#[derive(Debug)]
pub struct GachaMetadataLocale {
  pub locale: String,                           // Locale: en-us, zh-cn, etc...
  categories: HashMap<&'static str, String>,    // Category: Category Name
  entries: HashMap<String, GachaMetadataEntry>, // Id: Entry
  reverses: OnceLock<HashMap<String, GachaMetadataEntryNameId>>, // Name: Id (Lazy init)
}

#[derive(Debug, PartialEq, Eq, Hash)]
pub struct GachaMetadataEntryRef<'a> {
  pub locale: &'a str,
  pub category: &'static str, // Category type name
  pub category_name: &'a str, // Category locale name
  pub id: &'a str,
  pub name: &'a str, // Entry locale name
  pub rank: u8,
  pub limited: &'a GachaMetadataEntryLimited,
}

impl GachaMetadataLocale {
  pub fn ids(&self) -> Keys<String, GachaMetadataEntry> {
    self.entries.keys()
  }

  pub fn names(&self) -> Keys<String, GachaMetadataEntryNameId> {
    self.reverses().keys()
  }

  pub fn entry_from_id<'a, 'id: 'a>(&'a self, id: &'id str) -> Option<GachaMetadataEntryRef<'a>> {
    self.entries.get(id).map(|entry| self.entry_ref(entry, id))
  }

  pub fn entry_from_name<'a, 'name: 'a>(
    &'a self,
    name: &'name str,
  ) -> Option<HashSet<GachaMetadataEntryRef<'a>>> {
    match self.reverses().get(name)? {
      GachaMetadataEntryNameId::Unique(id) => Some(HashSet::from_iter([
        self.entry_ref(self.entries.get(id)?, id)
      ])),
      GachaMetadataEntryNameId::Multiple(ids) => Some(
        ids
          .iter()
          .filter_map(|id| self.entries.get(id).map(|entry| self.entry_ref(entry, id)))
          .collect(),
      ),
    }
  }

  pub fn entry_from_name_first<'a, 'name: 'a>(
    &'a self,
    name: &'name str,
  ) -> Option<GachaMetadataEntryRef<'a>> {
    match self.reverses().get(name)? {
      GachaMetadataEntryNameId::Unique(id) => Some(self.entry_ref(self.entries.get(id)?, id)),
      GachaMetadataEntryNameId::Multiple(ids) => ids
        .iter()
        .next()
        .and_then(|id| self.entries.get(id).map(|entry| self.entry_ref(entry, id))),
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
              *name_id = GachaMetadataEntryNameId::Multiple(HashSet::from_iter([
                prev_id.clone(),
                id.clone(),
              ]));
            }
            GachaMetadataEntryNameId::Multiple(ids) => {
              ids.insert(id.clone());
            }
          })
          .or_insert(GachaMetadataEntryNameId::Unique(id.clone()));
      }
      name_ids
    })
  }

  #[inline]
  fn entry_ref<'a, 'id: 'a>(
    &'a self,
    entry: &'a GachaMetadataEntry,
    id: &'id str,
  ) -> GachaMetadataEntryRef<'a> {
    GachaMetadataEntryRef {
      locale: &self.locale,
      category: entry.category,
      category_name: self.categories.get(entry.category).unwrap(), // SAFETY
      id,
      name: &entry.name,
      rank: entry.rank,
      limited: &entry.limited,
    }
  }
}

pub struct GachaMetadata {
  pub metadata: HashMap<Business, HashMap<String, GachaMetadataLocale>>,
  pub hash: String, // SHA-1
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
}

impl GachaMetadata {
  pub fn obtain(
    &self,
    business: Business,
    locale: impl AsRef<str>,
  ) -> Option<&GachaMetadataLocale> {
    self.metadata.get(&business)?.get(locale.as_ref())
  }

  pub fn businesses(&self) -> Keys<'_, Business, HashMap<String, GachaMetadataLocale>> {
    self.metadata.keys()
  }

  pub fn locales(&self, business: Business) -> Option<Keys<'_, String, GachaMetadataLocale>> {
    self.metadata.get(&business).map(|locales| locales.keys())
  }

  pub fn categories(
    &self,
    business: Business,
    locale: impl AsRef<str>,
  ) -> Option<HashMap<&'static str, &'_ str>> {
    self
      .metadata
      .get(&business)?
      .get(locale.as_ref())
      .map(|locale| {
        locale
          .categories
          .iter()
          .map(|(category, category_name)| (*category, category_name.as_str()))
          .collect()
      })
  }
}

impl Debug for GachaMetadata {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.debug_struct("GachaMetadata")
      .field("metadata", &self.metadata)
      .field("hash", &self.hash)
      .finish()
  }
}

// From Raw Json

// Convert multiple categorizations into (Locale: GachaMetadataLocale) hashmap
fn raw_categorizations_into_locales(
  categorizations: Vec<RawGachaMetadataCategorization>,
) -> HashMap<String, GachaMetadataLocale> {
  let sum_i18n = categorizations
    .iter()
    .map(|categorization| categorization.i18n.len())
    .sum();

  let mut locales: HashMap<String, GachaMetadataLocale> = HashMap::with_capacity(sum_i18n);
  for RawGachaMetadataCategorization {
    category,
    entries,
    i18n,
  } in categorizations
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
      let new_entries = entries.clone().into_iter().zip(names).fold(
        HashMap::with_capacity(entries_len),
        |mut acc, (entry, name)| {
          let (id, rank, limited) = match entry {
            RawGachaMetadataEntry::Limited(id, rank) => (id, rank, GachaMetadataEntryLimited::Yes),
            RawGachaMetadataEntry::LimitedDeadline(id, rank, deadline) => {
              (id, rank, GachaMetadataEntryLimited::Deadline(deadline))
            }
            RawGachaMetadataEntry::Permanent(id, rank, permanently) => (
              id,
              rank,
              // FIXME: Permanently always true
              match permanently {
                true => GachaMetadataEntryLimited::No,
                false => GachaMetadataEntryLimited::Yes,
              },
            ),
          };

          acc.insert(
            id,
            GachaMetadataEntry {
              category,
              name,
              rank,
              limited,
            },
          );
          acc
        },
      );

      match locales.entry(locale.clone()) {
        MapEntry::Occupied(mut o) => {
          let locale = o.get_mut();
          locale.entries.extend(new_entries);
          locale.categories.insert(category, category_name.clone());
        }
        MapEntry::Vacant(o) => {
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

  locales
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
    let metadata = serde_json::from_slice::<RawGachaMetadata>(slice.as_ref())?
      .into_iter()
      .map(|(business, categorizations)| {
        (business, raw_categorizations_into_locales(categorizations))
      })
      .collect();

    Ok(Self {
      metadata,
      hash: sha1sum(slice),
    })
  }
}

// Activate Metadata

static ACTIVATE_METADATA_UPDATING: AtomicBool = AtomicBool::new(false);
static ACTIVATE_METADATA: LazyLock<RwLock<Arc<GachaMetadata>>> = LazyLock::new(|| {
  const EMBEDDED_RAW_METADATA: &[u8] = include_bytes!("./gacha_metadata.json");

  let start = Instant::now();
  let metadata = GachaMetadata::from_bytes(EMBEDDED_RAW_METADATA)
    .expect("Failed to load embedded gacha metadata");

  info!(
    message = "Embedded gacha metadata loaded successfully",
    elapsed = ?start.elapsed(),
    %metadata.hash,
  );

  #[cfg(not(test))]
  match load_latest_metadata() {
    Err(error) => error!(
      message = "Failed to load the latest locale gacha metadata",
      ?error
    ),
    Ok(None) => {}
    Ok(Some(latest_metadata)) => {
      info!(
        message = "Latest gacha metadata loaded successfully",
        hash = %latest_metadata.hash,
      );
      return RwLock::new(Arc::new(latest_metadata));
    }
  }

  RwLock::new(Arc::new(metadata))
});

const GACHA_METADATA_DIRECTORY: &str = "GachaMetadata";
const GACHA_METADATA_LATEST: &str = "Latest.json";

fn latest_metadata_file() -> PathBuf {
  let gacha_metadata_dir = consts::PLATFORM
    .appdata_local
    .join(consts::ID)
    .join(GACHA_METADATA_DIRECTORY);

  fs::create_dir_all(&gacha_metadata_dir).expect("Failed to create gacha metadata directory");

  gacha_metadata_dir.join(GACHA_METADATA_LATEST)
}

#[cfg(not(test))]
fn load_latest_metadata() -> Result<Option<GachaMetadata>, Box<dyn StdError + 'static>> {
  use std::fs::File;
  use std::io::Read;

  let latest_metadata_path = latest_metadata_file();
  if !latest_metadata_path.exists() {
    return Ok(None);
  }

  let mut latest_metadata_file = File::open(&latest_metadata_path)?;
  let mut buf = vec![];
  latest_metadata_file.read_to_end(&mut buf)?;

  match GachaMetadata::from_bytes(buf) {
    Ok(metadata) => Ok(Some(metadata)),
    Err(error) => {
      // JSON syntax error, possibly caused by manual modification by the user.
      // Remove this latest file
      fs::remove_file(latest_metadata_path)?;
      Err(error.into())
    }
  }
}

#[derive(Debug, Deserialize)]
struct GachaMetadataIndex {
  latest: String, // SHA-1
  entries: HashMap<String, GachaMetadataIndexEntry>,
}

#[derive(Debug, Deserialize)]
struct GachaMetadataIndexEntry {
  #[serde(rename = "createdAt", with = "rfc3339")]
  created_at: OffsetDateTime,
  file: String,
  size: u64,
}

impl GachaMetadata {
  pub fn current() -> &'static Self {
    let guard = ACTIVATE_METADATA
      .read()
      .expect("Gacha metadata lock poisoned");

    unsafe { &*Arc::as_ptr(&guard) }
  }

  pub fn is_updating() -> bool {
    ACTIVATE_METADATA_UPDATING.load(Ordering::SeqCst)
  }

  pub async fn update() -> Result<(), Box<dyn StdError + 'static>> {
    if ACTIVATE_METADATA_UPDATING.swap(true, Ordering::SeqCst) {
      return Err("Gacha metadata is already updating".into());
    }

    struct UpdateGuard;
    impl Drop for UpdateGuard {
      fn drop(&mut self) {
        ACTIVATE_METADATA_UPDATING.store(false, Ordering::SeqCst);
      }
    }
    let _update_guard = UpdateGuard;

    const API_BASE_URL: &str = "https://hoyo-gacha-v1.lgou2w.com/GachaMetadata";
    const API_TIMEOUT: Duration = Duration::from_secs(15);

    info!("Checking for latest gacha metadata...");
    let metadata_index = consts::REQWEST
      .get(format!("{API_BASE_URL}/{}", "index.json"))
      .timeout(API_TIMEOUT)
      .send()
      .await?
      .error_for_status()?
      .json::<GachaMetadataIndex>()
      .await?;

    info!(
      message = "Latest gacha metadata index loaded",
      ?metadata_index
    );

    if Self::current().hash == metadata_index.latest {
      info!(
        message = "Gacha metadata is already up-to-date",
        hash = %metadata_index.latest,
      );
      return Ok(());
    }

    let start = Instant::now();
    let latest_metadata_entry =
      metadata_index
        .entries
        .get(&metadata_index.latest)
        .ok_or(format!(
          "Latest gacha metadata entry not found in index: {}",
          metadata_index.latest
        ))?;

    let latest_metadata_res = consts::REQWEST
      .get(format!("{API_BASE_URL}/{}", latest_metadata_entry.file))
      .timeout(API_TIMEOUT)
      .send()
      .await?
      .error_for_status()?
      .bytes()
      .await?;

    let downloaded_hash = sha1sum(&latest_metadata_res);
    if downloaded_hash != metadata_index.latest {
      return Err(
        format!(
          "Downloaded gacha metadata hash mismatch: expected {}, got {}",
          metadata_index.latest, downloaded_hash
        )
        .into(),
      );
    }

    let latest_metadata = GachaMetadata::from_bytes(&latest_metadata_res)?;

    {
      let mut current = ACTIVATE_METADATA
        .write()
        .expect("Gacha metadata lock poisoned");

      *current = Arc::new(latest_metadata);
    }

    let latest_metadata_path = latest_metadata_file();
    if let Err(error) = fs::write(&latest_metadata_path, &latest_metadata_res) {
      error!(
        message = "Failed to save latest gacha metadata",
        path = ?latest_metadata_path,
        ?error
      );
    }

    info!(
      message = "Gacha metadata updated successfully",
      elapsed = ?start.elapsed(),
      hash = %metadata_index.latest,
      createdAt = %latest_metadata_entry.created_at,
    );

    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_example() {
    let json = r#"
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
      }"#;

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
      s.entry_from_id("10000002"),
      Some(GachaMetadataEntryRef {
        locale: "en-us",
        category: GachaMetadata::CATEGORY_CHARACTER,
        category_name: "Character",
        id: "10000002",
        name: "Kamisato Ayaka",
        rank: 5,
        limited: &GachaMetadataEntryLimited::Yes,
      })
    );

    assert_eq!(
      s.entry_from_name_first("Jean"),
      Some(GachaMetadataEntryRef {
        locale: "en-us",
        category: GachaMetadata::CATEGORY_CHARACTER,
        category_name: "Character",
        id: "10000003",
        name: "Jean",
        rank: 5,
        limited: &GachaMetadataEntryLimited::No,
      })
    );

    assert_eq!(
      s.entry_from_name("Traveler"),
      Some(HashSet::from_iter([
        GachaMetadataEntryRef {
          locale: "en-us",
          category: GachaMetadata::CATEGORY_CHARACTER,
          category_name: "Character",
          id: "10000005",
          name: "Traveler",
          rank: 5,
          limited: &GachaMetadataEntryLimited::No,
        },
        GachaMetadataEntryRef {
          locale: "en-us",
          category: GachaMetadata::CATEGORY_CHARACTER,
          category_name: "Character",
          id: "10000007",
          name: "Traveler",
          rank: 5,
          limited: &GachaMetadataEntryLimited::No,
        }
      ]))
    );

    assert_eq!(
      s.entry_from_name_first("Mistsplitter Reforged"),
      Some(GachaMetadataEntryRef {
        locale: "en-us",
        category: GachaMetadata::CATEGORY_WEAPON,
        category_name: "Weapon",
        id: "11509",
        name: "Mistsplitter Reforged",
        rank: 5,
        limited: &GachaMetadataEntryLimited::Yes,
      })
    );

    assert_eq!(
      s.entry_from_name_first("Kamisato Ayaka"),
      s.entry_from_id("10000002")
    );
    assert_eq!(s.entry_from_name_first("Jean"), s.entry_from_id("10000003"));
    assert_eq!(
      s.entry_from_name("Traveler"),
      Some(HashSet::from_iter([
        s.entry_from_id("10000005").unwrap(),
        s.entry_from_id("10000007").unwrap()
      ]))
    );
    assert_eq!(
      s.entry_from_name_first("Mistsplitter Reforged"),
      s.entry_from_id("11509")
    );

    s = metadata.obtain(Business::GenshinImpact, "zh-cn").unwrap();

    assert!(s.ids().any(|id| id == "10000002"
      || id == "10000003"
      || id == "10000005"
      || id == "10000007"
      || id == "11509"));

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
        id: "10000002",
        name: "神里绫华",
        rank: 5,
        limited: &GachaMetadataEntryLimited::Yes,
      })
    );

    assert_eq!(
      s.entry_from_id("10000003"),
      Some(GachaMetadataEntryRef {
        locale: "zh-cn",
        category: GachaMetadata::CATEGORY_CHARACTER,
        category_name: "角色",
        id: "10000003",
        name: "琴",
        rank: 5,
        limited: &GachaMetadataEntryLimited::No,
      })
    );

    assert_eq!(
      s.entry_from_name("旅行者"),
      Some(HashSet::from_iter([
        GachaMetadataEntryRef {
          locale: "zh-cn",
          category: GachaMetadata::CATEGORY_CHARACTER,
          category_name: "角色",
          id: "10000005",
          name: "旅行者",
          rank: 5,
          limited: &GachaMetadataEntryLimited::No,
        },
        GachaMetadataEntryRef {
          locale: "zh-cn",
          category: GachaMetadata::CATEGORY_CHARACTER,
          category_name: "角色",
          id: "10000007",
          name: "旅行者",
          rank: 5,
          limited: &GachaMetadataEntryLimited::No,
        }
      ]))
    );

    assert_eq!(
      s.entry_from_id("11509"),
      Some(GachaMetadataEntryRef {
        locale: "zh-cn",
        category: GachaMetadata::CATEGORY_WEAPON,
        category_name: "武器",
        id: "11509",
        name: "雾切之回光",
        rank: 5,
        limited: &GachaMetadataEntryLimited::Yes,
      })
    );

    assert_eq!(
      s.entry_from_name_first("神里绫华"),
      s.entry_from_id("10000002")
    );
    assert_eq!(s.entry_from_name_first("琴"), s.entry_from_id("10000003"));
    assert_eq!(
      s.entry_from_name("旅行者"),
      Some(HashSet::from_iter([
        s.entry_from_id("10000005").unwrap(),
        s.entry_from_id("10000007").unwrap()
      ]))
    );
    assert_eq!(
      s.entry_from_name_first("雾切之回光"),
      s.entry_from_id("11509")
    );
  }

  #[test]
  fn test_embedded_metadata() {
    let _ = GachaMetadata::current();
  }
}
