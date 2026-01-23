use std::collections::HashMap;
use std::sync::LazyLock;

use hg_metadata::Metadata;
use serde::Serialize;
use time::serde::rfc3339;
use time::{Date, OffsetDateTime};

use crate::database::schemas::{AccountBusiness, GachaRecord};

// region: Types

#[derive(Clone, Copy, Debug, Serialize, PartialEq, Eq, Hash)]
pub enum PrettizedCategory {
  // All
  Permanent,
  Character,
  Weapon,

  // 'Genshin Impact' and 'Honkai: Star Rail' only
  Beginner,
  //

  // 'Genshin Impact' only
  Chronicled,
  //

  // 'Honkai: Star Rail' only
  CollaborationCharacter,
  CollaborationWeapon,
  //

  // 'Zenless Zone Zero' only
  Bangboo,
  //

  // 'Genshin Impact: Miliastra Wonderland' only
  PermanentOde,
  EventOde,
  //
}

pub const GENSHIN_IMPACT_PERMANENT: u32 = 200;
pub const GENSHIN_IMPACT_CHARACTER2: u32 = 400;
pub const HONKAI_STAR_RAIL_PERMANENT: u32 = 1;
pub const HONKAI_STAR_RAIL_COLLABORATION_CHARACTER: u32 = 21;
pub const HONKAI_STAR_RAIL_COLLABORATION_WEAPON: u32 = 22;
pub const ZENLESS_ZONE_ZERO_PERMANENT: u32 = 1;
pub const ZENLESS_ZONE_ZERO_BANGBOO: u32 = 5;
pub const MILIASTRA_WONDERLAND_PERMANENT_ODE: u32 = 1000;
pub const MILIASTRA_WONDERLAND_EVENT_ODE: u32 = 2000; // Includes: 20011, 20021, 20012, 20022
pub const MILIASTRA_WONDERLAND_EVENT_ODE1_1: u32 = 20011;
pub const MILIASTRA_WONDERLAND_EVENT_ODE1_2: u32 = 20021;
pub const MILIASTRA_WONDERLAND_EVENT_ODE2_1: u32 = 20012;
pub const MILIASTRA_WONDERLAND_EVENT_ODE2_2: u32 = 20022;

pub const fn permanent_gacha_type(business: AccountBusiness) -> u32 {
  match business {
    AccountBusiness::GenshinImpact => GENSHIN_IMPACT_PERMANENT,
    AccountBusiness::MiliastraWonderland => MILIASTRA_WONDERLAND_PERMANENT_ODE,
    AccountBusiness::HonkaiStarRail => HONKAI_STAR_RAIL_PERMANENT,
    AccountBusiness::ZenlessZoneZero => ZENLESS_ZONE_ZERO_PERMANENT,
  }
}

static KNOWN_CATEGORIZEDS: LazyLock<HashMap<AccountBusiness, HashMap<u32, PrettizedCategory>>> =
  LazyLock::new(|| {
    HashMap::from_iter([
      (
        AccountBusiness::GenshinImpact,
        HashMap::from_iter([
          (100, PrettizedCategory::Beginner),
          (GENSHIN_IMPACT_PERMANENT, PrettizedCategory::Permanent),
          (301, PrettizedCategory::Character),
          (GENSHIN_IMPACT_CHARACTER2, PrettizedCategory::Character),
          (302, PrettizedCategory::Weapon),
          (500, PrettizedCategory::Chronicled),
        ]),
      ),
      (
        AccountBusiness::HonkaiStarRail,
        HashMap::from_iter([
          (2, PrettizedCategory::Beginner),
          (HONKAI_STAR_RAIL_PERMANENT, PrettizedCategory::Permanent),
          (11, PrettizedCategory::Character),
          (12, PrettizedCategory::Weapon),
          (
            HONKAI_STAR_RAIL_COLLABORATION_CHARACTER,
            PrettizedCategory::CollaborationCharacter,
          ),
          (
            HONKAI_STAR_RAIL_COLLABORATION_WEAPON,
            PrettizedCategory::CollaborationWeapon,
          ),
        ]),
      ),
      (
        AccountBusiness::ZenlessZoneZero,
        HashMap::from_iter([
          (ZENLESS_ZONE_ZERO_PERMANENT, PrettizedCategory::Permanent),
          (2, PrettizedCategory::Character),
          (3, PrettizedCategory::Weapon),
          (ZENLESS_ZONE_ZERO_BANGBOO, PrettizedCategory::Bangboo),
        ]),
      ),
      (
        AccountBusiness::MiliastraWonderland,
        HashMap::from_iter([
          (
            MILIASTRA_WONDERLAND_PERMANENT_ODE,
            PrettizedCategory::PermanentOde,
          ),
          (MILIASTRA_WONDERLAND_EVENT_ODE, PrettizedCategory::EventOde),
        ]),
      ),
    ])
  });

