use std::collections::hash_map::Values as MapValues;
use std::collections::{BTreeMap, HashMap, HashSet};
use std::ops::Deref;
use std::sync::{Arc, LazyLock, OnceLock};

use snafu::{Snafu, ensure};
use time::OffsetDateTime;

use crate::raw::{RawBanner, RawBusiness, RawCategory, RawLocale, RawMetadata, RawVersionPoint};
use crate::{Banner, Item, Locale, Metadata, UpRarity, VersionTimeline};

#[derive(Debug, Snafu)]
#[snafu(display(
  "Mismatched items/names length in business {bid}, locale {locale}, \
  category {category}: {items} items vs {names} names",
))]
pub struct MismatchedItemsAndNames {
  pub bid: u8,
  pub locale: Arc<str>,
  pub category: Arc<str>,
  pub items: usize,
  pub names: usize,
}

/// Bake raw metadata into a [`Metadata`] trait object.
#[inline]
pub(crate) fn bake(raw: RawMetadata) -> Result<Box<dyn Metadata>, MismatchedItemsAndNames> {
  let businesses = raw
    .into_inner()
    .into_iter()
    .map(bake_business)
    .collect::<Result<_, _>>()?;

  Ok(Box::new(BakedMetadata { businesses }))
}

// Baked implementations

/// Fully baked metadata. Implements [`Metadata`] by delegating to the
/// per-business baked structures.
#[derive(Debug)]
struct BakedMetadata {
  /// `business_id` → business data.
  businesses: HashMap<u8, BakedBusiness>,
}

/// Baked data for a single business.
#[derive(Debug)]
struct BakedBusiness {
  /// `locale` → localized items + category names.
  locales: HashMap<Arc<str>, Box<dyn Locale>>,
  /// `gacha_type` → banners of that type.
  banners: HashMap<u32, BannerSet>,
  /// Business-wide version timeline.
  versions: Option<VersionTimeline>,
}

/// Baked locale: all items for one `(business, locale)` pair.
#[derive(Debug)]
struct BakedLocale {
  locale: Arc<str>,
  /// `category` → localized category name.
  categories: HashMap<Arc<str>, String>,
  /// `item_id` → baked item.
  items: HashMap<u32, BakedItem>,
  /// Lazily-built `item_name` → item id(s) reverse index.
  by_name: OnceLock<HashMap<Arc<str>, NameMatch>>,
}

impl BakedLocale {
  fn by_name_index(&self) -> &HashMap<Arc<str>, NameMatch> {
    self.by_name.get_or_init(|| {
      let mut index = HashMap::with_capacity(self.items.len());

      for (item_id, item) in &self.items {
        let item_name = Arc::clone(&item.item_name);

        index
          .entry(item_name)
          .and_modify(|matched| match matched {
            NameMatch::One(prev_id) => {
              *matched = NameMatch::Many(HashSet::from_iter([*prev_id, *item_id]));
            }
            NameMatch::Many(ids) => {
              ids.insert(*item_id);
            }
          })
          .or_insert(NameMatch::One(*item_id));
      }

      index
    })
  }
}

/// A single baked item: category + localized name + rank.
#[derive(Debug)]
struct BakedItem {
  category: Arc<str>,
  item_name: Arc<str>,
  rank_type: u8,
}

impl BakedItem {
  /// Build a borrowed [`Item`] view of this item.
  #[inline]
  #[must_use]
  fn as_item<'a>(&'a self, owner: &'a BakedLocale, item_id: u32) -> Item<'a> {
    Item {
      locale: &owner.locale,
      category: &self.category,
      category_name: owner
        .categories
        .get(&*self.category)
        .expect("category must exist for every item"),
      item_id,
      item_name: &self.item_name,
      rank_type: self.rank_type,
    }
  }
}

/// Result of looking up an `item_name` — either a unique id or a set of ids.
#[derive(Debug)]
enum NameMatch {
  One(u32),
  Many(HashSet<u32>),
}

/// All banners for a single `gacha_type`, indexed by start / end time.
#[derive(Debug)]
struct BannerSet {
  inner: Vec<Box<dyn Banner>>,
  /// `start_time` → indices into `inner`.
  by_start: BTreeMap<OffsetDateTime, Vec<usize>>,
  /// `end_time` → indices into `inner`.
  by_end: BTreeMap<OffsetDateTime, Vec<usize>>,
}

impl BannerSet {
  fn new(inner: Vec<Box<dyn Banner>>) -> Self {
    let mut by_start: BTreeMap<OffsetDateTime, Vec<usize>> = BTreeMap::new();
    let mut by_end: BTreeMap<OffsetDateTime, Vec<usize>> = BTreeMap::new();

    for (idx, banner) in inner.iter().enumerate() {
      by_start.entry(*banner.start_time()).or_default().push(idx);
      by_end.entry(*banner.end_time()).or_default().push(idx);
    }

    Self {
      inner,
      by_start,
      by_end,
    }
  }

