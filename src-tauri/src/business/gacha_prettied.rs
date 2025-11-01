use std::collections::{HashMap, hash_map};
use std::sync::LazyLock;

use serde::Serialize;
use time::OffsetDateTime;
use time::serde::rfc3339;

use crate::business::{GachaMetadata, GameVersion};
use crate::error::declare_error_kinds;
use crate::models::{Business, GachaRecord};

declare_error_kinds! {
  #[derive(Debug, thiserror::Error)]
  PrettyGachaRecordsError {
    #[error("Missing metadata entry: {business}, locale: {locale}, name: {name}, item_id: {item_id:?}")]
    MissingMetadataEntry {
      business: Business,
      locale: String,
      name: String,
      item_id: String
    },
  }
}

#[derive(Copy, Clone, Debug, Serialize, PartialEq, Eq, Hash)]
pub enum PrettyCategory {
  Beginner, // 'Genshin Impact' and 'Honkai: Star Rail' only
  Permanent,
  Character,
  Weapon,
  Chronicled,             // 'Genshin Impact' only
  Bangboo,                // 'Zenless Zone Zero' only
  CollaborationCharacter, // 'Honkai: Star Rail' only
  CollaborationWeapon,    // 'Honkai: Star Rail' only
  PermanentOde,           // 'Genshin Impact: Miliastra Wonderland' only
  EventOde,               // 'Genshin Impact: Miliastra Wonderland' only
}

#[derive(Debug, PartialEq, Eq)]
pub enum RankLevel {
  Golden,
  Purple,
  Blue,
  Green,        // Genshin Impact: Miliastra Wonderland
  Unknown(u32), // Avoid panic
}

impl PrettyCategory {
  pub const fn max_pity(&self, rank_level: RankLevel) -> u8 {
    match rank_level {
      RankLevel::Golden => match *self {
        Self::Character | Self::Permanent | Self::Chronicled | Self::CollaborationCharacter => 90,
        Self::Weapon | Self::Bangboo | Self::CollaborationWeapon => 80,
        Self::EventOde => 70,
        Self::Beginner => 50,
        Self::PermanentOde => 0,
      },
      RankLevel::Purple => match *self {
        Self::PermanentOde => 70,
        Self::EventOde => 10,
        _ => 10,
      },
      RankLevel::Blue => match *self {
        Self::PermanentOde => 5,
        _ => 0,
      },
      _ => 0,
    }
  }

  // 0 - 100
  pub fn calc_pity_progress(&self, rank_level: RankLevel, used_pity: u64) -> u8 {
    let max_pity = self.max_pity(rank_level);

    if used_pity == 0 || max_pity == 0 {
      return 0;
    }

    (used_pity as f32 / max_pity as f32 * 100.)
      .round()
      .min(100.) as u8
  }
}

// See: models/gacha_record.rs
const GENSHIN_IMPACT_CHARACTER2: u32 = 400;

const MILIASTRA_WONDERLAND_PERMANENT_ODE: u32 = 1000;
const MILIASTRA_WONDERLAND_EVENT_ODE: u32 = 2000; // Includes: 20011, 20021, 20012, 20022
const MILIASTRA_WONDERLAND_EVENT_ODE1_1: u32 = 20011;
const MILIASTRA_WONDERLAND_EVENT_ODE1_2: u32 = 20021;
const MILIASTRA_WONDERLAND_EVENT_ODE2_1: u32 = 20012;
const MILIASTRA_WONDERLAND_EVENT_ODE2_2: u32 = 20022;

