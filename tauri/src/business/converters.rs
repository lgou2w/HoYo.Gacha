use std::collections::HashMap;
use std::fs::File;
use std::io::{BufWriter, Read, Write};
use std::path::{Path, PathBuf};
use std::str::FromStr;
use std::sync::LazyLock;
use std::{fmt, io};

use hg_game_biz::Uid;
use hg_metadata::Metadata;
use hg_serde_helper::string_number_into;
use hg_url_scraper::{GACHA_LOG_TIME_FORMAT, gacha_log_gacha_id_or_item_id, gacha_log_time_format};
use regex::Regex;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use snafu::{OptionExt, ResultExt, Snafu, ensure};
use time::serde::rfc3339;
use time::{OffsetDateTime, PrimitiveDateTime, UtcOffset};

use crate::business::prettized::{
  GENSHIN_IMPACT_BEGINNER, GENSHIN_IMPACT_CHARACTER, GENSHIN_IMPACT_CHARACTER2,
  GENSHIN_IMPACT_CHRONICLED, GENSHIN_IMPACT_PERMANENT, GENSHIN_IMPACT_WEAPON,
};
use crate::constants;
use crate::database::schemas::{AccountBusiness, GachaRecord, JsonProperties};
use crate::error::{BoxDynErrorDetails, ErrorDetails};

pub trait RecordsWriter {
  type Error: ErrorDetails;

  fn write(
    &self,
    metadata: &dyn Metadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<PathBuf, Self::Error>;
}

pub trait RecordsReader {
  type Error: ErrorDetails;

  fn read(
    &self,
    metadata: &dyn Metadata,
    input: impl AsRef<Path>,
  ) -> Result<Vec<GachaRecord>, Self::Error>;

  fn read_from(
    &self,
    metadata: &dyn Metadata,
    input: impl Read,
  ) -> Result<Vec<GachaRecord>, Self::Error>;
}

// region: Generic types

#[derive(Copy, Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct UigfVersion {
  pub major: u8,
  pub minor: u8,
}

impl UigfVersion {
  pub const V1_0: Self = Self::new(1, 0);
  pub const V2_0: Self = Self::new(2, 0);
  pub const V2_1: Self = Self::new(2, 1);
  pub const V2_2: Self = Self::new(2, 2);
  pub const V2_3: Self = Self::new(2, 3);
  pub const V2_4: Self = Self::new(2, 4);
  pub const V3_0: Self = Self::new(3, 0);
  pub const V4_0: Self = Self::new(4, 0);
  pub const V4_1: Self = Self::new(4, 1);
  pub const V4_2: Self = Self::new(4, 2);

  #[inline]
  pub const fn new(major: u8, minor: u8) -> Self {
    Self { major, minor }
  }
}

impl fmt::Display for UigfVersion {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "v{}.{}", self.major, self.minor)
  }
}

impl FromStr for UigfVersion {
  type Err = ();

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    static UIGF_VERSION_REGEX: LazyLock<Regex> =
      LazyLock::new(|| Regex::new(r"^v(?P<major>\d+)\.(?P<minor>\d+)$").unwrap());

    let caps = UIGF_VERSION_REGEX.captures(s).ok_or(())?;
    let major = caps["major"].parse().unwrap();
    let minor = caps["minor"].parse().unwrap();
    Ok(Self { major, minor })
  }
}

impl<'de> Deserialize<'de> for UigfVersion {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: Deserializer<'de>,
  {
    let s = String::deserialize(deserializer)?;
    Self::from_str(&s).map_err(|_| serde::de::Error::custom("invalid uigf version"))
  }
}

impl Serialize for UigfVersion {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    self.to_string().serialize(serializer)
  }
}

/*
 * Gacha type mapping between Official and UIGF
 * Only support: Genshin Impact
 */
static UIGF_GACHA_TYPE_MAPPINGS: LazyLock<HashMap<u32, u32>> = LazyLock::new(|| {
  HashMap::from_iter([
    (GENSHIN_IMPACT_BEGINNER, GENSHIN_IMPACT_BEGINNER),
    (GENSHIN_IMPACT_PERMANENT, GENSHIN_IMPACT_PERMANENT),
    (GENSHIN_IMPACT_CHARACTER, GENSHIN_IMPACT_CHARACTER),
    (GENSHIN_IMPACT_CHARACTER2, GENSHIN_IMPACT_CHARACTER), // Character2 -> Character
    (GENSHIN_IMPACT_WEAPON, GENSHIN_IMPACT_WEAPON),
    (GENSHIN_IMPACT_CHRONICLED, GENSHIN_IMPACT_CHRONICLED),
  ])
});

#[derive(Debug, Snafu)]
#[snafu(module)]
pub enum UigfError {
  #[snafu(display("Unsupported uigf version: {actual} (Expected: {expected:?}"))]
  UnsupportedVersion {
    actual: UigfVersion,
    expected: &'static [UigfVersion],
  },

  #[snafu(display("Invalid {business:?} account uid: {value}"))]
  InvalidUid {
    business: AccountBusiness,
    value: u32,
  },

  #[snafu(display("Failed to mapping uigf gacha type: {value} (Cursor: {cursor})"))]
  MappingGachaType { value: u32, cursor: usize },

  #[snafu(display(
    "Missing metadata entry: {business:?}, lang: {lang}, {field}: {value} (Cursor: {cursor})"
  ))]
  MetadataEntry {
    business: AccountBusiness,
    lang: String,
    field: &'static str,
    value: String,
    cursor: usize,
  },

  #[snafu(display("Failed to create output '{}', cause: {source}", path.display()))]
  CreateOutput { path: PathBuf, source: io::Error },

  #[snafu(display("Serialization json error: {source}"))]
  Serialize { source: serde_json::Error },

  #[snafu(display("Failed to open input '{}', cause: {source}", path.display()))]
  OpenInput { path: PathBuf, source: io::Error },

  #[snafu(display("Deserialization json error: {source}"))]
  Deserialize { source: serde_json::Error },

  #[snafu(display("Invalid uigf version: {value}"))]
  InvalidVersion { value: String },

  #[snafu(display("Owner uid of the uigf does not match: {actual} (Expected: {expected})"))]
  InconsistentUid { actual: u32, expected: u32 },

  #[snafu(display("Required field missing: {path} (Cursor: {cursor})"))]
  RequiredField { path: &'static str, cursor: usize },

  #[snafu(display("Missing metadata locale: {business:?}, lang: {lang}"))]
  MetadataLocale {
    business: AccountBusiness,
    lang: String,
  },

  #[snafu(display("No account information provided: {business:?}, uid: {uid}"))]
  VacantAccount { business: AccountBusiness, uid: u32 },
}

