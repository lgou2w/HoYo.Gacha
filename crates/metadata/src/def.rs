use std::collections::{BTreeMap, HashMap, HashSet};
use std::ops::Deref;
use std::sync::{Arc, OnceLock};

use snafu::{Snafu, ensure};
use time::OffsetDateTime;

use crate::raw::{RawMetadata, RawMetadataBusiness};
use crate::raw::{RawMetadataBanner, RawMetadataCategorization, RawMetadataI18n};
use crate::{Entry, Metadata, MetadataBanner, MetadataLocale};

#[derive(Debug)]
struct MetadataImpl {
  businesses: HashMap<u8, MetadataBusinessImpl>, // business_id : _
}

#[derive(Debug)]
struct MetadataBusinessImpl {
  locales: HashMap<Arc<str>, Box<dyn MetadataLocale>>, // locale name: _
  banners: HashMap<u32, MetadataBannersImpl>,          // gacha_type : banners
}

#[derive(Debug)]
struct MetadataLocaleImpl {
  locale: Arc<str>,
  categories: HashMap<Arc<str>, String>, // category: category local name
  entries: HashMap<u32, EntryImpl>,      // item_id : entry
  reverses: OnceLock<HashMap<Arc<str>, EntryNameId>>, // item_name: item_id (Lazy init)
}

impl MetadataLocaleImpl {
  fn reverses(&self) -> &HashMap<Arc<str>, EntryNameId> {
    self.reverses.get_or_init(|| {
      let mut name_ids = HashMap::with_capacity(self.entries.len());
      for (item_id, entry) in &self.entries {
        let item_name = Arc::clone(&entry.item_name);

        name_ids
          .entry(item_name)
          .and_modify(|name_id| match name_id {
            EntryNameId::Unique(prev_item_id) => {
              let item_ids = HashSet::from_iter([*prev_item_id, *item_id]);
              *name_id = EntryNameId::Many(item_ids)
            }
            EntryNameId::Many(item_ids) => {
              item_ids.insert(*item_id);
            }
          })
          .or_insert(EntryNameId::Unique(*item_id));
      }

      name_ids
    })
  }
}

#[derive(Debug)]
struct EntryImpl {
  category: Arc<str>,
  item_name: Arc<str>,
  rank_type: u8,
}

impl EntryImpl {
  #[inline]
  #[must_use]
  fn as_entry<'a>(&'a self, owner: &'a MetadataLocaleImpl, item_id: u32) -> Entry<'a> {
    Entry {
      locale: &owner.locale,
      category: &self.category,
      category_name: owner.categories.get(&*self.category).unwrap(), // SAFETY
      item_id,
      item_name: &self.item_name,
      rank_type: self.rank_type,
    }
  }
}

#[derive(Debug)]
enum EntryNameId {
  Unique(u32),
  Many(HashSet<u32>),
}

#[derive(Debug)]
struct MetadataBannersImpl {
  inner: Vec<Box<dyn MetadataBanner>>,
  start_time_index: BTreeMap<OffsetDateTime, Vec<usize>>,
  end_time_index: BTreeMap<OffsetDateTime, Vec<usize>>,
}

impl MetadataBannersImpl {
  fn new(inner: Vec<Box<dyn MetadataBanner>>) -> Self {
    let mut start_time_index = BTreeMap::new();
    let mut end_time_index = BTreeMap::new();

    for (idx, banner) in inner.iter().enumerate() {
      start_time_index
        .entry(*banner.start_time())
        .or_insert_with(Vec::new)
        .push(idx);

      end_time_index
        .entry(*banner.end_time())
        .or_insert_with(Vec::new)
        .push(idx);
    }

    Self {
      inner,
      start_time_index,
      end_time_index,
    }
  }