impl PrettizedCategory {
  /// Find `PrettizedCategory` from given `business` and `gacha_type`.
  pub fn from_gacha_type(business: AccountBusiness, n: u32) -> Option<Self> {
    KNOWN_CATEGORIZEDS.get(&business)?.get(&n).cloned()
  }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RankLevel {
  Golden,
  Purple,
  Blue,
  Green,        // Genshin Impact: Miliastra Wonderland
  Unknown(u32), // Avoid panic
}

impl PrettizedCategory {
  pub const fn max_pity(&self, rank: RankLevel) -> u8 {
    match rank {
      RankLevel::Golden => match self {
        Self::Character | Self::Permanent | Self::Chronicled | Self::CollaborationCharacter => 90,
        Self::Weapon | Self::Bangboo | Self::CollaborationWeapon => 80,
        Self::EventOde => 70,
        Self::Beginner => 50,
        _ => 0,
      },
      RankLevel::Purple => match self {
        Self::PermanentOde => 70,
        Self::EventOde => 10,
        _ => 10,
      },
      RankLevel::Blue => match self {
        Self::PermanentOde => 5,
        _ => 0,
      },
      _ => 0,
    }
  }

  /// 0 - 100
  pub fn pity_progress(&self, pity: u64, rank: RankLevel) -> u8 {
    let max_pity = self.max_pity(rank);
    if max_pity == 0 || pity == 0 {
      0
    } else {
      (pity as f32 / max_pity as f32 * 100.)
        .round()
        .clamp(0., 100.) as _
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
  fn compute(category: PrettizedCategory, value: u64, rank: RankLevel) -> Self {
    Self {
      value,
      progress: category.pity_progress(value, rank),
    }
  }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrettizedRecord<'a> {
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
  pub miliastra_wonderland_event_ode: Option<u32>,
}

impl<'a> PrettizedRecord<'a> {
  pub fn mapping(
    metadata: &'a dyn Metadata,
    category: PrettizedCategory,
    record: &'a GachaRecord,
    pity: Option<u64>,
    custom_locale: Option<&str>,
  ) -> Self {
    let business = record.business;
    let metadata_entry = custom_locale
      .and_then(|s| metadata.locale(business as _, s))
      .or(metadata.locale(business as _, &record.lang))
      .and_then(|locale| locale.entry_from_id(record.item_id));

    let (item_id, item_name, item_category) = if let Some(entry) = metadata_entry {
      (entry.item_id, entry.item_name, Some(entry.category))
    } else {
      (record.item_id, record.item_name.as_str(), None)
    };

    let used_pity = pity.map(|n| {
      UsedPity::compute(
        category,
        n,
        if record.is_rank_golden() {
          RankLevel::Golden
        } else if record.is_rank_purple() {
          RankLevel::Purple
        } else if record.is_rank_blue() {
          RankLevel::Blue
        } else if record.is_rank_green() {
          RankLevel::Green
        } else {
          RankLevel::Unknown(record.rank_type)
        },
      )
    });

    let (is_up, version) = metadata
      .query_banner(business as _, record.gacha_type, record.time)
      .map(|banner| {
        let is_up = if (record.is_rank_golden() && banner.is_up_golden(record.item_id))
          || (record.is_rank_purple() && banner.is_up_purple(record.item_id))
        {
          Some(true)
        } else {
          None
        };

        (is_up, banner.version())
      })
      .unwrap_or_default();

    let genshin_impact_character2 = if business == AccountBusiness::GenshinImpact
      && record.gacha_type == GENSHIN_IMPACT_CHARACTER2
    {
      Some(true)
    } else {
      None
    };

    let miliastra_wonderland_event_ode = if business == AccountBusiness::MiliastraWonderland
      && category == PrettizedCategory::EventOde
    {
      Some(record.gacha_type)
    } else {
      None
    };

    Self {
      id: &record.id,
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
pub struct PrettizedRecords<'a> {
  pub business: AccountBusiness,
  pub uid: u32,
  pub total: usize,
  #[serde(with = "rfc3339::option", skip_serializing_if = "Option::is_none")]
  pub start_time: Option<OffsetDateTime>,
  #[serde(with = "rfc3339::option", skip_serializing_if = "Option::is_none")]
  pub end_time: Option<OffsetDateTime>,
  pub gacha_type_categories: HashMap<u32, PrettizedCategory>,
  pub categorizeds: HashMap<PrettizedCategory, CategorizedRecords<'a>>,
  pub aggregated: Option<AggregatedRecords<'a>>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedRecords<'a> {
  pub category: PrettizedCategory,
  pub gacha_type: u32,
  pub total: usize,
  #[serde(with = "rfc3339::option", skip_serializing_if = "Option::is_none")]
  pub start_time: Option<OffsetDateTime>,
  #[serde(with = "rfc3339::option", skip_serializing_if = "Option::is_none")]
  pub end_time: Option<OffsetDateTime>,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub last_end_id: Option<&'a str>,
  pub rankings: Rankings<'a>,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AggregatedRecords<'a> {
  pub total: usize,
  #[serde(with = "rfc3339::option", skip_serializing_if = "Option::is_none")]
  pub start_time: Option<OffsetDateTime>,
  #[serde(with = "rfc3339::option", skip_serializing_if = "Option::is_none")]
  pub end_time: Option<OffsetDateTime>,
  pub rankings: Rankings<'a>,
  pub tags: AggregatedGoldenTags<'a>,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Rankings<'a> {
  #[serde(skip_serializing_if = "Option::is_none")]
  pub green: Option<GreenRanking<'a>>,
  pub blue: BlueRanking<'a>,
  pub purple: PurpleRanking<'a>,
  pub golden: GoldenRanking<'a>,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GreenRanking<'a> {
  pub values: Vec<PrettizedRecord<'a>>,
  pub sum: usize,
  pub percentage: f64,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BlueRanking<'a> {
  pub values: Vec<PrettizedRecord<'a>>,
  pub sum: usize,
  pub percentage: f64,
  pub average: f64,
  pub next_pity: UsedPity,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PurpleRanking<'a> {
  pub values: Vec<PrettizedRecord<'a>>,
  pub sum: usize,
  pub percentage: f64,
  pub average: f64,
  pub next_pity: UsedPity,
  pub up: RankingUp,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GoldenRanking<'a> {
  pub values: Vec<PrettizedRecord<'a>>,
  pub sum: usize,
  pub average: f64,
  pub percentage: f64,
  pub next_pity: UsedPity,
  pub up: RankingUp,
  pub up_win: RankingUpWin,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RankingUp {
  pub sum: usize,
  pub average: f64,
  pub percentage: f64,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RankingUpWin {
  pub sum: usize,
  pub percentage: f64,
}

#[derive(Clone, Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AggregatedGoldenTags<'a> {
  pub luck: Option<PrettizedRecord<'a>>,
  pub unluck: Option<PrettizedRecord<'a>>,
  pub relation: Option<(PrettizedRecord<'a>, u64)>, // _, sum
  pub crazy: Option<(u64, u64)>,                    // Unix timestamp in seconds, sum
  pub recent: Option<(u64, u64)>,                   // Unix timestamp in seconds, sum
}

// endregion

// region: Compute

impl<'a> PrettizedRecords<'a> {
  pub fn pretty(
    metadata: &'a dyn Metadata,
    business: AccountBusiness,
    uid: u32,
    records: &'a [GachaRecord],
    custom_locale: Option<&str>,
  ) -> Self {
    let total = records.len();
    let start_time = records.first().map(|e| e.time);
    let end_time = records.last().map(|e| e.time);

    let gacha_type_records: HashMap<u32, Vec<&'a GachaRecord>> =
      records.iter().fold(HashMap::new(), |mut acc, record| {
        acc.entry(record.gacha_type).or_default().push(record);
        acc
      });

    let categorizeds = compute_categorieds(metadata, business, gacha_type_records, custom_locale);
    let aggregated = compute_aggregated(business, records, &categorizeds);
    let gacha_type_categories = categorizeds.values().fold(
      HashMap::with_capacity(categorizeds.len()),
      |mut acc, categorized| {
        acc.insert(categorized.gacha_type, categorized.category);
        acc
      },
    );

    Self {
      business,
      uid,
      total,
      start_time,
      end_time,
      gacha_type_categories,
      categorizeds,
      aggregated,
    }
  }
}

fn compute_categorieds<'a>(
  metadata: &'a dyn Metadata,
  business: AccountBusiness,
  mut gacha_type_records: HashMap<u32, Vec<&'a GachaRecord>>,
  custom_locale: Option<&str>,
) -> HashMap<PrettizedCategory, CategorizedRecords<'a>> {
  let Some(gacha_type_categories) = KNOWN_CATEGORIZEDS.get(&business) else {
    return Default::default();
  };

  let is_genshin_impact = business == AccountBusiness::GenshinImpact;
  let is_miliastra_wonderland = business == AccountBusiness::MiliastraWonderland;
  let mut categorizeds = HashMap::with_capacity(gacha_type_categories.len());

  for (gacha_type, category) in gacha_type_categories
    .iter() // See below
    .filter(|(gacha_type, _)| !(is_genshin_impact && **gacha_type == GENSHIN_IMPACT_CHARACTER2))
  {
    let records = {
      macro_rules! result_merge {
        (
          $result:ident,
          $(
            $predicate:expr => {
              $($target:expr,)*
            },
          )*
        ) => {
          $(
            if $predicate {
              $(
                $result.extend(
                  gacha_type_records
                    .remove($target)
                    .unwrap_or_default()
                );
              )*
              $result.sort_by(|a, b| a.id.cmp(&b.id));
            }
          )*
        };
      }

      let mut result = gacha_type_records.remove(gacha_type).unwrap_or_default();
      result_merge! { result,
        is_genshin_impact && *category == PrettizedCategory::Character => { &GENSHIN_IMPACT_CHARACTER2, },
        is_miliastra_wonderland && *category == PrettizedCategory::EventOde => {
          &MILIASTRA_WONDERLAND_EVENT_ODE1_1,
          &MILIASTRA_WONDERLAND_EVENT_ODE1_2,
          &MILIASTRA_WONDERLAND_EVENT_ODE2_1,
          &MILIASTRA_WONDERLAND_EVENT_ODE2_2,
        },
      }
      result
    };

    let total = records.len();
    let start_time = records.first().map(|e| e.time);
    let end_time = records.last().map(|e| e.time);
    let last_end_id = records.last().map(|e| e.id.as_str());
    let rankings = compute_rankings(metadata, business, *category, records, custom_locale);

    categorizeds.insert(
      *category,
      CategorizedRecords {
        category: *category,
        total,
        gacha_type: *gacha_type,
        start_time,
        end_time,
        last_end_id,
        rankings,
      },
    );
  }

  categorizeds
}

macro_rules! percentage {
  ($total:expr, $sum:expr) => {
    if $sum > 0 {
      ($sum as f64 / $total as f64 * 10000.).round() / 100.
    } else {
      0.
    }
  };
}

macro_rules! average {
  ($used_pity_sum:expr, $sum:expr) => {
    if $sum > 0 {
      ($used_pity_sum as f64 / $sum as f64 * 100.).round() / 100.
    } else {
      0.
    }
  };
}

fn compute_rankings<'a>(
  metadata: &'a dyn Metadata,
  business: AccountBusiness,
  category: PrettizedCategory,
  records: Vec<&'a GachaRecord>,
  custom_locale: Option<&str>,
) -> Rankings<'a> {
  let is_miliastra_wonderland = business == AccountBusiness::MiliastraWonderland;
  let is_zenless_zone_zero = business == AccountBusiness::ZenlessZoneZero;
  let total = records.len();

  // Green ranking: 'Genshin Impact: Miliastra Wonderland' only
  let green = if is_miliastra_wonderland {
    let values = records
      .iter()
      .filter(|e| e.is_rank_green())
      .map(|e| PrettizedRecord::mapping(metadata, category, e, None, custom_locale))
      .collect::<Vec<_>>();

    let sum = values.len();
    Some(GreenRanking {
      values,
      sum,
      percentage: percentage!(total, sum),
    })
  } else {
    None
  };

  // Blue ranking
  let blue = {
    let mut pity = 0;
    let mut used_pity_sum = 0;

    let values = if is_miliastra_wonderland {
      let mut values = Vec::new();
      for record in &records {
        pity += 1;

        if record.is_rank_blue() {
          let prettized =
            PrettizedRecord::mapping(metadata, category, record, Some(pity), custom_locale);

          values.push(prettized);
          used_pity_sum += pity;
          pity = 0;
        }
      }

      values
    } else {
      records
        .iter()
        .filter(|e| e.is_rank_blue())
        .map(|e| PrettizedRecord::mapping(metadata, category, e, None, custom_locale))
        .collect::<Vec<_>>()
    };

    let sum = values.len();
    let next_pity = UsedPity::compute(category, pity, RankLevel::Blue);

    BlueRanking {
      values,
      sum,
      average: average!(used_pity_sum, sum),
      percentage: percentage!(total, sum),
      next_pity,
    }
  };

  // Purple ranking
  let purple = {
    let mut values = Vec::new();

    let mut pity = 0;
    let mut used_pity_sum = 0;

    let mut up_sum = 0;
    let mut up_pity = 0;
    let mut up_used_pity_sum = 0;

    for record in &records {
      pity += 1;
      up_pity += 1;

      let is_purple = record.is_rank_purple();
      if is_purple {
        let prettized =
          PrettizedRecord::mapping(metadata, category, record, Some(pity), custom_locale);

        if prettized.is_up == Some(true) {
          up_sum += 1;
          up_used_pity_sum += up_pity;
          up_pity = 0;
        }

        values.push(prettized);
      }

      // HACK: Regarding the guaranteed pity,
      //   will the 4-star item be pushed to the next pity or replaced by the 5-star item?
      // Genshin Impact or Honkai: Star Rail:
      //   4-star pushed to the next pity : 11 pity Hit.
      //   No 12 pity or more has been encountered yet!
      // Zenless Zone Zero:
      //   4-star replaced by the 5-star item : 20 pity Hit.
      // See:
      //   https://github.com/lgou2w/HoYo.Gacha/issues/114
      //   https://www.bilibili.com/opus/493346460748792677
      //   https://www.miyoushe.com/zzz/article/55348297
      if is_purple || (is_zenless_zone_zero && record.is_rank_golden()) {
        used_pity_sum += pity;
        pity = 0;
      }
    }

    let sum = values.len();
    let next_pity = UsedPity::compute(category, pity, RankLevel::Purple);

    PurpleRanking {
      values,
      sum,
      average: average!(used_pity_sum, sum),
      percentage: percentage!(total, sum),
      next_pity,
      up: RankingUp {
        sum: up_sum,
        average: average!(up_used_pity_sum, up_sum),
        percentage: percentage!(total, up_sum),
      },
    }
  };

  // Golden ranking
  let golden = {
    let mut values = Vec::new();

    let mut pity = 0;
    let mut used_pity_sum = 0;

    let mut up_sum = 0;
    let mut up_pity = 0;
    let mut up_used_pity_sum = 0;
    let mut up_win_sum = 0;

    for record in &records {
      pity += 1;
      up_pity += 1;

      if record.is_rank_golden() {
        let prettized =
          PrettizedRecord::mapping(metadata, category, record, Some(pity), custom_locale);

        if prettized.is_up == Some(true) {
          up_sum += 1;
          up_used_pity_sum += up_pity;
          up_pity = 0;
        }

        values.push(prettized);
        used_pity_sum += pity;
        pity = 0;
      }
    }

    // Compute up win
    {
      let mut prev: Option<&PrettizedRecord<'a>> = None;
      for prettized in &values {
        if prettized.is_up == Some(true) && prev.as_ref().is_none_or(|x| x.is_up == Some(true)) {
          up_win_sum += 1;
        }
        prev.replace(prettized);
      }
    }

    let sum = values.len();
    let next_pity = UsedPity::compute(category, pity, RankLevel::Golden);

    GoldenRanking {
      values,
      sum,
      average: average!(used_pity_sum, sum),
      percentage: percentage!(total, sum),
      next_pity,
      up: RankingUp {
        sum: up_sum,
        average: average!(up_used_pity_sum, up_sum),
        percentage: percentage!(total, up_sum),
      },
      up_win: RankingUpWin {
        sum: up_win_sum,
        percentage: percentage!(sum - up_sum + up_win_sum, up_win_sum),
      },
    }
  };

  Rankings {
    green,
    blue,
    purple,
    golden,
  }
}

fn compute_aggregated<'a>(
  business: AccountBusiness,
  records: &'a [GachaRecord],
  categorizeds: &HashMap<PrettizedCategory, CategorizedRecords<'a>>,
) -> Option<AggregatedRecords<'a>> {
  let is_miliastra_wonderland = business == AccountBusiness::MiliastraWonderland;
  let is_zenless_zone_zero = business == AccountBusiness::ZenlessZoneZero;

  // HACK: Completely independent gacha banner, no need for aggregated
  if is_miliastra_wonderland {
    return None;
  }

  // HACK: Bangboo is a completely separate gacha banner
  //   and doesn't count towards the aggregated.
  let records: Vec<&GachaRecord> = if is_zenless_zone_zero {
    records
      .iter()
      .filter(|e| e.gacha_type != ZENLESS_ZONE_ZERO_BANGBOO)
      .collect()
  } else {
    records.iter().collect()
  };

  let total = records.len();
  let start_time = records.first().map(|e| e.time);
  let end_time = records.last().map(|e| e.time);

  let mut blue = BlueRanking::default();
  let mut purple = PurpleRanking::default();
  let mut golden = GoldenRanking::default();
  for CategorizedRecords { rankings, .. } in categorizeds
    .values() // HACK: See the HACK note above
    .filter(|e| e.category != PrettizedCategory::Bangboo)
    .collect::<Vec<_>>()
  {
    blue.sum += rankings.blue.sum;
    blue.values.extend_from_slice(&rankings.blue.values);

    purple.sum += rankings.purple.sum;
    purple.values.extend_from_slice(&rankings.purple.values);

    golden.sum += rankings.golden.sum;
    golden.up_win.sum += rankings.golden.up_win.sum;
    golden.values.extend_from_slice(&rankings.golden.values);
  }

  blue.values.sort_by(|a, b| a.id.cmp(b.id));
  purple.values.sort_by(|a, b| a.id.cmp(b.id));
  golden.values.sort_by(|a, b| a.id.cmp(b.id));

  macro_rules! compute_ranking {
    ($values:expr, $ranking:expr $(,$up_win:expr)?) => {{
      let sum = $ranking.sum;
      let mut used_pity_sum = 0;
      let mut up_sum = 0;
      let mut up_pity = 0;
      let mut up_used_pity_sum = 0;

      for prettized in $values {
        let used_pity = prettized
          .used_pity
          .as_ref()
          .map(|p| p.value)
          .unwrap_or_default();

        used_pity_sum += used_pity;
        up_pity += used_pity;

        if prettized.is_up == Some(true) {
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

  let tags = compute_aggregated_tags(records, &golden);

  Some(AggregatedRecords {
    total,
    start_time,
    end_time,
    rankings: Rankings {
      green: None,
      blue,
      purple,
      golden,
    },
    tags,
  })
}

fn compute_aggregated_tags<'a>(
  records: Vec<&'a GachaRecord>,
  golden: &GoldenRanking<'a>,
) -> AggregatedGoldenTags<'a> {
  let mut tags = AggregatedGoldenTags::default();

  // Luck & Unluck
  {
    let mut values: Vec<_> = golden.values.iter().collect();
    values.sort_by_key(|e| e.used_pity.as_ref().map(|pity| pity.value));
    tags.luck = values.first().map(|e| (*e).clone());
    tags.unluck = values.last().map(|e| (*e).clone());
  }

  // Relation
  {
    let init = HashMap::<u32, (_, u64)>::with_capacity(golden.values.len());
    let mut counts: Vec<(_, u64)> = golden
      .values
      .iter()
      .fold(init, |mut acc, e| {
        use std::collections::hash_map::Entry;

        match acc.entry(e.item_id) {
          Entry::Occupied(mut o) => {
            let (_, sum) = o.get_mut();
            *sum += 1;
          }
          Entry::Vacant(o) => {
            o.insert((e, 1));
          }
        }

        acc
      })
      .into_values()
      .collect();

    counts.sort_by_key(|(_, sum)| *sum);
    tags.relation = counts.last().map(|(e, sum)| ((*e).clone(), *sum));
  }

  // Crazy & Recent
  {
    let init = HashMap::<Date, (Date, u64)>::with_capacity(records.len());
    let mut dates: Vec<_> = records
      .iter()
      .fold(init, |mut acc, record| {
        use std::collections::hash_map::Entry;

        match acc.entry(record.time.date()) {
          Entry::Occupied(mut o) => {
            let (_, sum) = o.get_mut();
            *sum += 1;
          }
          Entry::Vacant(o) => {
            o.insert((record.time.date(), 1));
          }
        }

        acc
      })
      .into_values()
      .collect();

    #[inline]
    fn into_date((date, sum): &(Date, u64)) -> (u64, u64) {
      let timestamp = date
        .with_hms(0, 0, 0)
        .unwrap() // SAFETY
        .assume_utc()
        .unix_timestamp();

      (timestamp as _, *sum)
    }

    dates.sort_by_key(|(_, sum)| *sum);
    tags.crazy = dates.last().map(into_date);

    // Re-sort by date
    dates.sort_by_key(|(date, _)| *date);
    tags.recent = dates.last().map(into_date);
  }

  tags
}

// endregion

#[cfg(test)]
mod tests {
  use time::macros::datetime;

  use super::*;
  use crate::business::metadata::Metadata;

  #[test]
  fn test_pretty() {
    let records = vec![GachaRecord {
      business: AccountBusiness::GenshinImpact,
      uid: 100000000,
      id: "1".into(),
      gacha_type: 301,
      gacha_id: None,
      rank_type: 5,
      count: 1,
      lang: "zh-cn".into(),
      time: datetime!(2025-01-01 00:00:00 +08:00),
      item_name: "刻晴".into(),
      item_type: "角色".into(),
      item_id: 10000042,
      properties: None,
    }];

    let _prettized = PrettizedRecords::pretty(
      Metadata::embedded(),
      AccountBusiness::GenshinImpact,
      100000000,
      &records,
      None,
    );
  }
}
