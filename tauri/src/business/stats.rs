//! # Gacha statistics
//!
//! Computes a render-oriented summary (`GachaStats`) from a raw `GachaRecord[]`
//! for the frontend. The output is grouped, aggregated and pre-computed so the
//! UI can render directly without further math.
//!
//! ## Pipeline
//!
//! 1. **Group** records by `gacha_type` and resolve each to a [`BannerCategory`].
//!    Some businesses merge multiple `gacha_type`s into one banner, e.g. `Genshin
//!    Impact` merges `CHARACTER` and `CHARACTER2` because they share pity.
//!
//! 2. **Per-banner stats** ([`BannerStats`]) — for each banner, walk the records
//!    once per rarity and produce a [`RarityStatsMap`]:
//!    - **Green / Blue / Purple / Golden** — filtered by `rank_type`, each with
//!      its own pity counter so that pity is tracked independently per rarity.
//!    - **Pity** — counts pulls since the last hit of the same rarity. Reset on
//!      hit. `Zenless Zone Zero` has a special rule where a golden pull also resets
//!      the purple pity (see the `HACK` comment in `compute_purple_stats`).
//!    - **Up** — whether a pull is the featured item of the banner at the time,
//!      resolved via [`Metadata::banner`] against the record's `time`.
//!    - **Up-win** — consecutive golden pulls that were UP, used to compute the
//!      "win rate" of the 50/50 (or 75/25) mechanic.
//!    - **Average / Percentage** — average pity per hit and hit rate relative
//!      to all pulls of the banner.
//!
//! 3. **Aggregated stats** ([`AggregatedStats`]) — merge all non-Bangboo banners
//!    (Bangboo is a separate system in `Zenless Zone Zero`) into a single view,
//!    plus derived [`AggregatedTags`] such as luckiest / unluckiest pull, most
//!    repeated golden item, and the busiest calendar days. `Miliastra Wonderland`
//!    has no aggregation because its banners are fully independent.
//!
//! 4. **Serialize** — every numeric field is rounded to two decimals where
//!    relevant, and `Option` fields are skipped when absent so the frontend
//!    sees a compact JSON payload.
//!
//! ## Metadata
//!
//! Item names, categories and banner versions come from [`Metadata`], which may
//! be `None`. Locale resolution is cached per `record.lang` in
//! [`AnalyzeContext`] to keep the per-record cost O(1). When metadata is absent
//! or an item is not found, the raw `GachaRecord` fields are used as-is.

use std::collections::HashMap;
use std::sync::LazyLock;

use hg_gamebiz::Uid;
use hg_metadata::{Locale, Metadata, UpRarity};
use hg_url_scraper::GachaType;
use hg_url_scraper::GachaTypes::{Beyond, Hk4e, Hkrpg, Nap};
use serde::Serialize;
use time::serde::rfc3339;
use time::{Date, OffsetDateTime, UtcOffset};

use crate::database::schemas::{AccountBusiness, AnalysisGachaRecord, GachaRecord};

// See: app/routes/gacha/api/stats.ts

#[derive(Clone, Copy, Debug, Serialize, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum BannerCategory {
  // All
  Permanent,
  Character,
  Weapon,

  // 'Genshin Impact' and 'Honkai: Star Rail' only
  Beginner,
  //

  // 'Genshin Impact' only
  ChronicledAndLightrace,
  //

  // 'Honkai: Star Rail' only
  CollabCharacter,
  CollabWeapon,
  //

  // 'Zenless Zone Zero' only
  Bangboo,
  //

  // 'Genshin Impact: Miliastra Wonderland' only
  PermanentOde,
  EventOde,
  //

  // 'Zenless Zone Zero' only
  ExclusiveRescreening,
  WEngineReverberation,
  //
}

/// `gacha_type` → `BannerCategory` for each business.
static KNOWN_BANNER_CATEGORIES: LazyLock<
  HashMap<AccountBusiness, HashMap<GachaType, BannerCategory>>,
