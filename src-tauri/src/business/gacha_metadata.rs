use std::collections::{HashMap, HashSet, hash_map};
use std::error::Error as StdError;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, LazyLock, OnceLock, RwLock};
use std::time::{Duration, Instant};
use std::{fmt, fs};

use serde::{Deserialize, Deserializer, Serialize};
use sha1::{Digest, Sha1};
use time::OffsetDateTime;
use time::serde::rfc3339;
use tracing::info;

use crate::consts;
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
  pub banners: HashMap<u32, GachaMetadataBanners>, // GachaType: Banners
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
pub enum GachaMetadataBanners {
  // 'Genshin Impact' and 'Zenless Zone Zero'
  Purely(Vec<GachaMetadataBanner>),
  // 'Honkai: Star Rail' -> GachaId: Banner
  ByGachaId(HashMap<u32, GachaMetadataBanner>),
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

  pub fn banners(&self, business: Business, gacha_type: u32) -> Option<&GachaMetadataBanners> {
    self.metadata.get(&business)?.banners.get(&gacha_type)
  }

  pub fn banner_from_record(&self, record: &GachaRecord) -> Option<&GachaMetadataBanner> {
    match self.banners(record.business, record.gacha_type)? {
      GachaMetadataBanners::Purely(vec) => vec
        .iter()
        .find(|banner| record.time >= banner.start_time && record.time <= banner.end_time),
      GachaMetadataBanners::ByGachaId(map) => record
        .gacha_id
        .and_then(|k| map.get(&k))
        .filter(|banner| record.time >= banner.start_time && record.time <= banner.end_time),
    }
  }
}

impl GachaMetadataLocale {
  #[cfg(test)]
  pub fn ids(&self) -> hash_map::Keys<'_, u32, GachaMetadataEntry> {
    self.entries.keys()
  }

  #[cfg(test)]
  pub fn names(&self) -> hash_map::Keys<'_, String, GachaMetadataEntryNameId> {
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
    self.entry_from_name(name)?.into_iter().next()
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

      let locales = raw_categories_into_locales(business, categories);
      let banners = raw_banners_into_banner_groups(business, banners);

      acc.insert(business, GachaMetadataBusiness { locales, banners });
      acc
    },
  )
}

fn raw_categories_into_locales(
  business: Business,
  categories: Vec<RawGachaMetadataCategorization>,
) -> HashMap<String, GachaMetadataLocale> {
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
}

fn raw_banners_into_banner_groups(
  business: Business,
  banners: Vec<RawGachaMetadataBanner>,
) -> HashMap<u32, GachaMetadataBanners> {
  let mut result: HashMap<u32, GachaMetadataBanners> = HashMap::new();
  for raw in banners {
    let banner = GachaMetadataBanner {
      gacha_type: raw.gacha_type,
      gacha_id: raw.gacha_id,
      start_time: raw.start_time,
      end_time: raw.end_time,
      up_golden: raw.up_golden,
      up_purple: raw.up_purple,
      version: raw.version,
    };

    match result.entry(banner.gacha_type) {
      hash_map::Entry::Vacant(o) => match business {
        Business::GenshinImpact | Business::ZenlessZoneZero => {
          o.insert(GachaMetadataBanners::Purely(vec![banner]));
        }
        Business::HonkaiStarRail => {
          assert!(
            banner.gacha_id.is_some(),
            "Honkai: Star Rail banners must have a GachaId"
          );

          let map = HashMap::from_iter([(banner.gacha_id.unwrap(), banner)]);
          o.insert(GachaMetadataBanners::ByGachaId(map));
        }
      },
      hash_map::Entry::Occupied(mut o) => match o.get_mut() {
        GachaMetadataBanners::Purely(vec) => {
          vec.push(banner);
        }
        GachaMetadataBanners::ByGachaId(map) => {
          map.insert(banner.gacha_id.unwrap(), banner);
        }
      },
    }
  }

  result
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
    Err(error) => tracing::error!(
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
const GACHA_METADATA_LATEST: &str = "LatestV2.json";

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
#[serde(rename_all = "PascalCase")]
struct GachaMetadataIndex {
  latest: String, // SHA-1
}

#[derive(Debug, Serialize)]
pub enum GachaMetadataUpdatedKind {
  Updating,
  UpToDate,
  Success(String), // SHA-1
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

  pub async fn update()
  -> Result<GachaMetadataUpdatedKind, Box<dyn StdError + Send + Sync + 'static>> {
    if ACTIVATE_METADATA_UPDATING.swap(true, Ordering::SeqCst) {
      return Ok(GachaMetadataUpdatedKind::Updating);
    }

    struct UpdateGuard;
    impl Drop for UpdateGuard {
      fn drop(&mut self) {
        ACTIVATE_METADATA_UPDATING.store(false, Ordering::SeqCst);
      }
    }
    let _update_guard = UpdateGuard;

    const API_BASE_URL: &str = "https://hoyo-gacha-v1.lgou2w.com/GachaMetadata/v2";
    const API_TIMEOUT: Duration = Duration::from_secs(15);

    info!("Checking for latest gacha metadata...");
    let metadata_index = consts::REQWEST
      .get(format!("{API_BASE_URL}/index.json"))
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
      return Ok(GachaMetadataUpdatedKind::UpToDate);
    }

    let start = Instant::now();
    let latest_metadata_res = consts::REQWEST
      .get(format!("{API_BASE_URL}/{}.json", metadata_index.latest))
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
      tracing::error!(
        message = "Failed to save latest gacha metadata",
        path = ?latest_metadata_path,
        ?error
      );
    }

    info!(
      message = "Gacha metadata updated successfully",
      elapsed = ?start.elapsed(),
      hash = %metadata_index.latest,
    );

    Ok(GachaMetadataUpdatedKind::Success(metadata_index.latest))
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