impl ErrorDetails for UigfError {
  fn name(&self) -> &'static str {
    stringify!(ClassicUigfError)
  }

  fn details(&self) -> Option<serde_json::Value> {
    use serde_json::json;

    Some(match self {
      Self::UnsupportedVersion { actual, expected } => json!({
        "kind": stringify!(UnsupportedVersion),
        "actual": actual,
        "expected": expected,
      }),
      Self::InvalidUid { business, value } => json!({
        "kind": stringify!(InvalidUid),
        "business": business,
        "value": value,
      }),
      Self::MappingGachaType { value, cursor } => json!({
        "kind": stringify!(MappingGachaType),
        "value": value,
        "cursor": cursor,
      }),
      Self::MetadataEntry {
        business,
        lang,
        field,
        value,
        cursor,
      } => json!({
        "kind": stringify!(MetadataEntry),
        "business": business,
        "lang": lang,
        "field": field,
        "value": value,
        "cursor": cursor,
      }),
      Self::CreateOutput { path, source } => json!({
        "kind": stringify!(CreateOutput),
        "path": format_args!("{}", path.display()),
        "cause": {
          "kind": format_args!("{:?}", source.kind()),
          "message": source.to_string(),
        }
      }),
      Self::Serialize { source } => json!({
        "kind": stringify!(Serialize),
        "cause": source.to_string(),
      }),
      Self::OpenInput { path, source } => json!({
        "kind": stringify!(OpenInput),
        "path": format_args!("{}", path.display()),
        "cause": {
          "kind": format_args!("{:?}", source.kind()),
          "message": source.to_string(),
        }
      }),
      Self::Deserialize { source } => json!({
        "kind": stringify!(Deserialize),
        "cause": source.to_string(),
      }),
      Self::InvalidVersion { value } => json!({
        "kind": stringify!(InvalidVersion),
        "value": value,
      }),
      Self::InconsistentUid { actual, expected } => json!({
        "kind": stringify!(InconsistentUid),
        "actual": actual,
        "expected": expected,
      }),
      Self::RequiredField { path, cursor } => json!({
        "kind": stringify!(RequiredField),
        "path": path,
        "cursor": cursor,
      }),
      Self::MetadataLocale { business, lang } => json!({
        "kind": stringify!(MetadataLocale),
        "business": business,
        "lang": lang,
      }),
      Self::VacantAccount { business, uid } => json!({
        "kind": stringify!(VacantAccount),
        "business": business,
        "uid": uid,
      }),
    })
  }
}

// endregion

// region: Classic UIGF or SRGF (.json)

// Classic UIGF (.json)
// Only business: Genshin Impact
// Only support: v2.0, v2.1, v2.2, v2.3, v2.4, v3.0
// https://uigf.org/zh/standards/uigf-legacy-v3.0.html

// Schemas

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ClassicUigf {
  pub info: ClassicUigfInfo,
  pub list: Vec<ClassicUigfItem>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ClassicUigfInfo {
  #[serde(with = "string_number_into")]
  pub uid: u32,
  pub lang: Option<String>,
  pub export_time: Option<String>,
  pub export_timestamp: Option<u64>,
  pub export_app: Option<String>,
  pub export_app_version: Option<String>,
  pub uigf_version: String,
  /// UIGF v2.4: required.
  pub region_time_zone: Option<i8>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ClassicUigfItem {
  pub id: String,
  #[serde(with = "string_number_into::option", default = "Option::default")]
  pub uid: Option<u32>,
  #[serde(with = "string_number_into")]
  pub gacha_type: u32,
  #[serde(with = "string_number_into::option", default = "Option::default")]
  pub count: Option<u32>,
  #[serde(with = "gacha_log_time_format")]
  pub time: PrimitiveDateTime,
  /// UIGF v2.2: required.
  /// UIGF v2.3: nullable.
  pub name: Option<String>,
  pub lang: Option<String>,
  /// UIGF v2.2: is null or empty string.
  /// UIGF v2.3: required.
  #[serde(
    with = "gacha_log_gacha_id_or_item_id::option",
    default = "Option::default"
  )]
  pub item_id: Option<u32>,
  /// UIGF v2.2: required.
  /// UIGF v2.3: nullable.
  pub item_type: Option<String>,
  #[serde(with = "string_number_into::option", default = "Option::default")]
  pub rank_type: Option<u32>,
  #[serde(with = "string_number_into")]
  pub uigf_gacha_type: u32,
}

impl ClassicUigf {
  // Classic UIGF Gacha Records only support: 'Genshin Impact'
  // Supported version: v2.0, v2.1, v2.2, v2.3, v2.4, v3.0
  pub const BUSINESS: AccountBusiness = AccountBusiness::GenshinImpact;
  pub const SUPPORTED_VERSIONS: [UigfVersion; 6] = [
    UigfVersion::V2_0,
    UigfVersion::V2_1,
    UigfVersion::V2_2,
    UigfVersion::V2_3,
    UigfVersion::V2_4,
    UigfVersion::V3_0,
  ];
}

// Writer

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassicUigfWriter {
  pub uigf_version: UigfVersion,
  pub uid: u32,
  pub lang: String,
  #[serde(with = "rfc3339")]
  pub export_time: OffsetDateTime,
  pub pretty: Option<bool>,
}

impl RecordsWriter for ClassicUigfWriter {
  type Error = UigfError;

  fn write(
    &self,
    metadata: &dyn Metadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<PathBuf, Self::Error> {
    // HACK: Please ensure that the records passed are ordered
    // and that the `business`, `uid`, and `records` match the current struct.
    // This method does not validate this data!
    //
    // records[].business == ClassicUigf::BUSINESS
    // records[].uid == self.uid

    // First, Check version
    ensure!(
      ClassicUigf::SUPPORTED_VERSIONS.contains(&self.uigf_version),
      uigf_error::UnsupportedVersionSnafu {
        actual: self.uigf_version,
        expected: &ClassicUigf::SUPPORTED_VERSIONS[..],
      }
    );

    // Verify the uid
    let uid = Uid::validate(ClassicUigf::BUSINESS.as_game(), self.uid).context(
      uigf_error::InvalidUidSnafu {
        business: ClassicUigf::BUSINESS,
        value: self.uid,
      },
    )?;

    // Structuring
    let mut uigf = ClassicUigf {
      info: ClassicUigfInfo {
        uid: uid.value(),
        lang: Some(self.lang.clone()),
        export_time: Some(self.export_time.format(GACHA_LOG_TIME_FORMAT).unwrap()), // SAFETY
        export_timestamp: Some(self.export_time.unix_timestamp() as _),
        export_app: Some(constants::ID.to_owned()),
        export_app_version: Some(constants::VERSION_WITH_PREFIX.to_owned()),
        uigf_version: self.uigf_version.to_string(),
        region_time_zone: Some(uid.game_biz().timezone().whole_hours()),
      },
      list: Vec::with_capacity(records.len()),
    };

    // Convert
    for (index, record) in records.into_iter().enumerate() {
      // See above
      debug_assert_eq!(record.business, ClassicUigf::BUSINESS);
      debug_assert_eq!(record.uid, uid.value());

      // The cursor of the user's record, so it starts at 1
      let cursor = index + 1;

      // Mapping to uigf gacha type
      let uigf_gacha_type = *UIGF_GACHA_TYPE_MAPPINGS.get(&record.gacha_type).context(
        uigf_error::MappingGachaTypeSnafu {
          value: record.gacha_type,
          cursor,
        },
      )?;

      // HACK: No need offset, because `region_time_zone` is already there.
      let time = record.time_to_primitive();

      // Convert the language of the items to preferred language.
      // If needed
      let mut item_name = record.item_name;
      let mut item_type = record.item_type;
      if record.lang.as_str() != self.lang {
        let entry = metadata
          .locale(ClassicUigf::BUSINESS as _, &self.lang)
          .and_then(|locale| locale.entry_from_id(record.item_id))
          .context(uigf_error::MetadataEntrySnafu {
            business: ClassicUigf::BUSINESS,
            lang: self.lang.clone(),
            field: "item_id",
            value: record.item_id.to_string(),
            cursor,
          })?;

        item_name = entry.item_name.to_owned();
        item_type = entry.category_name.to_owned();
      }

      // Always fill in these optional fields to ensure compatibility
      uigf.list.push(ClassicUigfItem {
        id: record.id.clone(),
        uid: Some(uid.value()),
        gacha_type: record.gacha_type,
        count: Some(record.count),
        time,
        name: Some(item_name),
        lang: Some(self.lang.clone()),
        item_id: Some(record.item_id),
        item_type: Some(item_type),
        rank_type: Some(record.rank_type),
        uigf_gacha_type,
      });
    }

    // Write output
    let output: PathBuf = format!("{}.json", output.as_ref().display()).into();
    let output_file = File::create(&output).context(uigf_error::CreateOutputSnafu {
      path: output.clone(),
    })?;

    if self.pretty == Some(true) {
      serde_json::to_writer_pretty(output_file, &uigf)
    } else {
      serde_json::to_writer(output_file, &uigf)
    }
    .context(uigf_error::SerializeSnafu)?;

    Ok(output)
  }
}

// Reader

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassicUigfReader {
  pub uid: u32,
  pub lang: String,
}

impl RecordsReader for ClassicUigfReader {
  type Error = UigfError;