> = LazyLock::new(|| {
  HashMap::from_iter([
    (
      AccountBusiness::GenshinImpact,
      HashMap::from_iter([
        (Hk4e::BEGINNER, BannerCategory::Beginner),
        (Hk4e::PERMANENT, BannerCategory::Permanent),
        (Hk4e::CHARACTER, BannerCategory::Character),
        (Hk4e::CHARACTER2, BannerCategory::Character),
        (Hk4e::WEAPON, BannerCategory::Weapon),
        (Hk4e::CHRONICLED, BannerCategory::ChronicledAndLightrace),
      ]),
    ),
    (
      AccountBusiness::HonkaiStarRail,
      HashMap::from_iter([
        (Hkrpg::BEGINNER, BannerCategory::Beginner),
        (Hkrpg::PERMANENT, BannerCategory::Permanent),
        (Hkrpg::CHARACTER, BannerCategory::Character),
        (Hkrpg::LIGHTCONE, BannerCategory::Weapon),
        (Hkrpg::COLLAB_CHARACTER, BannerCategory::CollabCharacter),
        (Hkrpg::COLLAB_LIGHTCONE, BannerCategory::CollabWeapon),
      ]),
    ),
    (
      AccountBusiness::ZenlessZoneZero,
      HashMap::from_iter([
        (Nap::PERMANENT, BannerCategory::Permanent),
        (Nap::CHARACTER, BannerCategory::Character),
        (Nap::WENGINE, BannerCategory::Weapon),
        (Nap::BANGBOO, BannerCategory::Bangboo),
        (
          Nap::EXCLUSIVE_RESCREENING,
          BannerCategory::ExclusiveRescreening,
        ),
        (
          Nap::WENGINE_REVERBERATION,
          BannerCategory::WEngineReverberation,
        ),
      ]),
    ),
    (
      AccountBusiness::MiliastraWonderland,
      HashMap::from_iter([
        (Beyond::PERMANENT, BannerCategory::PermanentOde),
        (Beyond::EVENT, BannerCategory::EventOde),
      ]),
    ),
  ])
});

impl BannerCategory {
  /// Resolve a `BannerCategory` from the given business and `gacha_type`.
  pub fn from_gacha_type(business: AccountBusiness, n: GachaType) -> Option<Self> {
    KNOWN_BANNER_CATEGORIES.get(&business)?.get(&n).copied()
  }
}

/// Rarity of a gacha record. `Unknown` avoids panicking on unexpected `rank_type`.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Rarity {
  Golden,
  Purple,
  Blue,
  Green,        // Genshin Impact: Miliastra Wonderland
  Unknown(u32), // Avoid panic
}

impl Rarity {
  /// Resolve `Rarity` from the given business and `rank_type`. Returns `Unknown` for unexpected values.
  pub const fn rarity_of(business: AccountBusiness, rank_type: u32) -> Self {
    match business {
      AccountBusiness::GenshinImpact | AccountBusiness::HonkaiStarRail => match rank_type {
        5 => Self::Golden,
        4 => Self::Purple,
        3 => Self::Blue,
        _ => Self::Unknown(rank_type),
      },
      AccountBusiness::ZenlessZoneZero => match rank_type {
        4 => Self::Golden,
        3 => Self::Purple,
        2 => Self::Blue,
        _ => Self::Unknown(rank_type),
      },
      AccountBusiness::MiliastraWonderland => match rank_type {
        5 => Self::Golden,
        4 => Self::Purple,
        3 => Self::Blue,
        2 => Self::Green,
        _ => Self::Unknown(rank_type),
      },
    }
  }
}

pub struct RarityTable([Rarity; 6]);

impl RarityTable {
  pub const fn new(business: AccountBusiness) -> Self {
    Self([
      Rarity::rarity_of(business, 0),
      Rarity::rarity_of(business, 1),
      Rarity::rarity_of(business, 2),
      Rarity::rarity_of(business, 3),
      Rarity::rarity_of(business, 4),
      Rarity::rarity_of(business, 5),
    ])
  }

  #[inline]
  pub fn get(&self, rank_type: u32) -> Rarity {
    self
      .0
      .get(rank_type as usize)
      .copied()
      .unwrap_or(Rarity::Unknown(rank_type))
  }
}

impl BannerCategory {
  /// Get the max pity count for a given rarity in this banner category.
  pub const fn max_pity(&self, rarity: Rarity) -> u8 {
    match rarity {
      Rarity::Golden => match self {
        Self::Character
        | Self::Permanent
        | Self::ChronicledAndLightrace
        | Self::CollabCharacter
        | Self::ExclusiveRescreening => 90,
        Self::Weapon | Self::Bangboo | Self::CollabWeapon | Self::WEngineReverberation => 80,
        Self::EventOde => 70,
        Self::Beginner => 50,
        _ => 0,
      },
      Rarity::Purple => match self {
        Self::PermanentOde => 70,
        Self::EventOde => 10,
        _ => 10,
      },
      Rarity::Blue => match self {
        Self::PermanentOde => 5,
        _ => 0,
      },
      _ => 0,
    }
  }