  fn find_active_at(&self, point: OffsetDateTime) -> Option<&dyn MetadataBanner> {
    let started_indices: Vec<usize> = self
      .start_time_index
      .range(..=point)
      .flat_map(|(_, indices)| indices.iter().copied())
      .collect();

    if started_indices.is_empty() {
      return None;
    }

    let not_ended_indices: Vec<usize> = self
      .end_time_index
      .range(point..)
      .flat_map(|(_, indices)| indices.iter().copied())
      .collect();

    if not_ended_indices.is_empty() {
      return None;
    }

    let (smaller, larger) = if started_indices.len() <= not_ended_indices.len() {
      (&started_indices, &not_ended_indices)
    } else {
      (&not_ended_indices, &started_indices)
    };

    let larger_set: HashSet<_> = larger.iter().collect();

    smaller
      .iter()
      .find(|&idx| larger_set.contains(idx))
      .map(|&idx| &self.inner[idx])
      .map(Box::deref)
  }
}

#[derive(Debug)]
struct MetadataBannerImpl {
  gacha_type: u32,
  start_time: OffsetDateTime,
  end_time: OffsetDateTime,
  up_golden: HashSet<u32>,
  up_purple: HashSet<u32>,
  version: Option<String>,
}

// rn: Trait

impl Metadata for MetadataImpl {
  fn locale(&self, business_id: u8, locale: &str) -> Option<&dyn MetadataLocale> {
    self
      .businesses
      .get(&business_id)?
      .locales
      .get(locale)
      .map(Box::deref)
  }

  fn query_banner(
    &self,
    business_id: u8,
    gacha_type: u32,
    point: OffsetDateTime,
  ) -> Option<&dyn MetadataBanner> {
    self
      .businesses
      .get(&business_id)?
      .banners
      .get(&gacha_type)?
      .find_active_at(point)
  }
}

impl MetadataLocale for MetadataLocaleImpl {
  fn entry_from_id(&self, item_id: u32) -> Option<Entry<'_>> {
    let find = self.entries.get(&item_id)?;
    let entry = find.as_entry(self, item_id);
    Some(entry)
  }

  fn entry_from_name<'a, 'n: 'a>(&'a self, item_name: &'n str) -> Option<HashSet<Entry<'a>>> {
    match self.reverses().get(item_name)? {
      EntryNameId::Unique(item_id) => {
        let unique = self.entries.get(item_id)?;
        let entry = unique.as_entry(self, *item_id);
        Some(HashSet::from_iter([entry]))
      }
      EntryNameId::Many(item_ids) => {
        let entries = item_ids
          .iter()
          .filter_map(|item_id| {
            let many = self.entries.get(item_id)?;
            let entry = many.as_entry(self, *item_id);
            Some(entry)
          })
          .collect();

        Some(entries)
      }
    }
  }

  #[inline]
  fn entry_from_name_first<'a, 'n: 'a>(&'a self, item_name: &'n str) -> Option<Entry<'a>> {
    self.entry_from_name(item_name)?.into_iter().next()
  }
}

impl MetadataBanner for MetadataBannerImpl {
  fn gacha_type(&self) -> u32 {
    self.gacha_type
  }

  fn start_time(&self) -> &OffsetDateTime {
    &self.start_time
  }

  fn end_time(&self) -> &OffsetDateTime {
    &self.end_time
  }

  fn version(&self) -> Option<&str> {
    self.version.as_deref()
  }

  fn is_up_golden(&self, item_id: u32) -> bool {
    self.up_golden.contains(&item_id)
  }

  fn is_up_purple(&self, item_id: u32) -> bool {
    self.up_purple.contains(&item_id)
  }
}

// endregion

// region: Bake metadata

#[derive(Debug, Snafu)]
pub enum BakeMetadataError {
  #[snafu(display(
    "Mismatched entries and i18n item names length for business_id {}, locale {}, category {}: entries length {}, item names length {}",
    business_id,
    locale,
    category,
    entries,
    item_names
  ))]
  MismatchedEntriesI18nLength {
    business_id: u8,
    locale: Arc<str>,
    category: Arc<str>,
    entries: usize,
    item_names: usize,
  },
}

