use std::collections::{hash_map, HashMap};
use std::sync::LazyLock;

use serde::Serialize;

use crate::business::GachaMetadata;
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
      item_id: Option<String>
    },
  }
}

#[derive(Copy, Clone, Debug, Serialize, PartialEq, Eq, Hash)]
pub enum PrettyCategory {
  Beginner, // 'Genshin Impact' and 'Honkai: Star Rail' only
  Permanent,
  Character,
  Weapon,
  Chronicled, // 'Genshin Impact' only
  Bangboo,    // 'Zenless Zone Zero' only
}

// See: models/gacha_record.rs
static KNOWN_CATEGORIZEDS: LazyLock<HashMap<Business, HashMap<u32, PrettyCategory>>> =
  LazyLock::new(|| {
    let mut m = HashMap::with_capacity(3);
    m.insert(
      Business::GenshinImpact,
      HashMap::from_iter([
        (100, PrettyCategory::Beginner),
        (200, PrettyCategory::Permanent),
        (301, PrettyCategory::Character), // Include: 400
        (302, PrettyCategory::Weapon),
        (500, PrettyCategory::Chronicled),
      ]),
    );
    m.insert(
      Business::HonkaiStarRail,
      HashMap::from_iter([
        (2, PrettyCategory::Beginner),
        (1, PrettyCategory::Permanent),
        (11, PrettyCategory::Character),
        (12, PrettyCategory::Weapon),
      ]),
    );
    m.insert(
      Business::ZenlessZoneZero,
      HashMap::from_iter([
        (1, PrettyCategory::Permanent),
        (2, PrettyCategory::Character),
        (3, PrettyCategory::Weapon),
        (5, PrettyCategory::Bangboo),
      ]),
    );
    m
  });

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PrettyGachaRecord {
  pub id: String,
  // See: models/gacha_metadata.rs::GachaMetadata::KNOWN_CATEGORIES
  pub item_category: &'static str,
  pub item_id: String,
  pub name: String,
  pub time: String,
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
    golden: bool,
  ) -> Result<Self, PrettyGachaRecordsError> {
    let entry = metadata
      .obtain(record.business, &record.lang)
      .and_then(|map| {
        if let Some(item_id) = record.item_id.as_deref() {
          map.entry_from_id(item_id)
        } else {
          map.entry_from_name_first(&record.name)
        }
      })
      .ok_or_else(|| PrettyGachaRecordsErrorKind::MissingMetadataEntry {
        business: record.business,
        locale: record.lang.clone(),
        name: record.name.clone(),
        item_id: record.item_id.clone(),
      })?;

    Ok(Self {
      id: record.id.clone(),
      item_category: entry.category,
      item_id: record.item_id.as_deref().unwrap_or(entry.id).to_owned(),
      name: record.name.clone(),
      time: record.time.clone(),
      used_pity,
      limited: if golden { Some(entry.limited) } else { None },
    })
  }
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadataBlueRanking {
  pub values: Vec<PrettyGachaRecord>,
  pub sum: u64,
  pub sum_percentage: String,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadataPurpleRanking {
  pub values: Vec<PrettyGachaRecord>,
  pub sum: u64,
  pub sum_percentage: String,
  pub sum_average: u64,
  pub next_pity: u64,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadataGoldenRanking {
  pub values: Vec<PrettyGachaRecord>,
  pub sum: u64,
  pub sum_percentage: String,
  pub sum_average: u64,
  pub sum_limited: u64,
  pub next_pity: u64,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadataRankings {
  pub blue: CategorizedMetadataBlueRanking,
  pub purple: CategorizedMetadataPurpleRanking,
  pub golden: CategorizedMetadataGoldenRanking,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct CategorizedMetadata {
  pub category: PrettyCategory,
  pub total: u64,
  pub gacha_type: u32,
  pub start_time: Option<String>,
  pub end_time: Option<String>,
  pub last_end_id: Option<String>,
  pub rankings: CategorizedMetadataRankings,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
pub enum AggregatedGoldenTag {
  Luck(PrettyGachaRecord),
  Unluck(PrettyGachaRecord),
  Relation { record: PrettyGachaRecord, sum: u64 },
  Crazy { date: String, sum: u64 },
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AggregatedMetadata {
  pub total: u64,
  pub start_time: Option<String>,
  pub end_time: Option<String>,
  pub rankings: CategorizedMetadataRankings,
  pub golden_tags: Vec<AggregatedGoldenTag>,
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PrettiedGachaRecords {
  pub business: Business,
  pub uid: u32,
  pub total: u64,
  pub start_time: Option<String>,
  pub end_time: Option<String>,
  pub gacha_type_categories: HashMap<u32, PrettyCategory>,
  pub categorizeds: HashMap<PrettyCategory, CategorizedMetadata>,
  pub aggregated: AggregatedMetadata,
}

impl PrettiedGachaRecords {
  pub fn pretty(
    metadata: &GachaMetadata,
    business: Business,
    uid: u32,
    records: &[GachaRecord],
  ) -> Result<Self, PrettyGachaRecordsError> {
    let total = records.len() as u64;
    let start_time = records.first().map(|record| record.time.clone());
    let end_time = records.last().map(|record| record.time.clone());

    let gacha_type_records: HashMap<u32, Vec<&GachaRecord>> =
      records.iter().fold(HashMap::new(), |mut acc, record| {
        acc.entry(record.gacha_type).or_default().push(record);
        acc
      });

    let categorizeds = Self::compute_categorizeds(metadata, business, gacha_type_records)?;
    let aggregated = Self::compute_aggregated(records, &categorizeds);
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
  ) -> Result<HashMap<PrettyCategory, CategorizedMetadata>, PrettyGachaRecordsError> {
    let gacha_type_categories = KNOWN_CATEGORIZEDS.get(&business).unwrap(); // SAFETY
    let mut categorizeds = HashMap::with_capacity(gacha_type_categories.len());

    for (gacha_type, category) in gacha_type_categories {
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
      let start_time = records.first().map(|record| record.time.clone());
      let end_time = records.last().map(|record| record.time.clone());
      let last_end_id = records.last().map(|record| record.id.clone());
      let rankings = Self::compute_categorized_rankings(metadata, records)?;

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

  fn sum_percentage(total: u64, sum: u64) -> String {
    if sum > 0 {
      format!("{}", (sum as f64 / total as f64 * 10000.).round() / 100.)
    } else {
      String::from("0")
    }
  }

  fn sum_average(used_pity_sum: u64, sum: u64) -> u64 {
    if sum > 0 {
      ((used_pity_sum as f64 / sum as f64 * 100.) / 100.).ceil() as u64
    } else {
      0
    }
  }

  fn compute_categorized_rankings(
    metadata: &GachaMetadata,
    records: Vec<&GachaRecord>,
  ) -> Result<CategorizedMetadataRankings, PrettyGachaRecordsError> {
    let total = records.len() as u64;

    let blue = {
      let values = records
        .iter()
        .filter(|record| record.is_rank_type_blue())
        .map(|record| PrettyGachaRecord::mapping(metadata, record, None, false))
        .collect::<Result<Vec<_>, _>>()?;

      let sum = values.len() as u64;
      let sum_percentage = Self::sum_percentage(total, sum);

      CategorizedMetadataBlueRanking {
        values,
        sum,
        sum_percentage,
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
          )?);
        }

        if is_purple || is_golden {
          used_pity_sum += pity;
          pity = 0;
        }
      }

      let sum = values.len() as u64;
      let sum_percentage = Self::sum_percentage(total, sum);
      let sum_average = Self::sum_average(used_pity_sum, sum);

      CategorizedMetadataPurpleRanking {
        values,
        sum,
        sum_percentage,
        sum_average,
        next_pity: pity,
      }
    };

    let golden = {
      let mut values = Vec::with_capacity(records.len());

      let mut pity = 0;
      let mut used_pity_sum = 0;
      let mut sum_limited = 0;

      for record in &records {
        let is_golden = record.is_rank_type_golden();

        pity += 1;

        if is_golden {
          let pretty = PrettyGachaRecord::mapping(metadata, record, Some(pity), true)?;
          if pretty.limited == Some(true) {
            sum_limited += 1;
          }

          values.push(pretty);
          used_pity_sum += pity;
          pity = 0;
        }
      }

      let sum = values.len() as u64;
      let sum_percentage = Self::sum_percentage(total, sum);
      let sum_average = Self::sum_average(used_pity_sum, sum);

      CategorizedMetadataGoldenRanking {
        values,
        sum,
        sum_percentage,
        sum_average,
        sum_limited,
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
    records: &[GachaRecord],
    categorizeds: &HashMap<PrettyCategory, CategorizedMetadata>,
  ) -> AggregatedMetadata {
    let total = records.len() as u64;
    let start_time = records.first().map(|record| record.time.clone());
    let end_time = records.last().map(|record| record.time.clone());

    let mut blue_sum = 0;
    let mut blue_values = Vec::new();

    let mut purple_sum = 0;
    let mut purple_values = Vec::new();

    let mut golden_sum = 0;
    let mut golden_values = Vec::new();

    for categorized in categorizeds.values() {
      blue_sum += categorized.rankings.blue.sum;
      blue_values.extend_from_slice(&categorized.rankings.blue.values);

      purple_sum += categorized.rankings.purple.sum;
      purple_values.extend_from_slice(&categorized.rankings.purple.values);

      golden_sum += categorized.rankings.golden.sum;
      golden_values.extend_from_slice(&categorized.rankings.golden.values);
    }

    blue_values.sort_by(|a, b| a.id.cmp(&b.id));
    purple_values.sort_by(|a, b| a.id.cmp(&b.id));
    golden_values.sort_by(|a, b| a.id.cmp(&b.id));

    let mut purple_used_pity_sum = 0;
    for purple_record in &purple_values {
      purple_used_pity_sum += purple_record.used_pity.unwrap_or(0);
    }

    let mut golden_used_pity_sum = 0;
    let mut golden_sum_limited = 0;
    for golden_record in &golden_values {
      golden_used_pity_sum += golden_record.used_pity.unwrap_or(0);
      if golden_record.limited == Some(true) {
        golden_sum_limited += 1;
      }
    }

    let rankings = CategorizedMetadataRankings {
      blue: CategorizedMetadataBlueRanking {
        values: blue_values,
        sum: blue_sum,
        sum_percentage: Self::sum_percentage(total, blue_sum),
      },
      purple: CategorizedMetadataPurpleRanking {
        values: purple_values,
        sum: purple_sum,
        sum_percentage: Self::sum_percentage(total, purple_sum),
        sum_average: Self::sum_average(purple_used_pity_sum, purple_sum),
        next_pity: 0,
      },
      golden: CategorizedMetadataGoldenRanking {
        values: golden_values,
        sum: golden_sum,
        sum_percentage: Self::sum_percentage(total, golden_sum),
        sum_average: Self::sum_average(golden_used_pity_sum, golden_sum),
        sum_limited: golden_sum_limited,
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
    records: &[GachaRecord],
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
      let mut date_groups: Vec<(&str, u64)> = records
        .iter()
        .fold(
          HashMap::<&str, (&str, u64)>::with_capacity(records.len()),
          |mut acc, record| {
            // HACK: The gacha record time format is fixed: YYYY-MM-DD HH:mm:ss
            if let Some(delimiter) = record.time.find(' ') {
              let date = &record.time[..delimiter];
              match acc.entry(date) {
                hash_map::Entry::Occupied(mut o) => {
                  o.get_mut().1 += 1;
                }
                hash_map::Entry::Vacant(o) => {
                  o.insert((date, 1));
                }
              }
            }
            acc
          },
        )
        .into_values()
        .collect();

      date_groups.sort_by(|a, b| b.1.cmp(&a.1));

      if let Some((date, sum)) = date_groups.first() {
        tags.push(AggregatedGoldenTag::Crazy {
          date: (*date).to_owned(),
          sum: *sum,
        });
      }
    }

    tags
  }
}