  /// Calculate the pity progress percentage for a given pity count and rarity in this banner category.
  /// Returns a value between 0 and 100, representing the percentage of progress towards the maximum pity count.
  pub fn pity_progress(&self, pity: u64, rarity: Rarity) -> u8 {
    let max_pity = self.max_pity(rarity);
    if max_pity == 0 || pity == 0 {
      0
    } else {
      (pity as f32 / max_pity as f32 * 100.)
        .round()
        .clamp(0., 100.) as u8
    }
  }
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UsedPity {
  value: u64,
  progress: u8,
}

impl UsedPity {
  /// Compute a `UsedPity` instance from the given banner category, pity count, and rarity.
  fn compute(category: BannerCategory, value: u64, rarity: Rarity) -> Self {
    Self {
      value,
      progress: category.pity_progress(value, rarity),
    }
  }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StatsRecord<'a> {
  pub id: &'a str,
  #[serde(with = "rfc3339")]
  pub time: OffsetDateTime,
  pub item_id: u32,
  pub item_name: &'a str,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub item_category: Option<&'a str>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub used_pity: Option<UsedPity>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub is_up: Option<bool>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub version: Option<&'a str>,
  // 'Genshin Impact' Character only, Distinguish Character and Character-2
  #[serde(skip_serializing_if = "Option::is_none")]
  pub genshin_impact_character2: Option<bool>,
  // 'Genshin Impact: Miliastra Wonderland' EventOde only,
  // Distinguish EventOde-1_1, EventOde-1_2, EventOde-2_1, EventOde-2_2
  #[serde(skip_serializing_if = "Option::is_none")]
  pub miliastra_wonderland_event_ode: Option<GachaType>,
}

#[derive(Clone, Debug)]
pub struct AnalyzeRecord<'a> {
  pub id: &'a str,
  pub time: OffsetDateTime,
  pub gacha_type: GachaType,
  pub lang: &'a str,
  pub item_id: u32,
  pub item_name: &'a str,
  pub rank_type: u32,
}

impl<'a> From<&'a GachaRecord> for AnalyzeRecord<'a> {
  fn from(row: &'a GachaRecord) -> Self {
    Self {
      id: &row.id,
      time: row.time,
      gacha_type: row.gacha_type,
      lang: &row.lang,
      item_id: row.item_id,
      item_name: &row.item_name,
      rank_type: row.rank_type,
    }
  }
}

impl<'a> From<&'a AnalysisGachaRecord> for AnalyzeRecord<'a> {
  fn from(row: &'a AnalysisGachaRecord) -> Self {
    Self {
      id: &row.id,
      time: row.time,
      gacha_type: row.gacha_type,
      lang: &row.lang,
      item_id: row.item_id,
      item_name: &row.item_name,
      rank_type: row.rank_type,
    }
  }
}

/// Analysis-wide inputs, shared by every compute function.
/// Add new analysis-wide fields here to avoid touching call sites.
pub struct AnalyzeContext<'a> {
  pub metadata: Option<&'a dyn Metadata>,
  pub business: AccountBusiness,
  pub uid: Uid,
  pub records: &'a [AnalyzeRecord<'a>],
  custom_locale_ref: Option<&'a dyn Locale>,
  locale_by_lang: HashMap<&'a str, Option<&'a dyn Locale>>,
  rarity_table: RarityTable,
}

impl<'a> AnalyzeContext<'a> {
  pub fn new(
    metadata: Option<&'a dyn Metadata>,
    business: AccountBusiness,
    uid: Uid,
    records: &'a [AnalyzeRecord<'a>],
    custom_locale: Option<&'a str>,
  ) -> Self {
    let mut custom_locale_ref: Option<&dyn Locale> = None;

    // `record.lang`: Generally speaking, they are the same value.
    let mut locale_by_lang = HashMap::with_capacity(1);

    if let Some(metadata) = metadata {
      // Resolve custom_locale once.
      if let Some(locale) = custom_locale {
        custom_locale_ref = metadata.locale(business.into(), locale);
      }

      // Resolve each distinct `record.lang` once.
      for record in records {
        locale_by_lang
          .entry(record.lang)
          .or_insert_with(|| metadata.locale(business.into(), record.lang));
      }
    }

    Self {
      metadata,
      business,
      uid,
      records,
      custom_locale_ref,
      locale_by_lang,
      rarity_table: RarityTable::new(business),
    }
  }

  fn locale(&self, record: &AnalyzeRecord<'a>) -> Option<&'a dyn Locale> {
    // Use the custom locale if provided, otherwise fall back to the locale associated with the record's language.
    if let Some(locale) = self.custom_locale_ref {
      return Some(locale);
    }

    match self.locale_by_lang.get(record.lang) {
      Some(locale) => *locale,
      None => None,
    }
  }

  #[inline]
  fn rarity_of(&self, rank_type: u32) -> Rarity {
    self.rarity_table.get(rank_type)
  }
}

