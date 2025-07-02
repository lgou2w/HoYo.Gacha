use std::collections::{HashMap, hash_map};
use std::sync::LazyLock;

use serde::Serialize;
use time::OffsetDateTime;
use time::serde::rfc3339;

use crate::business::{GachaMetadata, GachaMetadataEntryLimited, GachaMetadataEntryRef};
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
}

// See: models/gacha_record.rs
static KNOWN_CATEGORIZEDS: LazyLock<HashMap<Business, HashMap<u32, PrettyCategory>>> =
  LazyLock::new(|| {
    HashMap::from_iter([
      (
        Business::GenshinImpact,
        HashMap::from_iter([
          (100, PrettyCategory::Beginner),
          (200, PrettyCategory::Permanent),
          (301, PrettyCategory::Character),
          (400, PrettyCategory::Character),
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
    ])
  });

impl PrettyCategory {
  pub fn from_gacha_type(business: &Business, value: u32) -> Option<Self> {
    KNOWN_CATEGORIZEDS
      .get(business)
      .unwrap() // SAFETY
      .get(&value)
      .cloned()
  }
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PrettyGachaRecord {
  pub id: String,
  // See: models/gacha_metadata.rs::GachaMetadata::KNOWN_CATEGORIES
  pub item_category: &'static str,
  pub item_id: String,
  pub name: String,
  #[serde(with = "rfc3339")]
  pub time: OffsetDateTime,
  #[serde(skip_serializing_if = "Option::is_none")]
  pub used_pity: Option<u64>, // Purple and Golden only
  #[serde(skip_serializing_if = "Option::is_none")]
  pub limited: Option<bool>, // Golden only
}

impl PrettyGachaRecord {
  fn mapping(
    metadata: &GachaMetadata,
    record: &GachaRecord,
    used_pity: Option<u64>,
    is_golden: bool,
    custom_locale: Option<&str>,
  ) -> Result<Self, PrettyGachaRecordsError> {
    #[inline]
    fn lookup<'a>(
      metadata: &'a GachaMetadata,
      record: &'a GachaRecord,
      locale: &str,
    ) -> Option<GachaMetadataEntryRef<'a>> {
      metadata
        .obtain(record.business, locale)
        .and_then(|map| map.entry_from_id(&record.item_id))
    }

    // Use custom locale first, otherwise use record lang
    let entry = custom_locale
      .and_then(|locale| lookup(metadata, record, locale))
      .or(lookup(metadata, record, &record.lang))
      .ok_or_else(|| PrettyGachaRecordsErrorKind::MissingMetadataEntry {
        business: record.business,
        locale: custom_locale.unwrap_or(&record.lang).to_owned(),
        name: record.name.clone(),
        item_id: record.item_id.clone(),
      })?;

    let limited = if is_golden {
      Some(match entry.limited {
        GachaMetadataEntryLimited::No => false,
        GachaMetadataEntryLimited::Yes => true,
        GachaMetadataEntryLimited::Deadline(deadline) => record.time <= *deadline,
      })
    } else {
      None
    };

    Ok(Self {
      id: record.id.clone(),
      item_category: entry.category,
      // HACK: Always use item_id and name from Metadata
      item_id: entry.id.to_owned(),
      name: entry.name.to_owned(),
      time: record.time,
      used_pity,
      limited,
    })
  }
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadataBlueRanking {
  // HACK: The values of 3-star items are not needed for the time being.
  // pub values: Vec<PrettyGachaRecord>,
  pub sum: u64,
  pub percentage: f64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadataPurpleRanking {
  pub values: Vec<PrettyGachaRecord>,
  pub sum: u64,
  pub percentage: f64,
  pub average: f64,
  pub next_pity: u64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadataGoldenRanking {
  pub values: Vec<PrettyGachaRecord>,
  pub sum: u64,
  pub percentage: f64,
  pub average: f64,
  pub limited_sum: u64,
  pub limited_percentage: f64,
  pub limited_average: f64,
  pub next_pity: u64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadataRankings {
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
  pub golden_tags: Vec<AggregatedGoldenTag>,
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
  pub aggregated: AggregatedMetadata,
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
      .filter(|(gacha_type, _)| !(business == Business::GenshinImpact && **gacha_type == 400))
    {
      let records = {
        let mut result = gacha_type_records.remove(gacha_type).unwrap_or_default();

        // HACK: Genshin Impact: 301 and 400 are the character gacha type
        if business == Business::GenshinImpact && category == &PrettyCategory::Character {
          let character2 = gacha_type_records.remove(&400).unwrap_or_default();
          result.extend(character2);
          result.sort_by(|a, b| a.id.cmp(&b.id));
        }

        result
      };

      let total = records.len() as u64;
      let start_time = records.first().map(|record| record.time);
      let end_time = records.last().map(|record| record.time);
      let last_end_id = records.last().map(|record| record.id.clone());
      let rankings = Self::compute_categorized_rankings(metadata, records, custom_locale)?;

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
    records: Vec<&GachaRecord>,
    custom_locale: Option<&str>,
  ) -> Result<CategorizedMetadataRankings, PrettyGachaRecordsError> {
    let total = records.len() as u64;

    let blue = {
      let values = records
        .iter()
        .filter(|record| record.is_rank_type_blue())
        // .map(|record| PrettyGachaRecord::mapping(metadata, record, None, false, custom_locale))
        // .collect::<Result<Vec<_>, _>>()?;
        .collect::<Vec<_>>();

      let sum = values.len() as u64;

      CategorizedMetadataBlueRanking {
        // values,
        sum,
        percentage: percentage!(total, sum),
      }
    };

    let purple = {
      let mut values = Vec::with_capacity(records.len());

      let mut pity = 0;
      let mut used_pity_sum = 0;

      for record in &records {
        let is_purple = record.is_rank_type_purple();
        let is_golden = record.is_rank_type_golden();

        pity += 1;

        if is_purple {
          values.push(PrettyGachaRecord::mapping(
            metadata,
            record,
            Some(pity),
            false,
            custom_locale,
          )?);
        }

        if is_purple || is_golden {
          used_pity_sum += pity;
          pity = 0;
        }
      }

      let sum = values.len() as u64;

      CategorizedMetadataPurpleRanking {
        values,
        sum,
        percentage: percentage!(total, sum),
        average: average!(used_pity_sum, sum),
        next_pity: pity,
      }
    };

    let golden = {
      let mut values = Vec::with_capacity(records.len());

      let mut pity = 0;
      let mut used_pity_sum = 0;

      let mut limited_sum = 0;
      let mut limited_pity = 0;
      let mut limited_used_pity_sum = 0;

      for record in &records {
        let is_golden = record.is_rank_type_golden();

        pity += 1;
        limited_pity += 1;

        if is_golden {
          let pretty =
            PrettyGachaRecord::mapping(metadata, record, Some(pity), true, custom_locale)?;

          if pretty.limited == Some(true) {
            limited_sum += 1;
            limited_used_pity_sum += limited_pity;
            limited_pity = 0;
          }

          values.push(pretty);
          used_pity_sum += pity;
          pity = 0;
        }
      }

      let sum = values.len() as u64;

      CategorizedMetadataGoldenRanking {
        values,
        sum,
        percentage: percentage!(total, sum),
        average: average!(used_pity_sum, sum),
        limited_sum,
        limited_percentage: percentage!(total, limited_sum),
        limited_average: average!(limited_used_pity_sum, limited_sum),
        next_pity: pity,
      }
    };

    Ok(CategorizedMetadataRankings {
      blue,
      purple,
      golden,
    })
  }

  fn compute_aggregated(
    business: Business,
    records: &[GachaRecord],
    categorizeds: &HashMap<PrettyCategory, CategorizedMetadata>,
  ) -> AggregatedMetadata {
    // HACK: Bangboo is a completely separate gacha pool
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
    // let mut blue_values = Vec::new();

    let mut purple_sum = 0;
    let mut purple_values = Vec::new();

    let mut golden_sum = 0;
    let mut golden_values = Vec::new();

    for categorized in categorizeds
      .values() // HACK: See the HACK note above
      .filter(|categorized| categorized.category != PrettyCategory::Bangboo)
    {
      blue_sum += categorized.rankings.blue.sum;
      // blue_values.extend_from_slice(&categorized.rankings.blue.values);

      purple_sum += categorized.rankings.purple.sum;
      purple_values.extend_from_slice(&categorized.rankings.purple.values);

      golden_sum += categorized.rankings.golden.sum;
      golden_values.extend_from_slice(&categorized.rankings.golden.values);
    }

    // blue_values.sort_by(|a, b| a.id.cmp(&b.id));
    purple_values.sort_by(|a, b| a.id.cmp(&b.id));
    golden_values.sort_by(|a, b| a.id.cmp(&b.id));

    let mut purple_used_pity_sum = 0;
    for purple_record in &purple_values {
      purple_used_pity_sum += purple_record.used_pity.unwrap_or(0);
    }

    let mut golden_used_pity_sum = 0;
    let mut golden_limited_sum = 0;
    let mut golden_limited_pity = 0;
    let mut golden_limited_used_pity_sum = 0;
    for golden_record in &golden_values {
      let used_pity = golden_record.used_pity.unwrap_or(0);
      golden_used_pity_sum += used_pity;
      golden_limited_pity += used_pity;

      if golden_record.limited == Some(true) {
        golden_limited_sum += 1;
        golden_limited_used_pity_sum += golden_limited_pity;
        golden_limited_pity = 0;
      }
    }

    let rankings = CategorizedMetadataRankings {
      blue: CategorizedMetadataBlueRanking {
        // values: blue_values,
        sum: blue_sum,
        percentage: percentage!(total, blue_sum),
      },
      purple: CategorizedMetadataPurpleRanking {
        values: purple_values,
        sum: purple_sum,
        percentage: percentage!(total, purple_sum),
        average: average!(purple_used_pity_sum, purple_sum),
        next_pity: 0,
      },
      golden: CategorizedMetadataGoldenRanking {
        values: golden_values,
        sum: golden_sum,
        percentage: percentage!(total, golden_sum),
        average: average!(golden_used_pity_sum, golden_sum),
        limited_sum: golden_limited_sum,
        limited_percentage: percentage!(total, golden_limited_sum),
        limited_average: average!(golden_limited_used_pity_sum, golden_limited_sum),
        next_pity: 0,
      },
    };

    let golden_tags = Self::compute_aggregated_golden_tags(records, &rankings.golden);

    AggregatedMetadata {
      total,
      start_time,
      end_time,
      rankings,
      golden_tags,
    }
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
          HashMap::<&str, (&PrettyGachaRecord, u64)>::with_capacity(golden.values.len()),
          |mut acc, record| {
            match acc.entry(&record.item_id) {
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