// Bake raw metadata businesses into baked metadata businesses.
fn bake_metadata(raw: RawMetadata) -> Result<MetadataImpl, BakeMetadataError> {
  let raw = raw.into_inner();
  let mut businesses = HashMap::with_capacity(raw.len());

  for RawMetadataBusiness {
    id: business_id,
    categories,
    banners,
  } in raw
  {
    let locales = bake_metadata_locales(business_id, categories)?;
    let banners = bake_metadata_banners(banners);
    businesses.insert(business_id, MetadataBusinessImpl { locales, banners });
  }

  Ok(MetadataImpl { businesses })
}

// Bake raw metadata categorizations into baked metadata locales. (Grouped by locale)
fn bake_metadata_locales(
  business_id: u8,
  categories: Vec<RawMetadataCategorization>,
) -> Result<HashMap<Arc<str>, Box<dyn MetadataLocale>>, BakeMetadataError> {
  let i18n_total: usize = categories.iter().map(|c| c.i18n.len()).sum();
  let mut locales: HashMap<Arc<str>, MetadataLocaleImpl> = HashMap::with_capacity(i18n_total);

  for RawMetadataCategorization {
    category,
    entries,
    i18n,
  } in categories
  {
    let category = Arc::from(category);
    let entries_len = entries.len();

    for (
      locale,
      RawMetadataI18n {
        category: category_name,
        entries: item_names,
      },
    ) in i18n
    {
      // Ensure entries and i18n item names length match
      // Otherwise, it's a data inconsistency issue.
      ensure!(
        entries_len == item_names.len(),
        MismatchedEntriesI18nLengthSnafu {
          business_id,
          locale,
          category,
          entries: entries_len,
          item_names: item_names.len(),
        }
      );

      // Each i18n uses the same entries.
      // Because only item_id and rank_type are used, the cost of cloning is negligible.
      let locale = Arc::from(locale);
      let entries = entries.clone();

      // Build entries and item names mapping
      let new_entries = entries.into_iter().zip(item_names).fold(
        HashMap::with_capacity(entries_len),
        |mut acc, ((item_id, rank_type), item_name)| {
          acc.insert(
            item_id,
            EntryImpl {
              category: Arc::clone(&category),
              item_name: Arc::from(item_name),
              rank_type,
            },
          );
          acc
        },
      );

      use std::collections::hash_map::Entry as MapEntry;
      match locales.entry(Arc::clone(&locale)) {
        MapEntry::Occupied(mut o) => {
          let o: &mut MetadataLocaleImpl = o.get_mut();
          o.entries.extend(new_entries);
          o.categories.insert(Arc::clone(&category), category_name);
        }
        MapEntry::Vacant(o) => {
          o.insert(MetadataLocaleImpl {
            locale,
            categories: HashMap::from_iter([(Arc::clone(&category), category_name)]),
            entries: new_entries,
            reverses: OnceLock::new(),
          });
        }
      }
    }
  }

  Ok(
    locales
      .into_iter()
      .map(|(locale, v)| (locale, Box::new(v) as _))
      .collect(),
  )
}

// Bake raw metadata banners into baked metadata banners. (Grouped by gacha_type)
fn bake_metadata_banners(banners: Vec<RawMetadataBanner>) -> HashMap<u32, MetadataBannersImpl> {
  let mut groups = HashMap::new();
  for raw in banners {
    let banner = MetadataBannerImpl {
      gacha_type: raw.gacha_type,
      start_time: raw.start_time,
      end_time: raw.end_time,
      up_golden: raw.up_golden,
      up_purple: raw.up_purple,
      version: raw.version,
    };

    groups
      .entry(banner.gacha_type)
      .or_insert_with(Vec::new)
      .push(Box::new(banner) as Box<dyn MetadataBanner>);
  }

  groups
    .into_iter()
    .map(|(gacha_type, inner)| (gacha_type, MetadataBannersImpl::new(inner)))
    .collect()
}

// endregion

/// Bake raw metadata into baked metadata.
#[inline]
pub fn bake(raw: RawMetadata) -> Result<Box<dyn Metadata>, BakeMetadataError> {
  let baked = bake_metadata(raw)?;
  Ok(Box::new(baked))
}