impl<'a> StatsRecord<'a> {
  /// Resolve a `StatsRecord` from the given metadata, banner category, gacha record, optional pity count, and optional custom locale.
  pub fn resolve(
    ctx: &AnalyzeContext<'a>,
    category: BannerCategory,
    record: &'a AnalyzeRecord<'a>,
    pity: Option<u64>,
  ) -> Self {
    let (item_id, item_name, item_category) = match ctx
      .locale(record)
      .and_then(|locale| locale.item(record.item_id))
    {
      Some(item) => (item.item_id, item.item_name, Some(item.category)),
      None => (record.item_id, record.item_name, None),
    };

    let rarity = ctx.rarity_of(record.rank_type);
    let used_pity = pity.map(|n| UsedPity::compute(category, n, rarity));

    let (is_up, version) = ctx
      .metadata
      .and_then(|metadata| metadata.banner(ctx.business.into(), record.gacha_type, record.time))
      .map(|banner| {
        let is_up = match rarity {
          Rarity::Golden if banner.is_up(record.item_id, UpRarity::Golden) => Some(true),
          Rarity::Purple if banner.is_up(record.item_id, UpRarity::Purple) => Some(true),
          _ => None,
        };

        (is_up, banner.version())
      })
      .unwrap_or_default();

    let genshin_impact_character2 = (ctx.business == AccountBusiness::GenshinImpact
      && record.gacha_type == Hk4e::CHARACTER2)
      .then_some(true);

    let miliastra_wonderland_event_ode = (ctx.business == AccountBusiness::MiliastraWonderland
      && category == BannerCategory::EventOde)
      .then_some(record.gacha_type);

    Self {
      id: record.id,
      time: record.time,
      item_id,
      item_name,
      item_category,
      used_pity,
      is_up,
      version,
      genshin_impact_character2,
      miliastra_wonderland_event_ode,
    }
  }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GachaStats<'a> {
  pub business: AccountBusiness,
  pub uid: u32,
  pub total: usize,
  #[serde(with = "rfc3339::option", skip_serializing_if = "Option::is_none")]
  pub start_time: Option<OffsetDateTime>,
  #[serde(with = "rfc3339::option", skip_serializing_if = "Option::is_none")]
  pub end_time: Option<OffsetDateTime>,
  pub gacha_type_categories: HashMap<GachaType, BannerCategory>,
  pub banners: HashMap<BannerCategory, BannerStats<'a>>,
  pub aggregated: Option<AggregatedStats<'a>>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BannerStats<'a> {
  pub category: BannerCategory,
  pub gacha_type: GachaType,
  pub total: usize,
  #[serde(with = "rfc3339::option", skip_serializing_if = "Option::is_none")]
  pub start_time: Option<OffsetDateTime>,
  #[serde(with = "rfc3339::option", skip_serializing_if = "Option::is_none")]
  pub end_time: Option<OffsetDateTime>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub last_end_id: Option<&'a str>,
  pub rarity: RarityStatsMap<'a>,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AggregatedStats<'a> {
  pub total: usize,
  #[serde(with = "rfc3339::option", skip_serializing_if = "Option::is_none")]
  pub start_time: Option<OffsetDateTime>,
  #[serde(with = "rfc3339::option", skip_serializing_if = "Option::is_none")]
  pub end_time: Option<OffsetDateTime>,
  pub rarity: RarityStatsMap<'a>,
  pub tags: AggregatedTags<'a>,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RarityStatsMap<'a> {
  // Only 'Genshin Impact: Miliastra Wonderland' has Green rarity
  #[serde(skip_serializing_if = "Option::is_none")]
  pub green: Option<RarityStats<'a>>,
  pub blue: PityRarityStats<'a>,
  pub purple: UpRarityStats<'a>,
  pub golden: UpWinRarityStats<'a>,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RarityStats<'a> {
  pub values: Vec<StatsRecord<'a>>,
  pub sum: usize,
  pub percentage: f64,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PityRarityStats<'a> {
  pub values: Option<Vec<StatsRecord<'a>>>,
  pub sum: usize,
  pub used_pity_sum: u64,
  pub percentage: f64,
  pub average: f64,
  pub next_pity: UsedPity,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpRarityStats<'a> {
  pub values: Vec<StatsRecord<'a>>,
  pub sum: usize,
  pub used_pity_sum: u64,
  pub percentage: f64,
  pub average: f64,
  pub next_pity: UsedPity,
  pub up: UpStats,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpWinRarityStats<'a> {
  pub values: Vec<StatsRecord<'a>>,
  pub sum: usize,
  pub used_pity_sum: u64,
  pub average: f64,
  pub percentage: f64,
  pub next_pity: UsedPity,
  pub up: UpStats,
  pub up_win: UpWinStats,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpStats {
  pub sum: usize,
  pub used_pity_sum: u64,
  pub average: f64,
  pub percentage: f64,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpWinStats {
  pub sum: usize,
  pub used_pity_sum: u64,
  pub percentage: f64,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AggregatedTags<'a> {
  pub luck: Option<StatsRecord<'a>>,
  pub unluck: Option<StatsRecord<'a>>,
  pub relation: Option<(StatsRecord<'a>, u64)>, // _, sum
  pub crazy: Option<(u64, u64)>,                // Unix timestamp in seconds, sum
  pub recent: Option<(u64, u64)>,               // Unix timestamp in seconds, sum
}

// region: Compute

impl<'a> GachaStats<'a> {
  /// Analyze the given records and produce aggregated stats.
  pub fn analyze(ctx: AnalyzeContext<'a>) -> Self {
    let total = ctx.records.len();
    let start_time = ctx.records.first().map(|e| e.time);
    let end_time = ctx.records.last().map(|e| e.time);

    let gacha_type_records: HashMap<GachaType, Vec<&'a AnalyzeRecord<'a>>> =
      ctx.records.iter().fold(HashMap::new(), |mut acc, record| {
        acc.entry(record.gacha_type).or_default().push(record);
        acc
      });

    let banners = compute_banners(&ctx, gacha_type_records);
    let aggregated = compute_aggregated(&ctx, &banners);
    let gacha_type_categories = banners
      .values()
      .map(|banner| (banner.gacha_type, banner.category))
      .collect();

    Self {
      business: ctx.business,
      uid: ctx.uid.value(),
      total,
      start_time,
      end_time,
      gacha_type_categories,
      banners,
      aggregated,
    }
  }
}

fn compute_banners<'a>(
  ctx: &AnalyzeContext<'a>,
  mut gacha_type_records: HashMap<GachaType, Vec<&'a AnalyzeRecord<'a>>>,
) -> HashMap<BannerCategory, BannerStats<'a>> {
  let Some(gacha_type_categories) = KNOWN_BANNER_CATEGORIES.get(&ctx.business) else {
    return Default::default();
  };

  let is_genshin_impact = ctx.business == AccountBusiness::GenshinImpact;
  let is_miliastra_wonderland = ctx.business == AccountBusiness::MiliastraWonderland;
  let mut banners = HashMap::with_capacity(gacha_type_categories.len());
  for (gacha_type, &category) in gacha_type_categories.iter().filter(|(gacha_type, _)| {
    // Genshin Impact: merge Character and Character-2 because they share pity.
    !(is_genshin_impact && **gacha_type == Hk4e::CHARACTER2)
  }) {
    let mut records = gacha_type_records.remove(gacha_type).unwrap_or_default();

    // Merge related gacha types into one banner.
    if is_genshin_impact && category == BannerCategory::Character {
      records.extend(
        gacha_type_records
          .remove(&Hk4e::CHARACTER2)
          .unwrap_or_default(),
      );
      records.sort_by(|a, b| a.id.cmp(b.id));
    } else if is_miliastra_wonderland && category == BannerCategory::EventOde {
      for extra in [
        Beyond::EVENT_MANEKIN,
        Beyond::EVENT_MANEKINA,
        Beyond::EVENT_MANEKIN2,
        Beyond::EVENT_MANEKINA2,
      ] {
        records.extend(gacha_type_records.remove(&extra).unwrap_or_default());
      }
      records.sort_by(|a, b| a.id.cmp(b.id));
    }

    let total = records.len();
    let start_time = records.first().map(|e| e.time);
    let end_time = records.last().map(|e| e.time);
    let last_end_id = records.last().map(|e| e.id);
    let rarity = compute_rarity_stats(ctx, category, &records);

    banners.insert(
      category,
      BannerStats {
        category,
        total,
        gacha_type: *gacha_type,
        start_time,
        end_time,
        last_end_id,
        rarity,
      },
    );
  }

  banners
}

/// Compute the percentage of a sum relative to a total, rounded to two decimal places.
macro_rules! percentage {
  ($total:expr, $sum:expr) => {
    if $sum > 0 {
      ($sum as f64 / $total as f64 * 10000.).round() / 100.
    } else {
      0.
    }
  };
}

/// Compute the average of a sum relative to a total, rounded to two decimal places.
macro_rules! average {
  ($used_pity_sum:expr, $sum:expr) => {
    if $sum > 0 {
      ($used_pity_sum as f64 / $sum as f64 * 100.).round() / 100.
    } else {
      0.
    }
  };
}

fn compute_rarity_stats<'a>(
  ctx: &AnalyzeContext<'a>,
  category: BannerCategory,
  records: &[&'a AnalyzeRecord<'a>],
) -> RarityStatsMap<'a> {
  RarityStatsMap {
    green: compute_green_stats(ctx, category, records),
    blue: compute_blue_stats(ctx, category, records),
    purple: compute_purple_stats(ctx, category, records),
    golden: compute_golden_stats(ctx, category, records),
  }
}

/// Green ranking: 'Genshin Impact: Miliastra Wonderland' only.
fn compute_green_stats<'a>(
  ctx: &AnalyzeContext<'a>,
  category: BannerCategory,
  records: &[&'a AnalyzeRecord<'a>],
) -> Option<RarityStats<'a>> {
  if ctx.business != AccountBusiness::MiliastraWonderland {
    return None;
  }

  let total = records.len();
  let values = records
    .iter()
    .filter(|e| ctx.rarity_of(e.rank_type) == Rarity::Green)
    .map(|e| StatsRecord::resolve(ctx, category, e, None))
    .collect::<Vec<_>>();

  let sum = values.len();
  Some(RarityStats {
    values,
    sum,
    percentage: percentage!(total, sum),
  })
}

fn compute_blue_stats<'a>(
  ctx: &AnalyzeContext<'a>,
  category: BannerCategory,
  records: &[&'a AnalyzeRecord<'a>],
) -> PityRarityStats<'a> {
  let is_miliastra_wonderland = ctx.business == AccountBusiness::MiliastraWonderland;
  let total = records.len();

  let mut pity = 0;
  let mut used_pity_sum = 0;

  let values = if is_miliastra_wonderland {
    let mut values = Vec::new();
    for record in records {
      pity += 1;
      if ctx.rarity_of(record.rank_type) == Rarity::Blue {
        values.push(StatsRecord::resolve(ctx, category, record, Some(pity)));
        used_pity_sum += pity;
        pity = 0;
      }
    }
    values
  } else {
    records
      .iter()
      .filter(|e| ctx.rarity_of(e.rank_type) == Rarity::Blue)
      .map(|e| StatsRecord::resolve(ctx, category, e, None))
      .collect::<Vec<_>>()
  };

  let sum = values.len();
  PityRarityStats {
    values: if is_miliastra_wonderland {
      Some(values)
    } else {
      // HACK: Too many, not yet used, so skip serializing to reduce payload size.
      None
    },
    sum,
    used_pity_sum,
    average: average!(used_pity_sum, sum),
    percentage: percentage!(total, sum),
    next_pity: UsedPity::compute(category, pity, Rarity::Blue),
  }
}