  /// Return the banner active at `point`, if any.
  ///
  /// A banner is active when `start_time <= point <= end_time`.
  /// When banners overlap, the first match wins.
  fn find_active_at(&self, point: OffsetDateTime) -> Option<&dyn Banner> {
    let started: Vec<usize> = self
      .by_start
      .range(..=point)
      .flat_map(|(_, indices)| indices.iter().copied())
      .collect();

    if started.is_empty() {
      return None;
    }

    let not_ended: Vec<usize> = self
      .by_end
      .range(point..)
      .flat_map(|(_, indices)| indices.iter().copied())
      .collect();

    if not_ended.is_empty() {
      return None;
    }

    // Scan the smaller set for a member of the larger one.
    let (smaller, larger) = if started.len() <= not_ended.len() {
      (&started, &not_ended)
    } else {
      (&not_ended, &started)
    };

    let larger_set: HashSet<usize> = larger.iter().copied().collect();

    smaller
      .iter()
      .find(|idx| larger_set.contains(idx))
      .map(|&idx| self.inner[idx].deref())
  }
}

/// A single baked banner.
#[derive(Debug)]
struct BakedBanner {
  gacha_type: u32,
  start_time: OffsetDateTime,
  end_time: OffsetDateTime,
  up_golden: HashSet<u32>,
  up_purple: HashSet<u32>,
  version: Option<String>,
}

/// Maps ISO 639 locale aliases to their BCP 47 forms.
///
/// [`Metadata::locale`] resolves aliases transparently — e.g. `"en"` maps to
/// `"en-us"`.
///
/// See:
/// * https://github.com/lgou2w/HoYo.Gacha/issues/89
/// * https://github.com/lgou2w/HoYo.Gacha/issues/118
pub static LOCALE_ALIASES: LazyLock<HashMap<&'static str, &'static str>> = LazyLock::new(|| {
  HashMap::from_iter([
    ("de", "de-de"),
    ("en", "en-us"),
    ("es", "es-es"),
    ("fr", "fr-fr"),
    ("id", "id-id"),
    ("ja", "ja-jp"),
    ("ko", "ko-kr"),
    ("pt", "pt-pt"),
    ("ru", "ru-ru"),
    ("th", "th-th"),
    ("tr", "tr-tr"),
    ("vi", "vi-vn"),
    // Chinese variants — legacy codes map onto the two canonical forms.
    ("zh", "zh-cn"),
    ("zh-cn", "zh-cn"),
    ("zh-sg", "zh-cn"),
    ("zh-hk", "zh-tw"),
    ("zh-mo", "zh-tw"),
    ("zh-tw", "zh-tw"),
  ])
});

impl Metadata for BakedMetadata {
  fn locale(&self, bid: u8, locale: &str) -> Option<&dyn Locale> {
    let map = &self.businesses.get(&bid)?.locales;

    map
      .get(locale)
      .or_else(|| LOCALE_ALIASES.get(locale).and_then(|alias| map.get(*alias)))
      .map(Box::deref)
  }

  fn locales(&self, bid: u8) -> Option<MapValues<'_, Arc<str>, Box<dyn Locale>>> {
    Some(self.businesses.get(&bid)?.locales.values())
  }

  fn banner(&self, bid: u8, gacha_type: u32, point: OffsetDateTime) -> Option<&dyn Banner> {
    self
      .businesses
      .get(&bid)?
      .banners
      .get(&gacha_type)?
      .find_active_at(point)
  }

  fn versions(&self, bid: u8) -> Option<&VersionTimeline> {
    self.businesses.get(&bid)?.versions.as_ref()
  }
}

impl Locale for BakedLocale {
  fn lang(&self) -> &str {
    &self.locale
  }

  fn items(&self) -> HashMap<u32, Item<'_>> {
    self
      .items
      .iter()
      .map(|(item_id, item)| (*item_id, item.as_item(self, *item_id)))
      .collect()
  }

  fn item(&self, item_id: u32) -> Option<Item<'_>> {
    self
      .items
      .get(&item_id)
      .map(|item| item.as_item(self, item_id))
  }

  fn items_by_name<'a, 'n: 'a>(&'a self, item_name: &'n str) -> Option<HashSet<Item<'a>>> {
    match self.by_name_index().get(item_name)? {
      NameMatch::One(item_id) => Some(HashSet::from_iter([self
        .items
        .get(item_id)?
        .as_item(self, *item_id)])),
      NameMatch::Many(item_ids) => Some(
        item_ids
          .iter()
          .filter_map(|id| self.items.get(id).map(|it| it.as_item(self, *id)))
          .collect(),
      ),
    }
  }

  #[inline]
  fn item_by_name<'a, 'n: 'a>(&'a self, item_name: &'n str) -> Option<Item<'a>> {
    self.items_by_name(item_name)?.into_iter().next()
  }
}