  fn read(
    &self,
    metadata: &dyn Metadata,
    input: impl AsRef<Path>,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    let input = File::open(&input).context(uigf_error::OpenInputSnafu {
      path: input.as_ref().to_path_buf(),
    })?;

    self.read_from(metadata, input)
  }

  fn read_from(
    &self,
    metadata: &dyn Metadata,
    input: impl Read,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    // Deserializing
    let uigf: ClassicUigf = serde_json::from_reader(input).context(uigf_error::DeserializeSnafu)?;

    // Parse version
    let uigf_version = UigfVersion::from_str(&uigf.info.uigf_version).map_err(|_| {
      uigf_error::InvalidVersionSnafu {
        value: uigf.info.uigf_version,
      }
      .build()
    })?;

    // Check version
    ensure!(
      ClassicUigf::SUPPORTED_VERSIONS.contains(&uigf_version),
      uigf_error::UnsupportedVersionSnafu {
        actual: uigf_version,
        expected: &ClassicUigf::SUPPORTED_VERSIONS[..]
      }
    );

    // Verify the uid
    let uid = Uid::validate(ClassicUigf::BUSINESS.as_game(), self.uid).context(
      uigf_error::InvalidUidSnafu {
        business: ClassicUigf::BUSINESS,
        value: self.uid,
      },
    )?;

    // Check uid consistency
    ensure!(
      uigf.info.uid == uid.value(),
      uigf_error::InconsistentUidSnafu {
        actual: uigf.info.uid,
        expected: uid.value(),
      }
    );

    let is_v2_0_to_v2_2 = (UigfVersion::V2_0..=UigfVersion::V2_2).contains(&uigf_version);
    let is_v2_3_and_higher = uigf_version >= UigfVersion::V2_3;
    let is_v2_4_and_higher = uigf_version >= UigfVersion::V2_4;

    // Required: uigf.info.region_time_zone
    if is_v2_4_and_higher {
      ensure!(
        uigf.info.region_time_zone.is_some(),
        uigf_error::RequiredFieldSnafu {
          path: "uigf.info.region_time_zone",
          cursor: 0_usize,
        }
      );
    }

    let server_timezone = uid.game_biz().timezone();
    let target_timezone = uigf
      .info
      .region_time_zone
      .and_then(|hours| UtcOffset::from_hms(hours, 0, 0).ok())
      .unwrap_or(server_timezone);

    // Convert
    let mut records = Vec::with_capacity(uigf.list.len());
    for (index, item) in uigf.list.into_iter().enumerate() {
      // The cursor of the user's record, so it starts at 1
      let cursor = index + 1;

      // Ensure data accuracy
      ensure!(
        item.uid.is_none() || item.uid == Some(uid.value()),
        uigf_error::InconsistentUidSnafu {
          actual: item.uid.unwrap(), // SAFETY, predicate
          expected: uid.value()
        }
      );

      if is_v2_0_to_v2_2 {
        ensure!(
          item.name.is_some(),
          uigf_error::RequiredFieldSnafu {
            path: "uigf.list[].name",
            cursor,
          }
        );
        ensure!(
          item.item_type.is_some(),
          uigf_error::RequiredFieldSnafu {
            path: "uigf.list[].item_type",
            cursor,
          }
        );
      } else if is_v2_3_and_higher {
        ensure!(
          item.item_id.is_some(),
          uigf_error::RequiredFieldSnafu {
            path: "uigf.list[].item_id",
            cursor,
          }
        );
      }

      let lang = item
        .lang
        .as_deref()
        .or(uigf.info.lang.as_deref())
        .unwrap_or(&self.lang);

      let locale = metadata.locale(ClassicUigf::BUSINESS as _, lang).context(
        uigf_error::MetadataLocaleSnafu {
          business: ClassicUigf::BUSINESS,
          lang,
        },
      )?;

      let item_name = item.name.as_deref();
      let entry = if is_v2_0_to_v2_2 {
        locale.entry_from_name_first(item_name.unwrap()) // SAFETY, See ensure!
      } else {
        locale.entry_from_id(item.item_id.unwrap()) // SAFETY
      }
      .context(uigf_error::MetadataEntrySnafu {
        business: ClassicUigf::BUSINESS,
        lang,
        field: if is_v2_0_to_v2_2 { "name" } else { "item_id" },
        value: if is_v2_0_to_v2_2 {
          item_name.unwrap().to_string()
        } else {
          item.item_id.unwrap().to_string()
        },
        cursor,
      })?;

      // Priority is given to the use of user-provided data
      // over the metadata entry.
      records.push(GachaRecord {
        business: ClassicUigf::BUSINESS,
        uid: uid.value(),
        id: item.id,
        gacha_type: item.gacha_type,
        gacha_id: None,
        rank_type: item.rank_type.unwrap_or(entry.rank_type as _),
        count: item.count.unwrap_or(1),
        lang: lang.to_owned(),
        // Convert target timezone to server timezone
        time: item
          .time
          .assume_offset(target_timezone)
          .to_offset(server_timezone),
        item_name: item_name.unwrap_or(entry.item_name).to_owned(),
        item_type: item
          .item_type
          .unwrap_or_else(|| entry.category_name.to_owned()),
        item_id: item.item_id.unwrap_or(entry.item_id),
        properties: None,
      });
    }

    Ok(records)
  }
}

// Classic SRGF (.json)
// Support: v1.0
// https://uigf.org/zh/standards/srgf.html

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ClassicSrgf {
  pub info: ClassicSrgfInfo,
  pub list: Vec<ClassicSrgfItem>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ClassicSrgfInfo {
  #[serde(with = "string_number_into")]
  pub uid: u32,
  pub lang: String,
  pub export_timestamp: Option<u64>,
  pub export_app: Option<String>,
  pub export_app_version: Option<String>,
  pub srgf_version: String,
  pub region_time_zone: i8,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ClassicSrgfItem {
  pub id: String,
  #[serde(with = "string_number_into::option", default = "Option::default")]
  pub uid: Option<u32>,
  #[serde(with = "string_number_into")]
  pub gacha_id: u32,
  #[serde(with = "string_number_into")]
  pub gacha_type: u32,
  #[serde(with = "string_number_into::option", default = "Option::default")]
  pub count: Option<u32>,
  #[serde(with = "gacha_log_time_format")]
  pub time: PrimitiveDateTime,
  pub name: Option<String>,
  pub lang: Option<String>,
  #[serde(with = "string_number_into")]
  pub item_id: u32,
  pub item_type: Option<String>,
  #[serde(with = "string_number_into::option", default = "Option::default")]
  pub rank_type: Option<u32>,
}

impl ClassicSrgf {
  // Classic SRGF Gacha Records only support: 'Honkai: Star Rail'
  // Supported version: v1.0
  pub const BUSINESS: AccountBusiness = AccountBusiness::HonkaiStarRail;
  pub const SUPPORTED_VERSIONS: [UigfVersion; 1] = [UigfVersion::V1_0];
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassicSrgfWriter {
  pub srgf_version: UigfVersion,
  pub uid: u32,
  pub lang: String,
  #[serde(with = "rfc3339")]
  pub export_time: OffsetDateTime,
  pub pretty: Option<bool>,
}

impl RecordsWriter for ClassicSrgfWriter {
  type Error = UigfError;

  fn write(
    &self,
    metadata: &dyn Metadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<PathBuf, Self::Error> {
    // HACK: Please ensure that the records passed are ordered
    // and that the `business`, `uid`, and `records` match the current struct.
    // This method does not validate this data!
    //
    // records[].business == ClassicSrgf::BUSINESS
    // records[].uid == self.uid

    // First, Check version
    ensure!(
      ClassicSrgf::SUPPORTED_VERSIONS.contains(&self.srgf_version),
      uigf_error::UnsupportedVersionSnafu {
        actual: self.srgf_version,
        expected: &ClassicSrgf::SUPPORTED_VERSIONS[..],
      }
    );

    // Verify the uid
    let uid = Uid::validate(ClassicSrgf::BUSINESS.as_game(), self.uid).context(
      uigf_error::InvalidUidSnafu {
        business: ClassicSrgf::BUSINESS,
        value: self.uid,
      },
    )?;

    // Structuring
    let mut srgf = ClassicSrgf {
      info: ClassicSrgfInfo {
        uid: uid.value(),
        lang: self.lang.to_owned(),
        export_timestamp: Some(self.export_time.unix_timestamp() as _),
        export_app: Some(constants::ID.to_owned()),
        export_app_version: Some(constants::VERSION_WITH_PREFIX.to_owned()),
        srgf_version: self.srgf_version.to_string(),
        region_time_zone: uid.game_biz().timezone().whole_hours(),
      },
      list: Vec::with_capacity(records.len()),
    };

    // Convert
    for (index, record) in records.into_iter().enumerate() {
      // See above
      debug_assert_eq!(record.business, ClassicSrgf::BUSINESS);
      debug_assert_eq!(record.uid, uid.value());

      // The cursor of the user's record, so it starts at 1
      let cursor = index + 1;

      // HACK: No need offset, because `region_time_zone` is already there.
      let time = record.time_to_primitive();

      // Convert the language of the items to preferred language.
      // If needed
      let mut item_name = record.item_name;
      let mut item_type = record.item_type;
      if record.lang.as_str() != self.lang {
        let entry = metadata
          .locale(ClassicSrgf::BUSINESS as _, &self.lang)
          .and_then(|locale| locale.entry_from_id(record.item_id))
          .context(uigf_error::MetadataEntrySnafu {
            business: ClassicSrgf::BUSINESS,
            lang: self.lang.clone(),
            field: "item_id",
            value: record.item_id.to_string(),
            cursor,
          })?;

        item_name = entry.item_name.to_owned();
        item_type = entry.category_name.to_owned();
      }

      // HACK: In 'Honkai: Star Rail' business,
      //   the gacha_id value of the Record must exist.
      //   Unless the user manually modifies the database record
      ensure!(
        record.gacha_id.is_some(),
        uigf_error::RequiredFieldSnafu {
          path: "records[].gacha_id",
          cursor,
        }
      );

      // Always fill in these optional fields to ensure compatibility
      srgf.list.push(ClassicSrgfItem {
        id: record.id.clone(),
        uid: Some(uid.value()),
        gacha_id: record.gacha_id.unwrap(), // SAFETY, see above
        gacha_type: record.gacha_type,
        count: Some(record.count),
        time,
        name: Some(item_name),
        lang: Some(self.lang.clone()),
        item_id: record.item_id,
        item_type: Some(item_type),
        rank_type: Some(record.rank_type),
      });
    }

    // Write output
    let output: PathBuf = format!("{}.json", output.as_ref().display()).into();
    let output_file = File::create(&output).context(uigf_error::CreateOutputSnafu {
      path: output.clone(),
    })?;

    if self.pretty == Some(true) {
      serde_json::to_writer_pretty(output_file, &srgf)
    } else {
      serde_json::to_writer(output_file, &srgf)
    }
    .context(uigf_error::SerializeSnafu)?;

    Ok(output)
  }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClassicSrgfReader {
  pub uid: u32,
}

impl RecordsReader for ClassicSrgfReader {
  type Error = UigfError;

  fn read(
    &self,
    metadata: &dyn Metadata,
    input: impl AsRef<Path>,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    let input = File::open(&input).context(uigf_error::OpenInputSnafu {
      path: input.as_ref().to_path_buf(),
    })?;

    self.read_from(metadata, input)
  }

  fn read_from(
    &self,
    metadata: &dyn Metadata,
    input: impl Read,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    // Deserializing
    let srgf: ClassicSrgf = serde_json::from_reader(input).context(uigf_error::DeserializeSnafu)?;

    // Parse version
    let srgf_version = UigfVersion::from_str(&srgf.info.srgf_version).map_err(|_| {
      uigf_error::InvalidVersionSnafu {
        value: srgf.info.srgf_version,
      }
      .build()
    })?;

    // Check version
    ensure!(
      ClassicSrgf::SUPPORTED_VERSIONS.contains(&srgf_version),
      uigf_error::UnsupportedVersionSnafu {
        actual: srgf_version,
        expected: &ClassicSrgf::SUPPORTED_VERSIONS[..]
      }
    );

    // Verify the uid
    let uid = Uid::validate(ClassicSrgf::BUSINESS.as_game(), self.uid).context(
      uigf_error::InvalidUidSnafu {
        business: ClassicSrgf::BUSINESS,
        value: self.uid,
      },
    )?;

    // Check uid consistency
    ensure!(
      srgf.info.uid == uid.value(),
      uigf_error::InconsistentUidSnafu {
        actual: srgf.info.uid,
        expected: uid.value(),
      }
    );

    let server_timezone = uid.game_biz().timezone();
    let target_timezone =
      UtcOffset::from_hms(srgf.info.region_time_zone, 0, 0).unwrap_or(server_timezone);

    // Convert
    let mut records = Vec::with_capacity(srgf.list.len());
    for (index, item) in srgf.list.into_iter().enumerate() {
      // The cursor of the user's record, so it starts at 1
      let cursor = index + 1;

      // Ensure data accuracy
      ensure!(
        item.uid.is_none() || item.uid == Some(uid.value()),
        uigf_error::InconsistentUidSnafu {
          actual: item.uid.unwrap(), // SAFETY, predicate
          expected: uid.value()
        }
      );

      let lang = item.lang.as_deref().unwrap_or(&srgf.info.lang);
      let locale = metadata.locale(ClassicSrgf::BUSINESS as _, lang).context(
        uigf_error::MetadataLocaleSnafu {
          business: ClassicSrgf::BUSINESS,
          lang,
        },
      )?;

      let item_name = item.name.as_deref();
      let entry = locale
        .entry_from_id(item.item_id)
        .context(uigf_error::MetadataEntrySnafu {
          business: ClassicSrgf::BUSINESS,
          lang,
          field: "item_id",
          value: item.item_id.to_string(),
          cursor,
        })?;

      // Priority is given to the use of user-provided data
      // over the metadata entry.
      records.push(GachaRecord {
        business: ClassicSrgf::BUSINESS,
        uid: uid.value(),
        id: item.id,
        gacha_type: item.gacha_type,
        gacha_id: Some(item.gacha_id),
        rank_type: item.rank_type.unwrap_or(entry.rank_type as _),
        count: item.count.unwrap_or(1),
        lang: lang.to_owned(),
        // Convert target timezone to server timezone
        time: item
          .time
          .assume_offset(target_timezone)
          .to_offset(server_timezone),
        item_name: item_name.unwrap_or(entry.item_name).to_owned(),
        item_type: item
          .item_type
          .unwrap_or_else(|| entry.category_name.to_owned()),
        item_id: item.item_id,
        properties: None,
      });
    }

    Ok(records)
  }
}

// endregion

// region: UIGF (.json)
// Support: v4.0, v4.1, v4.2
// https://uigf.org/zh/standards/uigf.html

// Deserialize helper for string or integer u64
fn string_or_integer_de<'de, D, T>(de: D) -> Result<T, D::Error>
where
  D: Deserializer<'de>,
  T: TryFrom<u64>,
  T::Error: fmt::Display,
{
  #[derive(Deserialize)]
  #[serde(untagged)]
  enum StringOrInteger {
    String(String),
    Integer(u64),
  }

  match StringOrInteger::deserialize(de)? {
    StringOrInteger::Integer(num) => T::try_from(num).map_err(serde::de::Error::custom),
    StringOrInteger::String(str) => {
      let num = str.parse::<u64>().map_err(serde::de::Error::custom)?;
      T::try_from(num).map_err(serde::de::Error::custom)
    }
  }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Uigf {
  pub info: UigfInfo,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub hk4e: Option<Vec<UigfProject<UigfHk4eItem>>>,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub hkrpg: Option<Vec<UigfProject<UigfHkrpgItem>>>,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub nap: Option<Vec<UigfProject<UigfNapItem>>>,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub hk4e_ugc: Option<Vec<UigfProject<UigfHk4eBeyondItem>>>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfInfo {
  #[serde(deserialize_with = "string_or_integer_de")]
  pub export_timestamp: u64,
  pub export_app: String,
  pub export_app_version: String,
  pub version: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfProject<Item> {
  #[serde(deserialize_with = "string_or_integer_de")]
  pub uid: u32,
  pub timezone: i8,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub lang: Option<String>,
  pub list: Vec<Item>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfHk4eItem {
  #[serde(with = "string_number_into")]
  pub uigf_gacha_type: u32,
  #[serde(with = "string_number_into")]
  pub gacha_type: u32,
  #[serde(with = "string_number_into")]
  pub item_id: u32,
  #[serde(
    with = "string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub count: Option<u32>,
  #[serde(with = "gacha_log_time_format")]
  pub time: PrimitiveDateTime,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub name: Option<String>,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub item_type: Option<String>,
  #[serde(
    with = "string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub rank_type: Option<u32>,
  pub id: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfHkrpgItem {
  #[serde(with = "string_number_into")]
  pub gacha_id: u32,
  #[serde(with = "string_number_into")]
  pub gacha_type: u32,
  #[serde(with = "string_number_into")]
  pub item_id: u32,
  #[serde(
    with = "string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub count: Option<u32>,
  #[serde(with = "gacha_log_time_format")]
  pub time: PrimitiveDateTime,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub name: Option<String>,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub item_type: Option<String>,
  #[serde(
    with = "string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub rank_type: Option<u32>,
  pub id: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfNapItem {
  #[serde(
    with = "string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub gacha_id: Option<u32>,
  #[serde(with = "string_number_into")]
  pub gacha_type: u32,
  #[serde(with = "string_number_into")]
  pub item_id: u32,
  #[serde(
    with = "string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub count: Option<u32>,
  #[serde(with = "gacha_log_time_format")]
  pub time: PrimitiveDateTime,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub name: Option<String>,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub item_type: Option<String>,
  #[serde(
    with = "string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub rank_type: Option<u32>,
  pub id: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfHk4eBeyondItem {
  pub id: String,
  pub schedule_id: String,
  #[serde(with = "string_number_into")]
  pub op_gacha_type: u32,
  #[serde(with = "string_number_into")]
  pub item_id: u32,
  #[serde(with = "gacha_log_time_format")]
  pub time: PrimitiveDateTime,
  pub item_name: String,
  pub item_type: String,
  #[serde(with = "string_number_into")]
  pub rank_type: u32,
}

impl Uigf {
  pub const SUPPORTED_VERSIONS: [UigfVersion; 3] =
    [UigfVersion::V4_0, UigfVersion::V4_1, UigfVersion::V4_2];
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UigfWriter {
  pub uigf_version: UigfVersion,
  // business -> uid -> lang
  pub businesses: HashMap<AccountBusiness, HashMap<u32, String>>,
  #[serde(with = "rfc3339")]
  pub export_time: OffsetDateTime,
  pub pretty: Option<bool>,
  /// When `true`, All `Option` fields of the `Item` are set to `None`.
  pub minimized: Option<bool>,
}

impl RecordsWriter for UigfWriter {
  type Error = UigfError;

  fn write(
    &self,
    metadata: &dyn Metadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<PathBuf, Self::Error> {
    // First, Check version
    ensure!(
      Uigf::SUPPORTED_VERSIONS.contains(&self.uigf_version),
      uigf_error::UnsupportedVersionSnafu {
        actual: self.uigf_version,
        expected: &Uigf::SUPPORTED_VERSIONS[..],
      }
    );

    // Structuring
    let mut uigf = Uigf {
      info: UigfInfo {
        export_timestamp: self.export_time.unix_timestamp() as _,
        export_app: constants::ID.to_owned(),
        export_app_version: constants::VERSION_WITH_PREFIX.to_owned(),
        version: self.uigf_version.to_string(),
      },
      hk4e: None,
      hkrpg: None,
      nap: None,
      hk4e_ugc: None,
    };

    // Group the records by business and uid
    let mut groups = records.into_iter().fold(
      HashMap::<AccountBusiness, HashMap<u32, Vec<_>>>::new(),
      |mut acc, record| {
        acc
          .entry(record.business)
          .or_default()
          .entry(record.uid)
          .or_default()
          .push(record);

        acc
      },
    );

    // Filter out the businesses that are not expected
    macro_rules! projects {
      ($($business:ident),+,) => {
        (
          $(
            (
              AccountBusiness::$business,
              if self.businesses.contains_key(&AccountBusiness::$business) {
                groups.remove(&AccountBusiness::$business)
              } else {
                None
              },
            ),
          )+
        )
      }
    }

    let (hk4e, hkrpg, nap, hk4e_ugc) =
      projects! { GenshinImpact, HonkaiStarRail, ZenlessZoneZero, MiliastraWonderland, };

    /// Returns `None` if `minimized` is `true`, otherwise returns `$ret`.
    macro_rules! minimized {
      ($minimized:expr, $ret:expr) => {
        if $minimized { None } else { Some($ret) }
      };
    }

    // Convert project fn
    use hg_metadata::Entry;
    fn convert<R, Mapper>(
      writer: &UigfWriter,
      metadata: &dyn Metadata,
      project: (AccountBusiness, Option<HashMap<u32, Vec<GachaRecord>>>),
      mapper: Mapper,
    ) -> Result<Option<Vec<UigfProject<R>>>, UigfError>
    where
      Mapper: Fn(
        GachaRecord, // record
        usize,       // cursor
        Entry<'_>,   // entry
        bool,        // minimized
      ) -> Result<R, UigfError>,
    {
      let (business, uids) = project;
      if uids.as_ref().is_none_or(|map| map.is_empty()) {
        return Ok(None);
      }

      let uids = uids.unwrap(); // SAFETY
      let minimized = writer.minimized.unwrap_or_default();

      let mut projects = Vec::with_capacity(uids.len());
      for (uid, records) in uids {
        // Ensure that the account information is provided
        let lang = writer
          .businesses
          .get(&business)
          .and_then(|map| map.get(&uid))
          .context(uigf_error::VacantAccountSnafu { business, uid })?;

        // Verify the uid
        let uid = Uid::validate(business.as_game(), uid).context(uigf_error::InvalidUidSnafu {
          business,
          value: uid,
        })?;

        // Convert
        let mut items = Vec::with_capacity(records.len());
        for (index, record) in records.into_iter().enumerate() {
          // The cursor of the user's record, so it starts at 1
          let cursor = index + 1;

          // Lookup metadata entry
          let entry = metadata
            .locale(business as _, lang)
            .context(uigf_error::MetadataLocaleSnafu { business, lang })?
            .entry_from_id(record.item_id)
            .context(uigf_error::MetadataEntrySnafu {
              business,
              lang,
              field: "item_id",
              value: record.item_id.to_string(),
              cursor,
            })?;

          let item = mapper(record, cursor, entry, minimized)?;
          items.push(item);
        }

        projects.push(UigfProject {
          uid: uid.value(),
          timezone: uid.game_biz().timezone().whole_hours(),
          lang: minimized! { minimized, lang.to_owned() },
          list: items,
        })
      }

      Ok(Some(projects))
    }

    // 'Genshin Impact'
    uigf.hk4e = convert(self, metadata, hk4e, |record, cursor, entry, minimized| {
      // Mapping to uigf gacha type
      let uigf_gacha_type = *UIGF_GACHA_TYPE_MAPPINGS.get(&record.gacha_type).context(
        uigf_error::MappingGachaTypeSnafu {
          value: record.gacha_type,
          cursor,
        },
      )?;

      let item = UigfHk4eItem {
        uigf_gacha_type,
        gacha_type: record.gacha_type,
        item_id: record.item_id,
        count: minimized! { minimized, record.count },
        time: record.time_to_primitive(),
        name: minimized! { minimized, entry.item_name.to_owned() },
        item_type: minimized! { minimized, entry.category_name.to_owned() },
        rank_type: minimized! { minimized, entry.rank_type as _ },
        id: record.id,
      };

      Ok(item)
    })?;

    // 'Honkai: Star Rail'
    uigf.hkrpg = convert(self, metadata, hkrpg, |record, cursor, entry, minimized| {
      // HACK: In 'Honkai: Star Rail' business,
      //   the gacha_id value of the Record must exist.
      //   Unless the user manually modifies the database record
      ensure!(
        record.gacha_id.is_some(),
        uigf_error::RequiredFieldSnafu {
          path: "records[].gacha_id",
          cursor,
        }
      );

      let item = UigfHkrpgItem {
        gacha_id: record.gacha_id.unwrap(), // SAFETY: See above
        gacha_type: record.gacha_type,
        item_id: record.item_id,
        count: minimized! { minimized, record.count },
        time: record.time_to_primitive(),
        name: minimized! { minimized, entry.item_name.to_owned() },
        item_type: minimized! { minimized, entry.category_name.to_owned() },
        rank_type: minimized! { minimized, entry.rank_type as _ },
        id: record.id,
      };

      Ok(item)
    })?;

    // 'Zenless Zone Zero'
    uigf.nap = convert(self, metadata, nap, |record, _cursor, entry, minimized| {
      let item = UigfNapItem {
        gacha_id: record.gacha_id,
        gacha_type: record.gacha_type,
        item_id: record.item_id,
        count: minimized! { minimized, record.count },
        time: record.time_to_primitive(),
        name: minimized! { minimized, entry.item_name.to_owned() },
        item_type: minimized! { minimized, entry.category_name.to_owned() },
        rank_type: minimized! { minimized, entry.rank_type as _ },
        id: record.id,
      };

      Ok(item)
    })?;

    // 'Genshin Impact: Miliastra Wonderland'
    uigf.hk4e_ugc = convert(
      self,
      metadata,
      hk4e_ugc,
      |record, cursor, entry, _minimized| {
        // See: fetcher.rs :: fetch :: properties
        let schedule_id = record
          .properties
          .as_ref()
          .and_then(|props| props.get("schedule_id"))
          .context(uigf_error::RequiredFieldSnafu {
            path: "records[].properties.schedule_id",
            cursor,
          })?
          .to_string();

        let item = UigfHk4eBeyondItem {
          schedule_id,
          op_gacha_type: record.gacha_type,
          item_id: record.item_id,
          time: record.time_to_primitive(),
          item_name: entry.item_name.to_owned(),
          item_type: entry.category_name.to_owned(),
          rank_type: entry.rank_type as _,
          id: record.id,
        };

        Ok(item)
      },
    )?;

    // Write output
    let output: PathBuf = format!("{}.json", output.as_ref().display()).into();
    let output_file = File::create(&output).context(uigf_error::CreateOutputSnafu {
      path: output.clone(),
    })?;

    if self.pretty == Some(true) {
      serde_json::to_writer_pretty(output_file, &uigf)
    } else {
      serde_json::to_writer(output_file, &uigf)
    }
    .context(uigf_error::SerializeSnafu)?;

    Ok(output)
  }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UigfReader {
  // business -> uid -> lang
  pub businesses: HashMap<AccountBusiness, HashMap<u32, String>>,
}

impl RecordsReader for UigfReader {
  type Error = UigfError;

  fn read(
    &self,
    metadata: &dyn Metadata,
    input: impl AsRef<Path>,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    let input = File::open(&input).context(uigf_error::OpenInputSnafu {
      path: input.as_ref().to_path_buf(),
    })?;

    self.read_from(metadata, input)
  }

  fn read_from(
    &self,
    metadata: &dyn Metadata,
    input: impl Read,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    // Deserializing
    let uigf: Uigf = serde_json::from_reader(input).context(uigf_error::DeserializeSnafu)?;

    // Parse version
    let uigf_version = UigfVersion::from_str(&uigf.info.version).map_err(|_| {
      uigf_error::InvalidVersionSnafu {
        value: uigf.info.version,
      }
      .build()
    })?;

    // Check version
    ensure!(
      Uigf::SUPPORTED_VERSIONS.contains(&uigf_version),
      uigf_error::UnsupportedVersionSnafu {
        actual: uigf_version,
        expected: &Uigf::SUPPORTED_VERSIONS[..]
      }
    );

    // Filter out the businesses that are not expected
    macro_rules! projects {
      ($($proj:ident: $business:ident),+,) => {
        (
          $(
            (
              AccountBusiness::$business,
              if self.businesses.contains_key(&AccountBusiness::$business) {
                uigf.$proj
              } else {
                None
              },
            ),
          )+
        )
      }
    }

    let (hk4e, hkrpg, nap, hk4e_ugc) = projects! { hk4e: GenshinImpact, hkrpg: HonkaiStarRail, nap: ZenlessZoneZero, hk4e_ugc: MiliastraWonderland, };

    // Convert project fn
    type ConvertSupport = (Option<u32>, Option<JsonProperties>); // gacha_id, properties

    trait ItemConvertible: Sized {
      fn item_id(&self) -> u32;
      fn gacha_type(&self) -> u32;
      fn rank_type(&self) -> Option<u32>;
      fn count(&self) -> Option<u32>;
      fn time(&self) -> PrimitiveDateTime;
      fn into_raw(self) -> (String, Option<String>); // id, item_type
    }

    macro_rules! impl_convertibles {
      ($($struct:ident),+,) => {
        $(
          impl ItemConvertible for $struct {
            fn item_id(&self) -> u32 { self.item_id }
            fn gacha_type(&self) -> u32 { self.gacha_type }
            fn rank_type(&self) -> Option<u32> { self.rank_type }
            fn count(&self) -> Option<u32> { self.count }
            fn time(&self) -> PrimitiveDateTime { self.time }
            fn into_raw(self) -> (String, Option<String>) { (self.id, self.item_type) }
          }
        )+
      }
    }

    impl_convertibles! { UigfHk4eItem, UigfHkrpgItem, UigfNapItem, };

    impl ItemConvertible for UigfHk4eBeyondItem {
      fn item_id(&self) -> u32 {
        self.item_id
      }
      fn gacha_type(&self) -> u32 {
        self.op_gacha_type
      }
      fn rank_type(&self) -> Option<u32> {
        Some(self.rank_type)
      }
      fn count(&self) -> Option<u32> {
        None
      }
      fn time(&self) -> PrimitiveDateTime {
        self.time
      }
      fn into_raw(self) -> (String, Option<String>) {
        (self.id, Some(self.item_type))
      }
    }

    fn convert<T, Supplier>(
      reader: &UigfReader,
      metadata: &dyn Metadata,
      records: &mut Vec<GachaRecord>,
      project: (AccountBusiness, Option<Vec<UigfProject<T>>>),
      supplier: Supplier,
    ) -> Result<(), UigfError>
    where
      T: ItemConvertible,
      Supplier: Fn(&T) -> ConvertSupport,
    {
      let (business, projects) = project;
      if projects.as_ref().is_none_or(|vec| vec.is_empty()) {
        return Ok(());
      }

      let projects = projects.unwrap(); // SAFETY: See above
      for project in projects {
        // Skip the project if the account is not expected
        let Some(lang) = reader
          .businesses
          .get(&business)
          .and_then(|map| map.get(&project.uid))
        else {
          continue;
        };

        // Verify the uid
        let uid =
          Uid::validate(business.as_game(), project.uid).context(uigf_error::InvalidUidSnafu {
            business,
            value: project.uid,
          })?;

        let server_timezone = uid.game_biz().timezone();
        let target_timezone =
          UtcOffset::from_hms(project.timezone, 0, 0).unwrap_or(server_timezone);

        let prefer_lang = project.lang.as_deref().unwrap_or(lang.as_str());
        for (index, item) in project.list.into_iter().enumerate() {
          // Because the cursor of the user's record starts at 1
          let cursor = index + 1;

          // Lookup metadata entry
          let item_id = item.item_id();
          let entry = metadata
            .locale(business as _, prefer_lang)
            .context(uigf_error::MetadataLocaleSnafu {
              business,
              lang: prefer_lang,
            })?
            .entry_from_id(item_id)
            .context(uigf_error::MetadataEntrySnafu {
              business,
              lang: prefer_lang,
              field: "item_id",
              value: item_id.to_string(),
              cursor,
            })?;

          let gacha_type = item.gacha_type();
          let rank_type = item.rank_type();
          let count = item.count();
          let time = item.time();
          let (gacha_id, properties) = supplier(&item);
          let (id, item_type) = item.into_raw();

          records.push(GachaRecord {
            business,
            uid: uid.value(),
            id,
            gacha_type,
            gacha_id,
            rank_type: rank_type.unwrap_or(entry.rank_type as _),
            count: count.unwrap_or(1),
            lang: prefer_lang.to_owned(),
            time: time
              .assume_offset(target_timezone)
              .to_offset(server_timezone),
            item_name: entry.item_name.to_owned(),
            item_type: item_type.unwrap_or_else(|| entry.category_name.to_owned()),
            item_id,
            properties,
          });
        }
      }

      Ok(())
    }
    //

    let mut records = Vec::new();

    // 'Genshin Impact'
    convert(self, metadata, &mut records, hk4e, |_item| (None, None))?;

    // 'Honkai: Star Rail'
    convert(self, metadata, &mut records, hkrpg, |item| {
      (Some(item.gacha_id), None)
    })?;

    // 'Zenless Zone Zero'
    convert(self, metadata, &mut records, nap, |item| {
      (item.gacha_id, None)
    })?;

    // 'Genshin Impact: Miliastra Wonderland'
    convert(self, metadata, &mut records, hk4e_ugc, |item| {
      // See: fetcher.rs :: fetch :: properties
      (
        None,
        Some(JsonProperties::from_iter([(
          GachaRecord::KEY_SCHEDULE_ID.into(),
          item.schedule_id.clone().into(),
        )])),
      )
    })?;

    Ok(records)
  }
}

// endregion

// region: CSV (.csv) (Writer only)

#[derive(Debug, Snafu)]
#[snafu(module)]
pub enum CsvError {
  #[snafu(display("Invalid {business:?} account uid: {value}"))]
  InvalidUid {
    business: AccountBusiness,
    value: u32,
  },

  #[snafu(display("Failed to create output '{}', cause: {source}", path.display()))]
  CreateOutput { path: PathBuf, source: io::Error },

  #[snafu(display("Failed to write output '{}', cause: {source}", path.display()))]
  WriteOutput { path: PathBuf, source: io::Error },
}

impl ErrorDetails for CsvError {
  fn name(&self) -> &'static str {
    stringify!(CsvError)
  }

  fn details(&self) -> Option<serde_json::Value> {
    use serde_json::json;

    Some(match self {
      Self::InvalidUid { business, value } => json!({
        "kind": stringify!(InvalidUid),
        "business": business,
        "value": value,
      }),
      Self::CreateOutput { path, source } => json!({
        "kind": stringify!(CreateOutput),
        "path": format_args!("{}", path.display()),
        "cause": {
          "kind": format_args!("{:?}", source.kind()),
          "message": source.to_string(),
        }
      }),
      Self::WriteOutput { path, source } => json!({
        "kind": stringify!(WriteOutput),
        "path": format_args!("{}", path.display()),
        "cause": {
          "kind": format_args!("{:?}", source.kind()),
          "message": source.to_string(),
        }
      }),
    })
  }
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CsvWriter {
  pub business: AccountBusiness,
  pub uid: u32,
  pub without_columns: Option<bool>,
}

impl RecordsWriter for CsvWriter {
  type Error = CsvError;

  fn write(
    &self,
    _metadata: &dyn Metadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<PathBuf, Self::Error> {
    // HACK: Please ensure that the records passed are ordered
    // and that the `business`, `uid`, and `records` match the current struct.
    // This method does not validate this data!
    //
    // records[].business == self.business
    // records[].uid == self.uid
    let is_miliastra_wonderland = self.business == AccountBusiness::MiliastraWonderland;

    // First, verify the uid
    let uid =
      Uid::validate(self.business.as_game(), self.uid).context(csv_error::InvalidUidSnafu {
        business: self.business,
        value: self.uid,
      })?;

    // Create output file
    let output = PathBuf::from(format!("{}.csv", output.as_ref().display()));
    let output_file = File::create(&output).context(csv_error::CreateOutputSnafu {
      path: output.clone(),
    })?;

    // Writer
    let mut writer = BufWriter::new(output_file);

    // Write columns
    // HACK: Using the official API JSON Schema
    // 'Genshin Impact', 'Honkai: Star Rail', 'Zenless Zone Zero'
    const COLUMNS_GENERIC: &[u8] =
      b"uid,gacha_id,gacha_type,item_id,count,time,name,lang,item_type,rank_type,id\n";

    // 'Genshin Impact: Miliastra Wonderlan'
    const COLUMNS_BEYOND: &[u8] =
      b"id,region,uid,schedule_id,item_type,item_id,item_name,rank_type,is_up,time,op_gacha_type\n";

    if !matches!(self.without_columns, Some(true)) {
      if is_miliastra_wonderland {
        writer.write_all(COLUMNS_BEYOND)
      } else {
        writer.write_all(COLUMNS_GENERIC)
      }
      .context(csv_error::WriteOutputSnafu {
        path: output.clone(),
      })?;
    }

    let len = records.len();
    for (index, record) in records.into_iter().enumerate() {
      // See above
      debug_assert_eq!(record.business, self.business);
      debug_assert_eq!(record.uid, uid.value());

      let has_eol = if index + 1 == len { "" } else { "\n" };
      let time = record.time.format(GACHA_LOG_TIME_FORMAT).unwrap(); // SAFETY

      // Please ensure that it corresponds to the columns above.
      if is_miliastra_wonderland {
        // See: fetcher.rs :: fetch :: properties
        let (schedule_id, is_up) = record
          .properties
          .as_ref()
          .map(|props| {
            let schedule_id = props
              .get(GachaRecord::KEY_SCHEDULE_ID)
              .and_then(serde_json::Value::as_str)
              .unwrap_or("");
            let is_up = props
              .get(GachaRecord::KEY_IS_UP)
              .and_then(serde_json::Value::as_str)
              .unwrap_or(GachaRecord::IS_UP_ZERO);
            (schedule_id, is_up)
          })
          .unwrap_or(("", GachaRecord::IS_UP_ZERO));

        write!(
          writer,
          "{},{},{},{},{},{},{},{},{},{},{}{has_eol}",
          record.id,
          uid.game_biz().region(),
          uid.value(),
          schedule_id,
          record.item_type,
          record.item_id,
          record.item_name,
          record.rank_type,
          is_up,
          time,
          record.gacha_type, // op_gacha_type
        )
      } else {
        let gacha_id = record.gacha_id.map(|n| n.to_string()).unwrap_or_default();

        write!(
          writer,
          "{},{},{},{},{},{},{},{},{},{},{}{has_eol}",
          uid.value(),
          gacha_id,
          record.gacha_type,
          record.item_id,
          record.count,
          time,
          record.item_name,
          record.lang,
          record.item_type,
          record.rank_type,
          record.id,
        )
      }
      .context(csv_error::WriteOutputSnafu {
        path: output.clone(),
      })?;
    }

    Ok(output)
  }
}

// endregion

// region: Excel (.xlsx) (Writer only)
// endregion

// region: Factory

#[derive(Debug, Deserialize)]
pub enum RecordsWriterFactory {
  ClassicUigf(ClassicUigfWriter),
  ClassicSrgf(ClassicSrgfWriter),
  Uigf(UigfWriter),
  Csv(CsvWriter),
}

impl RecordsWriterFactory {
  pub fn write(
    self,
    metadata: &dyn Metadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<PathBuf, BoxDynErrorDetails> {
    macro_rules! delegates {
      ($($t:ident),+,) => {
        match self {
          $(
            Self::$t(inner) => inner
              .write(metadata, records, output)
              .map_err(ErrorDetails::boxed),
          )*
        }
      }
    }

    delegates! { ClassicUigf, ClassicSrgf, Uigf, Csv, }
  }
}

#[derive(Debug, Deserialize)]
pub enum RecordsReaderFactory {
  ClassicUigf(ClassicUigfReader),
  ClassicSrgf(ClassicSrgfReader),
  Uigf(UigfReader),
}

impl RecordsReaderFactory {
  pub fn read(
    self,
    metadata: &dyn Metadata,
    input: impl AsRef<Path>,
  ) -> Result<Vec<GachaRecord>, BoxDynErrorDetails> {
    macro_rules! delegates {
      ($($t:ident),+,) => {
        match self {
          $(
            Self::$t(inner) => inner
              .read(metadata, input)
              .map_err(ErrorDetails::boxed),
          )*
        }
      }
    }

    delegates! { ClassicUigf, ClassicSrgf, Uigf, }
  }
}

// endregion