static KNOWN_CATEGORIZEDS: LazyLock<HashMap<Business, HashMap<u32, PrettyCategory>>> =
  LazyLock::new(|| {
    HashMap::from_iter([
      (
        Business::GenshinImpact,
        HashMap::from_iter([
          (100, PrettyCategory::Beginner),
          (200, PrettyCategory::Permanent),
          (301, PrettyCategory::Character),
          (GENSHIN_IMPACT_CHARACTER2, PrettyCategory::Character),
          (302, PrettyCategory::Weapon),
          (500, PrettyCategory::Chronicled),
        ]),
      ),
      (
        Business::HonkaiStarRail,
        HashMap::from_iter([
          (2, PrettyCategory::Beginner),
          (1, PrettyCategory::Permanent),
          (11, PrettyCategory::Character),
          (12, PrettyCategory::Weapon),
          (21, PrettyCategory::CollaborationCharacter),
          (22, PrettyCategory::CollaborationWeapon),
        ]),
      ),
      (
        Business::ZenlessZoneZero,
        HashMap::from_iter([
          (1, PrettyCategory::Permanent),
          (2, PrettyCategory::Character),
          (3, PrettyCategory::Weapon),
          (5, PrettyCategory::Bangboo),
        ]),
      ),
      (
        Business::MiliastraWonderland,
        HashMap::from_iter([
          (
            MILIASTRA_WONDERLAND_PERMANENT_ODE,
            PrettyCategory::PermanentOde,
          ),
          (MILIASTRA_WONDERLAND_EVENT_ODE, PrettyCategory::EventOde), // Includes: 20011, 20021
        ]),
      ),
    ])
  });

static KNOWN_CATEGORIES_REVERSED: LazyLock<HashMap<Business, HashMap<PrettyCategory, u32>>> =
  LazyLock::new(|| {
    let mut m = HashMap::with_capacity(KNOWN_CATEGORIZEDS.len());
    for (business, categories) in &*KNOWN_CATEGORIZEDS {
      let mut reversed = HashMap::with_capacity(categories.len());
      for (gacha_type, category) in categories {
        reversed.insert(*category, *gacha_type);
      }

      m.insert(*business, reversed);
    }

    m
  });

impl PrettyCategory {
  pub fn from_gacha_type(business: &Business, value: u32) -> Option<Self> {
    KNOWN_CATEGORIZEDS
      .get(business)
      .unwrap() // SAFETY
      .get(&value)
      .cloned()
  }

  pub fn to_gacha_type(business: &Business, category: &Self) -> u32 {
    *KNOWN_CATEGORIES_REVERSED
      .get(business)
      .unwrap() // SAFETY
      .get(category)
      .unwrap() // SAFETY
  }

  pub const fn is_hkrpg_collaboration(&self) -> bool {
    matches!(
      self,
      Self::CollaborationCharacter | Self::CollaborationWeapon
    )
  }