fn compute_purple_stats<'a>(
  ctx: &AnalyzeContext<'a>,
  category: BannerCategory,
  records: &[&'a AnalyzeRecord<'a>],
) -> UpRarityStats<'a> {
  let is_zenless_zone_zero = ctx.business == AccountBusiness::ZenlessZoneZero;
  let total = records.len();

  let mut values = Vec::new();
  let mut pity = 0;
  let mut used_pity_sum = 0;

  let mut up_sum = 0;
  let mut up_pity = 0;
  let mut up_used_pity_sum = 0;

  for record in records {
    pity += 1;
    up_pity += 1;

    let rarity = ctx.rarity_of(record.rank_type);
    let is_purple = rarity == Rarity::Purple;
    if is_purple {
      let stats = StatsRecord::resolve(ctx, category, record, Some(pity));
      if stats.is_up == Some(true) {
        up_sum += 1;
        up_used_pity_sum += up_pity;
        up_pity = 0;
      }

      values.push(stats);
    }

    // HACK: Regarding the guaranteed pity, will the 4-star item be pushed
    //   to the next pity or replaced by the 5-star item?
    // Genshin Impact or Honkai: Star Rail:
    //   4-star pushed to the next pity : 11 pity Hit.
    //   No 12 pity or more has been encountered yet!
    // Zenless Zone Zero:
    //   4-star replaced by the 5-star item : 20 pity Hit.
    // See:
    //   https://github.com/lgou2w/HoYo.Gacha/issues/114
    //   https://www.bilibili.com/opus/493346460748792677
    //   https://www.miyoushe.com/zzz/article/55348297
    if is_purple || (is_zenless_zone_zero && rarity == Rarity::Golden) {
      used_pity_sum += pity;
      pity = 0;
    }
  }

  let sum = values.len();
  UpRarityStats {
    values,
    sum,
    used_pity_sum,
    average: average!(used_pity_sum, sum),
    percentage: percentage!(total, sum),
    next_pity: UsedPity::compute(category, pity, Rarity::Purple),
    up: UpStats {
      sum: up_sum,
      used_pity_sum: up_used_pity_sum,
      average: average!(up_used_pity_sum, up_sum),
      percentage: percentage!(total, up_sum),
    },
  }
}