impl Banner for BakedBanner {
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

  #[inline]
  fn is_up(&self, item_id: u32, rarity: UpRarity) -> bool {
    match rarity {
      UpRarity::Golden => self.up_golden.contains(&item_id),
      UpRarity::Purple => self.up_purple.contains(&item_id),
    }
  }
}

fn bake_business(raw: RawBusiness) -> Result<(u8, BakedBusiness), MismatchedItemsAndNames> {
  let RawBusiness {
    id,
    categories,
    banners,
    versions,
  } = raw;

  Ok((
    id,
    BakedBusiness {
      locales: bake_locales(id, categories)?,
      banners: bake_banners(banners),
      versions: bake_version_timeline(versions),
    },
  ))
}

/// Group a business's categories by locale, producing one [`BakedLocale`] per
/// language.
fn bake_locales(
  bid: u8,
  categories: Vec<RawCategory>,
) -> Result<HashMap<Arc<str>, Box<dyn Locale>>, MismatchedItemsAndNames> {
  // Heuristic capacity: sum of i18n maps across all categories.
  let capacity: usize = categories.iter().map(|c| c.i18n.len()).sum();
  let mut locales: HashMap<Arc<str>, BakedLocale> = HashMap::with_capacity(capacity);

  for RawCategory {
    category,
    items,
    i18n,
  } in categories
  {
    let category: Arc<str> = Arc::from(category);
    let items_len = items.len();

    for (
      locale,
      RawLocale {
        category: category_name,
        items: item_names,
      },
    ) in i18n
    {
      // Names must be index-aligned with items; otherwise the raw data is
      // inconsistent and we cannot build a meaningful mapping.
      ensure!(
        items_len == item_names.len(),
        MismatchedItemsAndNamesSnafu {
          bid,
          locale,
          category,
          items: items_len,
          names: item_names.len(),
        }
      );

      let locale: Arc<str> = Arc::from(locale);

      // `(item_id, rank_type)` is `Copy`; reuse the same source list for
      // every locale without cloning a `Vec`.
      let new_items: HashMap<u32, BakedItem> = items
        .iter()
        .copied()
        .zip(item_names)
        .map(|((item_id, rank_type), item_name)| {
          (
            item_id,
            BakedItem {
              category: Arc::clone(&category),
              item_name: Arc::from(item_name),
              rank_type,
            },
          )
        })
        .collect();

      use std::collections::hash_map::Entry;
      match locales.entry(Arc::clone(&locale)) {
        Entry::Occupied(mut o) => {
          let baked = o.get_mut();
          baked.items.extend(new_items);
          baked
            .categories
            .insert(Arc::clone(&category), category_name);
        }
        Entry::Vacant(o) => {
          o.insert(BakedLocale {
            locale,
            categories: HashMap::from_iter([(Arc::clone(&category), category_name)]),
            items: new_items,
            by_name: OnceLock::new(),
          });
        }
      }
    }
  }

  Ok(
    locales
      .into_iter()
      .map(|(locale, v)| (locale, Box::new(v) as Box<dyn Locale>))
      .collect(),
  )
}

/// Group a business's banners by `gacha_type`, wrapping each group in a
/// [`BannerSet`] with start / end time indexes.
fn bake_banners(banners: Vec<RawBanner>) -> HashMap<u32, BannerSet> {
  let mut groups: HashMap<u32, Vec<Box<dyn Banner>>> = HashMap::new();

  for raw in banners {
    let banner: Box<dyn Banner> = Box::new(BakedBanner {
      gacha_type: raw.gacha_type,
      start_time: raw.start_time,
      end_time: raw.end_time,
      up_golden: raw.up_golden,
      up_purple: raw.up_purple,
      version: raw.version,
    });

    groups.entry(raw.gacha_type).or_default().push(banner);
  }

  groups
    .into_iter()
    .map(|(gacha_type, banners)| (gacha_type, BannerSet::new(banners)))
    .collect()
}

fn bake_version_timeline(raw: Option<Vec<RawVersionPoint>>) -> Option<VersionTimeline> {
  let mut baked: Vec<(OffsetDateTime, String)> =
    raw?.into_iter().map(|p| (p.since, p.version)).collect();

  // Config order should already be chronological, but sorting here means
  // metadata authors cannot silently break `partition_point` by reordering.
  baked.sort_by_key(|(t, _)| *t);

  Some(VersionTimeline::from_sorted(baked))
}