  pub const fn is_hk4e_miliastra_wonderland(&self) -> bool {
    matches!(self, Self::PermanentOde | Self::EventOde)
  }
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PrettyGachaRecord {
  pub id: String,
  // See: models/gacha_metadata.rs::GachaMetadata::KNOWN_CATEGORIES
  pub item_category: &'static str,
  pub item_id: u32,
  pub name: String,
  #[serde(with = "rfc3339")]
  pub time: OffsetDateTime,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub used_pity: Option<u64>, // Purple and Golden only
  #[serde(skip_serializing_if = "Option::is_none")]
  pub used_pity_progress: Option<u8>, // Purple and Golden only (0 - 100)
  #[serde(skip_serializing_if = "Option::is_none")]
  pub up: Option<bool>, // Purple and Golden only
  #[serde(skip_serializing_if = "Option::is_none")]
  pub version: Option<GameVersion>,
  // 'Genshin Impact' Character only, Distinguish Character and Character-2
  #[serde(skip_serializing_if = "Option::is_none")]
  pub genshin_character2: Option<bool>,
  // 'Genshin Impact: Miliastra Wonderland' EventOde only,
  // Distinguish EventOde-1_1, EventOde-1_2, EventOde-2_1, EventOde-2_2
  #[serde(skip_serializing_if = "Option::is_none")]
  pub miliastra_wonderland_event_ode: Option<u32>,
}

impl PrettyGachaRecord {
  fn mapping(
    metadata: &GachaMetadata,
    category: &PrettyCategory,
    record: &GachaRecord,
    used_pity: Option<u64>,
    custom_locale: Option<&str>,
  ) -> Result<Self, PrettyGachaRecordsError> {
    // Use custom locale first, otherwise use record lang
    let entry = custom_locale
      .and_then(|locale| metadata.locale(record.business, locale))
      .or(metadata.locale(record.business, &record.lang))
      .and_then(|locale| locale.entry_from_id(record.item_id))
      .ok_or_else(|| PrettyGachaRecordsErrorKind::MissingMetadataEntry {
        business: record.business,
        locale: custom_locale.unwrap_or(&record.lang).to_owned(),
        name: record.name.clone(),
        item_id: record.item_id.to_string(),
      })?;

    let used_pity_progress = used_pity.map(|n| {
      let rank_level = if record.is_rank_type_golden() {
        RankLevel::Golden
      } else if record.is_rank_type_purple() {
        RankLevel::Purple
      } else if record.is_rank_type_blue() {
        RankLevel::Blue
      } else if record.is_rank_type_green() {
        RankLevel::Green
      } else {
        RankLevel::Unknown(record.rank_type)
      };

      category.calc_pity_progress(rank_level, n)
    });

    let (up, version) = if let Some(banner) = metadata.banner_from_record(record) {
      let up = if (record.is_rank_type_golden() && banner.in_up_golden(record.item_id))
        || (record.is_rank_type_purple() && banner.in_up_purple(record.item_id))
      {
        Some(true)
      } else {
        None
      };

      (up, banner.version.clone())
    } else {
      (None, None)
    };

    let genshin_character2 = if record.business == Business::GenshinImpact
      && record.gacha_type == GENSHIN_IMPACT_CHARACTER2
    {
      Some(true)
    } else {
      None
    };

    let miliastra_wonderland_event_ode = if category == &PrettyCategory::EventOde
      && record.business == Business::MiliastraWonderland
    {
      Some(record.gacha_type)
    } else {
      None
    };

    Ok(Self {
      id: record.id.clone(),
      item_category: entry.category,
      // HACK: Always use item_id and name from Metadata
      item_id: entry.id,
      name: entry.name.to_owned(),
      time: record.time,
      used_pity,
      used_pity_progress,
      up,
      version,
      genshin_character2,
      miliastra_wonderland_event_ode,
    })
  }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadataGreenRanking {
  pub values: Vec<PrettyGachaRecord>,
  pub sum: u64,
  pub percentage: f64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadataBlueRanking {
  pub values: Vec<PrettyGachaRecord>,
  pub sum: u64,
  pub percentage: f64,
  // Genshin Impact: Miliastra Wonderland
  pub average: f64,
  pub next_pity: u64,
  pub next_pity_progress: u8, // 0 - 100
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadataPurpleRanking {
  pub values: Vec<PrettyGachaRecord>,
  pub sum: u64,
  pub percentage: f64,
  pub average: f64,
  pub up_sum: u64,
  pub up_percentage: f64,
  pub up_average: f64,
  pub next_pity: u64,
  pub next_pity_progress: u8, // 0 - 100
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadataGoldenRanking {
  pub values: Vec<PrettyGachaRecord>,
  pub sum: u64,
  pub percentage: f64,
  pub average: f64,
  pub up_sum: u64,
  pub up_percentage: f64,
  pub up_average: f64,
  pub up_win_sum: u64,
  pub up_win_percentage: f64,
  pub next_pity: u64,
  pub next_pity_progress: u8, // 0 - 100
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadataRankings {
  pub green: Option<CategorizedMetadataGreenRanking>, // 'Genshin Impact: Miliastra Wonderland' only
  pub blue: CategorizedMetadataBlueRanking,
  pub purple: CategorizedMetadataPurpleRanking,
  pub golden: CategorizedMetadataGoldenRanking,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadata {
  pub category: PrettyCategory,
  pub total: u64,
  pub gacha_type: u32,
  #[serde(with = "rfc3339::option")]
  pub start_time: Option<OffsetDateTime>,
  #[serde(with = "rfc3339::option")]
  pub end_time: Option<OffsetDateTime>,
  pub last_end_id: Option<String>,
  pub rankings: CategorizedMetadataRankings,
}

#[derive(Clone, Debug, Serialize)]
pub enum AggregatedGoldenTag {
  Luck(PrettyGachaRecord),
  Unluck(PrettyGachaRecord),
  Relation {
    record: PrettyGachaRecord,
    sum: u64,
  },
  Crazy {
    #[serde(with = "rfc3339")]
    time: OffsetDateTime,
    sum: u64,
  },
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AggregatedMetadata {
  pub total: u64,
  #[serde(with = "rfc3339::option")]
  pub start_time: Option<OffsetDateTime>,
  #[serde(with = "rfc3339::option")]
  pub end_time: Option<OffsetDateTime>,
  pub rankings: CategorizedMetadataRankings,
  // pub golden_tags: Vec<AggregatedGoldenTag>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrettiedGachaRecords {
  pub business: Business,
  pub uid: u32,
  pub total: u64,
  #[serde(with = "rfc3339::option")]
  pub start_time: Option<OffsetDateTime>,
  #[serde(with = "rfc3339::option")]
  pub end_time: Option<OffsetDateTime>,
  pub gacha_type_categories: HashMap<u32, PrettyCategory>,
  pub categorizeds: HashMap<PrettyCategory, CategorizedMetadata>,
  pub aggregated: Option<AggregatedMetadata>, // All except 'Genshin Impact: Miliastra Wonderland'
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

impl PrettiedGachaRecords {
  pub fn pretty(
    metadata: &GachaMetadata,
    business: Business,
    uid: u32,
    records: &[GachaRecord],
    custom_locale: Option<&str>,
  ) -> Result<Self, PrettyGachaRecordsError> {
    let total = records.len() as u64;
    let start_time = records.first().map(|record| record.time);
    let end_time = records.last().map(|record| record.time);

    let gacha_type_records: HashMap<u32, Vec<&GachaRecord>> =
      records.iter().fold(HashMap::new(), |mut acc, record| {
        acc.entry(record.gacha_type).or_default().push(record);
        acc
      });

    let categorizeds =
      Self::compute_categorizeds(metadata, business, gacha_type_records, custom_locale)?;

    let aggregated = Self::compute_aggregated(business, records, &categorizeds);

    let gacha_type_categories = categorizeds.values().fold(
      HashMap::with_capacity(categorizeds.len()),
      |mut acc, categorized| {
        acc.insert(categorized.gacha_type, categorized.category);
        acc
      },
    );

    Ok(Self {
      business,
      uid,
      total,
      start_time,
      end_time,
      gacha_type_categories,
      categorizeds,
      aggregated,
    })
  }

  fn compute_categorizeds(
    metadata: &GachaMetadata,
    business: Business,
    mut gacha_type_records: HashMap<u32, Vec<&GachaRecord>>,
    custom_locale: Option<&str>,
  ) -> Result<HashMap<PrettyCategory, CategorizedMetadata>, PrettyGachaRecordsError> {
    let gacha_type_categories = KNOWN_CATEGORIZEDS.get(&business).unwrap(); // SAFETY
    let mut categorizeds = HashMap::with_capacity(gacha_type_categories.len());

    for (gacha_type, category) in gacha_type_categories
      .iter() // See below
      .filter(|(gacha_type, _)| {
        !(business == Business::GenshinImpact && **gacha_type == GENSHIN_IMPACT_CHARACTER2)
      })
    {
      let records = {
        let mut result = gacha_type_records.remove(gacha_type).unwrap_or_default();

        // HACK: Genshin Impact: 301 and 400 are the character gacha type
        if business == Business::GenshinImpact && category == &PrettyCategory::Character {
          let character2 = gacha_type_records
            .remove(&GENSHIN_IMPACT_CHARACTER2)
            .unwrap_or_default();

          result.extend(character2);
          result.sort_by(|a, b| a.id.cmp(&b.id));
        }

        if business == Business::MiliastraWonderland && category == &PrettyCategory::EventOde {
          let event_ode1_1 = gacha_type_records
            .remove(&MILIASTRA_WONDERLAND_EVENT_ODE1_1)
            .unwrap_or_default();
          let event_ode1_2 = gacha_type_records
            .remove(&MILIASTRA_WONDERLAND_EVENT_ODE1_2)
            .unwrap_or_default();
          let event_ode2_1 = gacha_type_records
            .remove(&MILIASTRA_WONDERLAND_EVENT_ODE2_1)
            .unwrap_or_default();
          let event_ode2_2 = gacha_type_records
            .remove(&MILIASTRA_WONDERLAND_EVENT_ODE2_2)
            .unwrap_or_default();

          result.extend(event_ode1_1);
          result.extend(event_ode1_2);
          result.extend(event_ode2_1);
          result.extend(event_ode2_2);
          result.sort_by(|a, b| a.id.cmp(&b.id));
        }

        result
      };

      let total = records.len() as u64;
      let start_time = records.first().map(|record| record.time);
      let end_time = records.last().map(|record| record.time);
      let last_end_id = records.last().map(|record| record.id.clone());
      let rankings =
        Self::compute_categorized_rankings(metadata, category, records, custom_locale)?;

      categorizeds.insert(
        *category,
        CategorizedMetadata {
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

    Ok(categorizeds)
  }

  fn compute_categorized_rankings(
    metadata: &GachaMetadata,
    category: &PrettyCategory,
    records: Vec<&GachaRecord>,
    custom_locale: Option<&str>,
  ) -> Result<CategorizedMetadataRankings, PrettyGachaRecordsError> {
    let is_beyond = category.is_hk4e_miliastra_wonderland();
    let total = records.len() as u64;

    let mut green = None;
    if is_beyond {
      let values = records
        .iter()
        .filter(|record| record.is_rank_type_green())
        .map(|record| PrettyGachaRecord::mapping(metadata, category, record, None, custom_locale))
        .collect::<Result<Vec<_>, _>>()?;

      let sum = values.len() as u64;

      green.replace(CategorizedMetadataGreenRanking {
        values,
        sum,
        percentage: percentage!(total, sum),
      });
    }

    let blue = {
      let mut pity = 0;
      let mut used_pity_sum = 0;

      let values = if is_beyond {
        let mut values = Vec::with_capacity(records.len());

        for record in &records {
          pity += 1;

          let is_blue = record.is_rank_type_blue();
          if is_blue {
            let precord =
              PrettyGachaRecord::mapping(metadata, category, record, Some(pity), custom_locale)?;

            values.push(precord);
          }

          if is_blue || record.is_rank_type_purple() {
            used_pity_sum += pity;
            pity = 0;
          }
        }

        values
      } else {
        records
          .iter()
          .filter(|record| record.is_rank_type_blue())
          .map(|record| PrettyGachaRecord::mapping(metadata, category, record, None, custom_locale))
          .collect::<Result<Vec<_>, _>>()?
      };

      let sum = values.len() as u64;
      let pity_progress = category.calc_pity_progress(RankLevel::Blue, pity);

      CategorizedMetadataBlueRanking {
        values,
        sum,
        percentage: percentage!(total, sum),
        average: average!(used_pity_sum, sum),
        next_pity: pity,
        next_pity_progress: pity_progress,
      }
    };

    let purple = {
      let mut values = Vec::with_capacity(records.len());

      let mut pity = 0;
      let mut used_pity_sum = 0;

      let mut up_sum = 0;
      let mut up_pity = 0;
      let mut up_used_pity_sum = 0;

      for record in &records {
        pity += 1;
        up_pity += 1;

        let is_purple = record.is_rank_type_purple();
        if is_purple {
          let precord =
            PrettyGachaRecord::mapping(metadata, category, record, Some(pity), custom_locale)?;

          if precord.up == Some(true) {
            up_sum += 1;
            up_used_pity_sum += up_pity;
            up_pity = 0;
          }

          values.push(precord);
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

        if is_purple
          || (record.business == Business::ZenlessZoneZero && record.is_rank_type_golden())
        {
          used_pity_sum += pity;
          pity = 0;
        }
      }

      let sum = values.len() as u64;
      let pity_progress = category.calc_pity_progress(RankLevel::Purple, pity);

      CategorizedMetadataPurpleRanking {
        values,
        sum,
        percentage: percentage!(total, sum),
        average: average!(used_pity_sum, sum),
        up_sum,
        up_percentage: percentage!(total, up_sum),
        up_average: average!(up_used_pity_sum, up_sum),
        next_pity: pity,
        next_pity_progress: pity_progress,
      }
    };

    let golden = {
      let mut values: Vec<PrettyGachaRecord> = Vec::with_capacity(records.len());

      let mut pity = 0;
      let mut used_pity_sum = 0;

      let mut up_sum = 0;
      let mut up_pity = 0;
      let mut up_used_pity_sum = 0;
      let mut up_win_sum = 0;

      for record in &records {
        pity += 1;
        up_pity += 1;

        let is_golden = record.is_rank_type_golden();
        if is_golden {
          let precord =
            PrettyGachaRecord::mapping(metadata, category, record, Some(pity), custom_locale)?;

          if precord.up == Some(true) {
            up_sum += 1;
            up_used_pity_sum += up_pity;
            up_pity = 0;
          }

          values.push(precord);
          used_pity_sum += pity;
          pity = 0;
        }
      }

      let mut prev_record: Option<&PrettyGachaRecord> = None;
      for record in &values {
        if record.up == Some(true)
          && (prev_record.is_none() || prev_record.unwrap().up == Some(true))
        {
          up_win_sum += 1;
        }

        prev_record.replace(record);
      }

      let sum = values.len() as u64;
      let pity_progress = category.calc_pity_progress(RankLevel::Golden, pity);

      CategorizedMetadataGoldenRanking {
        values,
        sum,
        percentage: percentage!(total, sum),
        average: average!(used_pity_sum, sum),
        up_sum,
        up_percentage: percentage!(total, up_sum),
        up_average: average!(up_used_pity_sum, up_sum),
        up_win_sum,
        up_win_percentage: percentage!(sum - up_sum + up_win_sum, up_win_sum),
        next_pity: pity,
        next_pity_progress: pity_progress,
      }
    };

    Ok(CategorizedMetadataRankings {
      green,
      blue,
      purple,
      golden,
    })
  }

  fn compute_aggregated(
    business: Business,
    records: &[GachaRecord],
    categorizeds: &HashMap<PrettyCategory, CategorizedMetadata>,
  ) -> Option<AggregatedMetadata> {
    // HACK: Completely independent banner pool, no need for aggregated
    if business == Business::MiliastraWonderland {
      return None;
    }

    // HACK: Bangboo is a completely separate gacha banner
    //   and doesn't count towards the aggregated.
    let records: Vec<&GachaRecord> = if business == Business::ZenlessZoneZero {
      records
        .iter()
        .filter(|record| !record.is_gacha_type_bangboo())
        .collect()
    } else {
      records.iter().collect()
    };

    let total = records.len() as u64;
    let start_time = records.first().map(|record| record.time);
    let end_time = records.last().map(|record| record.time);

    let mut blue_sum = 0;
    let mut blue_values = Vec::new();

    let mut purple_sum = 0;
    let mut purple_values = Vec::new();

    let mut golden_sum = 0;
    let mut golden_up_win_sum = 0;
    let mut golden_values = Vec::new();

    for categorized in categorizeds
      .values() // HACK: See the HACK note above
      .filter(|categorized| categorized.category != PrettyCategory::Bangboo)
    {
      blue_sum += categorized.rankings.blue.sum;
      blue_values.extend_from_slice(&categorized.rankings.blue.values);

      purple_sum += categorized.rankings.purple.sum;
      purple_values.extend_from_slice(&categorized.rankings.purple.values);

      golden_sum += categorized.rankings.golden.sum;
      golden_up_win_sum += categorized.rankings.golden.up_win_sum;
      golden_values.extend_from_slice(&categorized.rankings.golden.values);
    }

    blue_values.sort_by(|a, b| a.id.cmp(&b.id));
    purple_values.sort_by(|a, b| a.id.cmp(&b.id));
    golden_values.sort_by(|a, b| a.id.cmp(&b.id));

    let mut blue_used_pity_sum = 0;
    for blue_record in &blue_values {
      let used_pity = blue_record.used_pity.unwrap_or(0);
      blue_used_pity_sum += used_pity;
    }

    let mut purple_used_pity_sum = 0;
    let mut purple_up_sum = 0;
    let mut purple_up_pity = 0;
    let mut purple_up_used_pity_sum = 0;
    for purple_record in &purple_values {
      let used_pity = purple_record.used_pity.unwrap_or(0);
      purple_used_pity_sum += used_pity;
      purple_up_pity += used_pity;

      if purple_record.up == Some(true) {
        purple_up_sum += 1;
        purple_up_used_pity_sum += purple_up_pity;
        purple_up_pity = 0;
      }
    }

    let mut golden_used_pity_sum = 0;
    let mut golden_up_sum = 0;
    let mut golden_up_pity = 0;
    let mut golden_up_used_pity_sum = 0;
    for golden_record in &golden_values {
      let used_pity = golden_record.used_pity.unwrap_or(0);
      golden_used_pity_sum += used_pity;
      golden_up_pity += used_pity;

      if golden_record.up == Some(true) {
        golden_up_sum += 1;
        golden_up_used_pity_sum += golden_up_pity;
        golden_up_pity = 0;
      }
    }

    let rankings = CategorizedMetadataRankings {
      green: None,
      blue: CategorizedMetadataBlueRanking {
        values: blue_values,
        sum: blue_sum,
        percentage: percentage!(total, blue_sum),
        average: average!(blue_used_pity_sum, blue_sum),
        next_pity: 0,
        next_pity_progress: 0,
      },
      purple: CategorizedMetadataPurpleRanking {
        values: purple_values,
        sum: purple_sum,
        percentage: percentage!(total, purple_sum),
        average: average!(purple_used_pity_sum, purple_sum),
        up_sum: purple_up_sum,
        up_percentage: percentage!(total, purple_up_sum),
        up_average: average!(purple_up_used_pity_sum, purple_up_sum),
        next_pity: 0,
        next_pity_progress: 0,
      },
      golden: CategorizedMetadataGoldenRanking {
        values: golden_values,
        sum: golden_sum,
        percentage: percentage!(total, golden_sum),
        average: average!(golden_used_pity_sum, golden_sum),
        up_sum: golden_up_sum,
        up_percentage: percentage!(total, golden_up_sum),
        up_average: average!(golden_up_used_pity_sum, golden_up_sum),
        up_win_sum: golden_up_win_sum,
        up_win_percentage: percentage!(
          golden_sum - golden_up_sum + golden_up_win_sum,
          golden_up_win_sum
        ),
        next_pity: 0,
        next_pity_progress: 0,
      },
    };

    // let golden_tags = Self::compute_aggregated_golden_tags(records, &rankings.golden);

    Some(AggregatedMetadata {
      total,
      start_time,
      end_time,
      rankings,
      // golden_tags,
    })
  }

  fn compute_aggregated_golden_tags(
    records: Vec<&GachaRecord>,
    golden: &CategorizedMetadataGoldenRanking,
  ) -> Vec<AggregatedGoldenTag> {
    let mut tags = Vec::with_capacity(4);

    {
      let mut sort_by_used_pity: Vec<&PrettyGachaRecord> = golden.values.iter().collect();
      sort_by_used_pity.sort_by(|a, b| a.used_pity.cmp(&b.used_pity));

      if let Some(first) = sort_by_used_pity.first() {
        tags.push(AggregatedGoldenTag::Luck((*first).clone()));
      }
      if let Some(last) = sort_by_used_pity.last() {
        tags.push(AggregatedGoldenTag::Unluck((*last).clone()));
      }
    }

    {
      let mut count_groups: Vec<(&PrettyGachaRecord, u64)> = golden
        .values
        .iter()
        .fold(
          HashMap::<u32, (&PrettyGachaRecord, u64)>::with_capacity(golden.values.len()),
          |mut acc, record| {
            match acc.entry(record.item_id) {
              hash_map::Entry::Occupied(mut o) => {
                o.get_mut().1 += 1;
              }
              hash_map::Entry::Vacant(o) => {
                o.insert((record, 1));
              }
            }
            acc
          },
        )
        .into_values()
        .collect();

      count_groups.sort_by(|a, b| b.1.cmp(&a.1));

      if let Some((record, sum)) = count_groups.first() {
        tags.push(AggregatedGoldenTag::Relation {
          record: (*record).clone(),
          sum: *sum,
        });
      }
    }

    {
      let mut time_groups: Vec<(&OffsetDateTime, u64)> = records
        .iter()
        .fold(
          HashMap::<&OffsetDateTime, (&OffsetDateTime, u64)>::with_capacity(records.len()),
          |mut acc, record| {
            match acc.entry(&record.time) {
              hash_map::Entry::Occupied(mut o) => {
                o.get_mut().1 += 1;
              }
              hash_map::Entry::Vacant(o) => {
                o.insert((&record.time, 1));
              }
            }
            acc
          },
        )
        .into_values()
        .collect();

      time_groups.sort_by(|a, b| b.1.cmp(&a.1));

      if let Some((time, sum)) = time_groups.first() {
        tags.push(AggregatedGoldenTag::Crazy {
          time: **time,
          sum: *sum,
        });
      }
    }

    tags
  }
}