fn compute_golden_stats<'a>(
  ctx: &AnalyzeContext<'a>,
  category: BannerCategory,
  records: &[&'a AnalyzeRecord<'a>],
) -> UpWinRarityStats<'a> {
  let total = records.len();

  let mut values = Vec::new();
  let mut pity = 0;
  let mut used_pity_sum = 0;

  let mut up_sum = 0;
  let mut up_pity = 0;
  let mut up_used_pity_sum = 0;

  for record in records {
    pity += 1;
    up_pity += 1;

    if ctx.rarity_of(record.rank_type) == Rarity::Golden {
      let stats = StatsRecord::resolve(ctx, category, record, Some(pity));
      if stats.is_up == Some(true) {
        up_sum += 1;
        up_used_pity_sum += up_pity;
        up_pity = 0;
      }

      values.push(stats);
      used_pity_sum += pity;
      pity = 0;
    }
  }

  // Up-win: count consecutive UP pulls (including the first UP after a loss).
  let up_win_sum = {
    let mut count = 0;
    let mut prev_is_up: Option<bool> = None;
    for stats in &values {
      let is_up = stats.is_up == Some(true);
      if is_up && prev_is_up.unwrap_or(true) {
        count += 1;
      }
      prev_is_up = Some(is_up);
    }
    count
  };

  let sum = values.len();
  let next_pity = UsedPity::compute(category, pity, Rarity::Golden);

  UpWinRarityStats {
    values,
    sum,
    used_pity_sum,
    average: average!(used_pity_sum, sum),
    percentage: percentage!(total, sum),
    next_pity,
    up: UpStats {
      sum: up_sum,
      used_pity_sum: up_used_pity_sum,
      average: average!(up_used_pity_sum, up_sum),
      percentage: percentage!(total, up_sum),
    },
    up_win: UpWinStats {
      sum: up_win_sum,
      used_pity_sum: (sum - up_sum + up_win_sum) as u64,
      percentage: percentage!(sum - up_sum + up_win_sum, up_win_sum),
    },
  }
}

fn compute_aggregated<'a>(
  ctx: &AnalyzeContext<'a>,
  banners: &HashMap<BannerCategory, BannerStats<'a>>,
) -> Option<AggregatedStats<'a>> {
  // Miliastra Wonderland has completely independent gacha banners, no aggregated.
  if ctx.business == AccountBusiness::MiliastraWonderland {
    return None;
  }

  // Bangboo is a completely separate gacha banner
  //   and doesn't count towards the aggregated.
  let is_zenless_zone_zero = ctx.business == AccountBusiness::ZenlessZoneZero;
  let (total, start_time, end_time) = {
    let mut total = 0;
    let mut first: Option<OffsetDateTime> = None;
    let mut last: Option<OffsetDateTime> = None;

    for record in ctx.records {
      if is_zenless_zone_zero && record.gacha_type == Nap::BANGBOO {
        continue;
      }

      total += 1;

      if first.is_none() {
        first = Some(record.time);
      }

      last = Some(record.time);
    }

    (total, first, last)
  };

  let mut blue = PityRarityStats::default();
  let mut purple = UpRarityStats::default();
  let mut golden = UpWinRarityStats::default();

  for banner in banners
    .values()
    .filter(|e| e.category != BannerCategory::Bangboo)
  {
    blue.sum += banner.rarity.blue.sum;
    if let Some(values) = &banner.rarity.blue.values {
      blue
        .values
        .get_or_insert_with(Vec::new)
        .extend_from_slice(values);
    }

    purple.sum += banner.rarity.purple.sum;
    purple
      .values
      .extend_from_slice(&banner.rarity.purple.values);

    golden.sum += banner.rarity.golden.sum;
    golden.up_win.sum += banner.rarity.golden.up_win.sum;
    golden
      .values
      .extend_from_slice(&banner.rarity.golden.values);
  }

  if let Some(values) = &mut blue.values {
    values.sort_by(|a, b| a.id.cmp(b.id));
  }
  purple.values.sort_by(|a, b| a.id.cmp(b.id));
  golden.values.sort_by(|a, b| a.id.cmp(b.id));

  macro_rules! compute_ranking {
    ($values:expr, $ranking:expr $(, $up_win:expr)?) => {{
      let sum = $ranking.sum;
      let mut used_pity_sum = 0;
      let mut up_sum = 0;
      let mut up_pity = 0;
      let mut up_used_pity_sum = 0;

      for stats in $values {
        let used_pity = stats.used_pity.as_ref().map(|p| p.value).unwrap_or_default();

        used_pity_sum += used_pity;
        up_pity += used_pity;

        if stats.is_up == Some(true) {
          up_sum += 1;
          up_used_pity_sum += up_pity;
          up_pity = 0;
        }
      }

      $ranking.percentage = percentage!(total, sum);
      $ranking.average = average!(used_pity_sum, sum);
      $ranking.up.sum = up_sum;
      $ranking.up.percentage = percentage!(total, up_sum);
      $ranking.up.average = average!(up_used_pity_sum, up_sum);

      $(
        $up_win.percentage = percentage!(
          sum - up_sum + $up_win.sum,
          $up_win.sum
        );
      )?
    }};
  }

  compute_ranking! { &purple.values, purple };
  compute_ranking! { &golden.values, golden, golden.up_win };

  let tags = compute_aggregated_tags(ctx, &golden, is_zenless_zone_zero);

  Some(AggregatedStats {
    total,
    start_time,
    end_time,
    rarity: RarityStatsMap {
      green: None,
      blue,
      purple,
      golden,
    },
    tags,
  })
}

fn compute_aggregated_tags<'a>(
  ctx: &AnalyzeContext<'a>,
  golden: &UpWinRarityStats<'a>,
  skip_bangboo: bool,
) -> AggregatedTags<'a> {
  let mut tags = AggregatedTags::default();
  let server_timezone = ctx.uid.gamebiz().timezone();

  // Luck & Unluck
  {
    let (luck, unluck) = golden
      .values
      .iter()
      .filter_map(|e| e.used_pity.as_ref().map(|pity| (pity.value, e)))
      .fold((None, None), |(min, max), (v, e)| {
        (
          match min {
            Some((mv, _)) if mv <= v => min,
            _ => Some((v, e)),
          },
          match max {
            Some((mv, _)) if mv >= v => max,
            _ => Some((v, e)),
          },
        )
      });

    tags.luck = luck.map(|(_, e)| e.clone());
    tags.unluck = unluck.map(|(_, e)| e.clone());
  }

  // Relation
  {
    let mut counts: HashMap<u32, (&StatsRecord<'a>, u64)> =
      HashMap::with_capacity(golden.values.len());

    for stats in &golden.values {
      counts
        .entry(stats.item_id)
        .and_modify(|(_, sum)| *sum += 1)
        .or_insert((stats, 1));
    }

    let mut counts: Vec<_> = counts.into_values().collect();
    counts.sort_by_key(|(_, sum)| *sum);
    tags.relation = counts.last().map(|(e, sum)| ((*e).clone(), *sum));
  }

  // Crazy & Recent
  {
    let mut dates: HashMap<Date, u64> = HashMap::new();
    for record in ctx.records {
      if skip_bangboo && record.gacha_type == Nap::BANGBOO {
        continue;
      }

      *dates.entry(record.time.date()).or_insert(0) += 1;
    }

    fn into_date((date, sum): &(Date, u64), server_timezone: UtcOffset) -> (u64, u64) {
      const MIDNIGHT: time::Time = time::macros::time!(00:00);

      let timestamp = date
        .with_time(MIDNIGHT)
        .assume_offset(server_timezone)
        .to_offset(UtcOffset::UTC)
        .unix_timestamp();

      (timestamp as _, *sum)
    }

    let mut dates: Vec<_> = dates.into_iter().collect();
    dates.sort_by_key(|(_, sum)| *sum);
    tags.crazy = dates.last().map(|it| into_date(it, server_timezone));

    // Re-sort by date
    dates.sort_by_key(|(date, _)| *date);
    tags.recent = dates.last().map(|it| into_date(it, server_timezone));
  }

  tags
}

// endregion

// Tests
#[cfg(test)]
mod tests {
  use crate::business::metadata::MetadataService;
  use crate::database::Database;
  use crate::database::schemas::GachaRecordQuestioner;

  use super::*;

  #[test]
  fn analyze() {
    let business = AccountBusiness::GenshinImpact;
    let uid = Uid::parse(business.as_game(), 100000000).unwrap();

    let records = [GachaRecord {
      business,
      uid: uid.value(),
      id: "1".into(),
      gacha_type: 301,
      gacha_id: None,
      rank_type: 5,
      count: 1,
      lang: "zh-cn".into(),
      time: time::macros::datetime!(2025-01-01 00:00:00 +08:00),
      item_name: "刻晴".into(),
      item_type: "角色".into(),
      item_id: 10000042,
      properties: None,
    }];

    let records: Vec<_> = records.iter().map(AnalyzeRecord::from).collect();
    let _stats = GachaStats::analyze(AnalyzeContext::new(
      Some(MetadataService::embedded()),
      business,
      uid,
      &records[..],
      None,
    ));
  }

  #[ignore = "Hard-code unit test"]
  #[tokio::test]
  async fn database_analyze() {
    let business = AccountBusiness::GenshinImpact;
    let uid = Uid::parse(business.as_game(), 100000000).unwrap();

    let database = Database::new().await.unwrap();
    let records = database
      .interact(move |conn| conn.find_analysis_records(business, uid.value()))
      .await
      .unwrap();

    let records: Vec<_> = records.iter().map(AnalyzeRecord::from).collect();
    let _stats = GachaStats::analyze(AnalyzeContext::new(
      Some(MetadataService::embedded()),
      business,
      uid,
      &records[..],
      None,
    ));

    // let file = std::fs::File::create("./stats.txt").unwrap();
    // serde_json::to_writer_pretty(std::io::BufWriter::new(file), &_stats).unwrap();
  }
}
