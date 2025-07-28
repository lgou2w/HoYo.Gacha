use std::collections::{HashMap, HashSet};
use std::fmt::{self, Display};
use std::fs::File;
use std::io::{self, Read};
use std::path::{Path, PathBuf};
use std::str::FromStr;
use std::sync::LazyLock;

use regex::Regex;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use time::serde::rfc3339;
use time::{OffsetDateTime, PrimitiveDateTime, UtcOffset};

use crate::business::{GACHA_TIME_FORMAT, GachaMetadata, GachaMetadataEntryRef, gacha_time_format};
use crate::consts;
use crate::error::{Error, ErrorDetails, declare_error_kinds};
use crate::models::{Business, GachaRecord, ServerRegion};
use crate::utilities::serde_helper;

// region: Declares

pub trait GachaRecordsWriter {
  type Error;

  fn write(
    &self,
    metadata: &GachaMetadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>, // Output file path without extension.
  ) -> Result<PathBuf, Self::Error>;
}

pub trait GachaRecordsReader {
  type Error;

  fn read(
    &self,
    metadata: &GachaMetadata,
    input: impl Read,
  ) -> Result<Vec<GachaRecord>, Self::Error>;

  fn read_from_file(
    &self,
    metadata: &GachaMetadata,
    input: impl AsRef<Path>,
  ) -> Result<Vec<GachaRecord>, Self::Error>;
}

// endregion

// region: Version number

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct UigfVersion {
  pub major: u8,
  pub minor: u8,
}

static VERSION_NUMBER_REGEX: LazyLock<Regex> =
  LazyLock::new(|| Regex::new(r"^v(?P<major>\d+)\.(?P<minor>\d+)$").unwrap());

impl UigfVersion {
  pub const V2_0: Self = Self::new(2, 0);
  pub const V2_1: Self = Self::new(2, 1);
  pub const V2_2: Self = Self::new(2, 2);
  pub const V2_3: Self = Self::new(2, 3);
  pub const V2_4: Self = Self::new(2, 4);
  pub const V3_0: Self = Self::new(3, 0);
  pub const V4_0: Self = Self::new(4, 0);
  pub const fn new(major: u8, minor: u8) -> Self {
    Self { major, minor }
  }
}

impl Display for UigfVersion {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "v{}.{}", self.major, self.minor)
  }
}

impl FromStr for UigfVersion {
  type Err = ();

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    let caps = VERSION_NUMBER_REGEX.captures(s).ok_or(())?;
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

// endregion

// region: UIGF

/*
 * Gacha type mapping between Official and UIGF
 * Only support: Genshin Impact
 *
 * Gacha Type (Official) | Gacha Type (UIGF)
 *       100             |       100
 *       200             |       200
 *       301             |       301
 *       400             |       301
 *       302             |       302
 *       500             |       500
 */
static UIGF_GACHA_TYPE_MAPPINGS: LazyLock<HashMap<u32, u32>> = LazyLock::new(|| {
  HashMap::from_iter([
    (100, 100),
    (200, 200),
    (301, 301),
    (400, 301), // 400 -> 301
    (302, 302),
    (500, 500),
  ])
});

const FIELD_NAME: &str = "name";
const FIELD_ITEM_ID: &str = "item_id";
const FIELD_ITEM_TYPE: &str = "item_type";
const FIELD_REGION_TIME_ZONE: &str = "region_time_zone";

// Legacy UIGF Gacha Records
// Only business: Genshin Impact
// Only support: v2.0, v2.1, v2.2, v2.3, v2.4, v3.0
// https://uigf.org/zh/standards/uigf-legacy-v3.0.html

declare_error_kinds! {
  #[derive(Debug, thiserror::Error)]
  LegacyUigfGachaRecordsWriteError {
    #[error("Invalid business uid: {uid}")]
    InvalidUid {
      uid: u32
    },

    #[error("Incompatible record business: {business}, id: {id}, name: {name}, cursor: {cursor}")]
    IncompatibleRecordBusiness {
      business: Business,
      id: String,
      name: String,
      cursor: usize
    },

    #[error("Incompatible record owner uid: expected: {expected}, actual: {actual}, cursor: {cursor}")]
    IncompatibleRecordOwner {
      expected: u32,
      actual: u32,
      cursor: usize
    },

    #[error("Incompatible record locale: expected: {expected}, actual: {actual}, cursor: {cursor}")]
    IncompatibleRecordLocale {
      expected: String,
      actual: String,
      cursor: usize
    },

    #[error("Failed to mapping uigf gacha type: {value}, cursor: {cursor}")]
    FailedMappingGachaType {
      value: u32,
      cursor: usize
    },

    #[error("Failed to create output '{path}': {cause}")]
    CreateOutput {
      path: PathBuf,
      cause: io::Error => serde_json::json!({
        "kind": cause.kind().to_string(),
        "message": cause.to_string(),
      })
    },

    #[error("Serialization json error: {cause}")]
    Serialize {
      cause: serde_json::Error => cause.to_string()
    },
  }
}

declare_error_kinds! {
  #[derive(Debug, thiserror::Error)]
  LegacyUigfGachaRecordsReadError {
    #[error("Failed to open input '{path}': {cause}")]
    OpenInput {
      path: PathBuf,
      cause: io::Error => serde_json::json!({
        "kind": cause.kind().to_string(),
        "message": cause.to_string(),
      })
    },

    #[error("Invalid json input: {cause}")]
    InvalidInput {
      cause: serde_json::Error => cause.to_string()
    },

    #[error("Invalid uigf version string: {version}")]
    InvalidVersion {
      version: String
    },

    #[error("Unsupported uigf version: {version} (Allowed: {allowed:?})")]
    UnsupportedVersion {
      version: UigfVersion,
      allowed: &'static [UigfVersion]
    },

    #[error("Inconsistent with expected uid: expected: {expected}, actual: {actual}, cursor: {cursor}")]
    InconsistentUid {
      expected: u32,
      actual: u32,
      cursor: usize
    },

    #[error("Invalid business uid: {uid}")]
    InvalidUid {
      uid: u32
    },

    #[error("Invalid region time zone: {value}")]
    InvalidRegionTimeZone {
      value: i8
    },

    #[error("Required field missing: {field}, cursor: {cursor}")]
    RequiredField {
      field: &'static str,
      cursor: usize
    },

    #[error("Missing metadata locale: {locale}, cursor: {cursor}")]
    MissingMetadataLocale {
      locale: String,
      cursor: usize
    },

    #[error("Missing metadata entry: locale: {locale}, {key}: {val}, cursor: {cursor}")]
    MissingMetadataEntry {
      locale: String,
      key: &'static str,
      val: String,
      cursor: usize
    },
  }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct LegacyUigf {
  pub info: LegacyUigfInfo,
  pub list: Vec<LegacyUigfItem>,
}

impl LegacyUigf {
  pub const SUPPORTED_VERSIONS: [UigfVersion; 6] = [
    UigfVersion::V2_0,
    UigfVersion::V2_1,
    UigfVersion::V2_2,
    UigfVersion::V2_3,
    UigfVersion::V2_4,
    UigfVersion::V3_0,
  ];
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct LegacyUigfInfo {
  #[serde(with = "serde_helper::string_number_into")]
  pub uid: u32,
  pub lang: Option<String>,
  pub export_time: Option<String>,
  pub export_timestamp: Option<u64>,
  pub export_app: Option<String>,
  pub export_app_version: Option<String>,
  pub uigf_version: String,
  // UIGF v2.4: required
  pub region_time_zone: Option<i8>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct LegacyUigfItem {
  pub id: String,
  #[serde(
    with = "serde_helper::string_number_into::option",
    default = "Option::default"
  )]
  pub uid: Option<u32>,
  #[serde(with = "serde_helper::string_number_into")]
  pub gacha_type: u32,
  #[serde(
    with = "serde_helper::string_number_into::option",
    default = "Option::default"
  )]
  pub count: Option<u32>,
  #[serde(with = "gacha_time_format")]
  pub time: PrimitiveDateTime,
  // UIGF v2.2: required
  // UIGF v2.3: nullable
  pub name: Option<String>,
  pub lang: Option<String>,
  // UIGF v2.2: is null or empty string
  // UIGF v2.3: required
  #[serde(
    deserialize_with = "serde_helper::de::empty_string_as_none",
    default = "Option::default"
  )]
  pub item_id: Option<String>,
  // UIGF v2.2: required
  // UIGF v2.3: nullable
  pub item_type: Option<String>,
  #[serde(
    with = "serde_helper::string_number_into::option",
    default = "Option::default"
  )]
  pub rank_type: Option<u32>,
  #[serde(with = "serde_helper::string_number_into")]
  pub uigf_gacha_type: u32,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LegacyUigfGachaRecordsWriter {
  pub uigf_version: UigfVersion, // Legacy UIGF version: v2.0, v2.1, v2.2, v2.3, v2.4, v3.0
  pub account_locale: String,
  pub account_uid: u32,
  #[serde(with = "rfc3339")]
  pub export_time: OffsetDateTime,
}

impl GachaRecordsWriter for LegacyUigfGachaRecordsWriter {
  type Error = LegacyUigfGachaRecordsWriteError;

  fn write(
    &self,
    _metadata: &GachaMetadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<PathBuf, Self::Error> {
    // Legacy UIGF Gacha Records only support: Genshin Impact
    const BUSINESS: Business = Business::GenshinImpact;

    let Self {
      uigf_version,
      account_locale,
      account_uid,
      export_time,
    } = self;

    let server_region = ServerRegion::from_uid(BUSINESS, *account_uid)
      .ok_or(LegacyUigfGachaRecordsWriteErrorKind::InvalidUid { uid: *account_uid })?;

    let mut uigf = LegacyUigf {
      info: LegacyUigfInfo {
        uid: *account_uid,
        lang: Some(account_locale.to_owned()),
        export_time: Some(export_time.format(GACHA_TIME_FORMAT).unwrap()),
        export_timestamp: Some(export_time.unix_timestamp() as _),
        export_app: Some(consts::ID.to_owned()),
        export_app_version: Some(consts::VERSION_WITH_PREFIX.to_owned()),
        uigf_version: uigf_version.to_string(),
        region_time_zone: Some(server_region.time_zone().whole_hours()),
      },
      list: Vec::with_capacity(records.len()),
    };

    for (cursor, record) in records.into_iter().enumerate() {
      // The cursor of the user's record, so it starts at 1
      let cursor = cursor + 1;

      // Avoid writing records that are not compatible with the account.
      if record.business != BUSINESS {
        return Err(
          LegacyUigfGachaRecordsWriteErrorKind::IncompatibleRecordBusiness {
            business: record.business,
            id: record.id,
            name: record.name,
            cursor,
          },
        )?;
      } else if record.uid != *account_uid {
        return Err(
          LegacyUigfGachaRecordsWriteErrorKind::IncompatibleRecordOwner {
            expected: *account_uid,
            actual: record.uid,
            cursor,
          },
        )?;
      } else if record.lang != *account_locale {
        return Err(
          LegacyUigfGachaRecordsWriteErrorKind::IncompatibleRecordLocale {
            expected: account_locale.to_owned(),
            actual: record.lang,
            cursor,
          },
        )?;
      }

      let uigf_gacha_type = *UIGF_GACHA_TYPE_MAPPINGS.get(&record.gacha_type).ok_or(
        LegacyUigfGachaRecordsWriteErrorKind::FailedMappingGachaType {
          value: record.gacha_type,
          cursor,
        },
      )?;

      // Always fill in these optional fields to ensure compatibility
      uigf.list.push(LegacyUigfItem {
        uid: Some(record.uid),
        gacha_type: record.gacha_type,
        count: Some(record.count),
        // HACK: No need offset, because `region_time_zone` is already there.
        time: record.time_to_primitive(),
        name: Some(record.name),
        lang: Some(record.lang),
        item_id: Some(record.item_id),
        item_type: Some(record.item_type),
        rank_type: Some(record.rank_type),
        id: record.id,
        uigf_gacha_type,
      })
    }

    let output = PathBuf::from(format!("{}.json", output.as_ref().display()));
    let output_file = File::create(&output).map_err(|cause| {
      LegacyUigfGachaRecordsWriteErrorKind::CreateOutput {
        path: output.clone(),
        cause,
      }
    })?;

    serde_json::to_writer(output_file, &uigf)
      .map_err(|cause| LegacyUigfGachaRecordsWriteErrorKind::Serialize { cause })?;

    Ok(output)
  }
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LegacyUigfGachaRecordsReader {
  pub expected_locale: String,
  pub expected_uid: u32,
}

impl GachaRecordsReader for LegacyUigfGachaRecordsReader {
  type Error = LegacyUigfGachaRecordsReadError;

  fn read_from_file(
    &self,
    metadata: &GachaMetadata,
    input: impl AsRef<Path>,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    let file =
      File::open(&input).map_err(|cause| LegacyUigfGachaRecordsReadErrorKind::OpenInput {
        path: input.as_ref().to_path_buf(),
        cause,
      })?;

    self.read(metadata, file)
  }

  fn read(
    &self,
    metadata: &GachaMetadata,
    input: impl Read,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    // Legacy UIGF Gacha Records only support: Genshin Impact
    const BUSINESS: Business = Business::GenshinImpact;

    let Self {
      expected_locale,
      expected_uid,
    } = self;

    let uigf: LegacyUigf = serde_json::from_reader(input)
      .map_err(|cause| LegacyUigfGachaRecordsReadErrorKind::InvalidInput { cause })?;

    let uigf_version = UigfVersion::from_str(&uigf.info.uigf_version).map_err(|_| {
      LegacyUigfGachaRecordsReadErrorKind::InvalidVersion {
        version: uigf.info.uigf_version,
      }
    })?;

    if !LegacyUigf::SUPPORTED_VERSIONS.contains(&uigf_version) {
      return Err(LegacyUigfGachaRecordsReadErrorKind::UnsupportedVersion {
        version: uigf_version,
        allowed: &LegacyUigf::SUPPORTED_VERSIONS,
      })?;
    }

    if uigf.info.uid != *expected_uid {
      return Err(LegacyUigfGachaRecordsReadErrorKind::InconsistentUid {
        expected: *expected_uid,
        actual: uigf.info.uid,
        cursor: 0, // When it is 0, the info data is incorrect
      })?;
    }

    let server_region = ServerRegion::from_uid(BUSINESS, *expected_uid)
      .ok_or(LegacyUigfGachaRecordsReadErrorKind::InvalidUid { uid: *expected_uid })?;

    let is_v2_0_to_v2_2 = uigf_version >= UigfVersion::V2_0 && uigf_version <= UigfVersion::V2_2;
    let is_v2_3_and_higher = uigf_version >= UigfVersion::V2_3;
    let is_v2_4_and_higher = uigf_version >= UigfVersion::V2_4;

    if is_v2_4_and_higher && uigf.info.region_time_zone.is_none() {
      return Err(LegacyUigfGachaRecordsReadErrorKind::RequiredField {
        field: FIELD_REGION_TIME_ZONE,
        cursor: 0, // When it is 0, the info data is incorrect
      })?;
    }

    let server_time_zone = server_region.time_zone();
    let target_time_zone = if let Some(value) = uigf.info.region_time_zone {
      UtcOffset::from_hms(value, 0, 0)
        .map_err(|_| LegacyUigfGachaRecordsReadErrorKind::InvalidRegionTimeZone { value })?
    } else {
      server_time_zone
    };

    let mut records = Vec::with_capacity(uigf.list.len());
    for (cursor, item) in uigf.list.into_iter().enumerate() {
      // The cursor of the user's record, so it starts at 1
      let cursor = cursor + 1;

      if let Some(uid) = item.uid {
        if uid != *expected_uid {
          return Err(LegacyUigfGachaRecordsReadErrorKind::InconsistentUid {
            expected: *expected_uid,
            actual: uid,
            cursor,
          })?;
        }
      }

      if is_v2_0_to_v2_2 {
        if item.name.is_none() {
          return Err(LegacyUigfGachaRecordsReadErrorKind::RequiredField {
            field: FIELD_NAME,
            cursor,
          })?;
        } else if item.item_type.is_none() {
          return Err(LegacyUigfGachaRecordsReadErrorKind::RequiredField {
            field: FIELD_ITEM_TYPE,
            cursor,
          })?;
        }
      } else if is_v2_3_and_higher && item.item_id.is_none() {
        return Err(LegacyUigfGachaRecordsReadErrorKind::RequiredField {
          field: FIELD_ITEM_ID,
          cursor,
        })?;
      }

      let name = item.name.clone();
      let item_id = item.item_id.clone();

      let locale = item
        .lang
        .or(uigf.info.lang.clone())
        .unwrap_or(expected_locale.clone());

      let metadata_locale = metadata.obtain(BUSINESS, &locale).ok_or_else(|| {
        LegacyUigfGachaRecordsReadErrorKind::MissingMetadataLocale {
          locale: locale.clone(),
          cursor,
        }
      })?;

      let metadata_entry = if is_v2_0_to_v2_2 {
        metadata_locale.entry_from_name_first(name.as_ref().unwrap())
      } else {
        metadata_locale.entry_from_id(item_id.as_ref().unwrap())
      }
      .ok_or_else(
        || LegacyUigfGachaRecordsReadErrorKind::MissingMetadataEntry {
          locale: locale.clone(),
          key: if is_v2_0_to_v2_2 {
            FIELD_NAME
          } else {
            FIELD_ITEM_ID
          },
          val: if is_v2_0_to_v2_2 {
            name.clone().unwrap()
          } else {
            item_id.clone().unwrap()
          },
          cursor,
        },
      )?;

      // Priority is given to the use of user-provided data
      // over the metadata entry.
      records.push(GachaRecord {
        business: BUSINESS,
        uid: item.uid.unwrap_or(*expected_uid),
        id: item.id,
        gacha_type: item.gacha_type,
        gacha_id: None,
        rank_type: item.rank_type.unwrap_or(metadata_entry.rank as _),
        count: item.count.unwrap_or(1),
        lang: locale,
        time: item
          .time
          .assume_offset(target_time_zone)
          .to_offset(server_time_zone),
        name: item.name.unwrap_or(metadata_entry.name.to_owned()),
        item_type: item
          .item_type
          .unwrap_or(metadata_entry.category_name.to_owned()),
        item_id: item.item_id.unwrap_or(metadata_entry.id.to_owned()),
      })
    }

    Ok(records)
  }
}

// Fresh UIGF Gacha Records
// Support: v4.0
// https://uigf.org/zh/standards/uigf.html

declare_error_kinds! {
  #[derive(Debug, thiserror::Error)]
  UigfGachaRecordsWriteError {
    #[error("No account information provided: {business}, uid: {uid}")]
    VacantAccount {
      business: Business,
      uid: u32
    },

    #[error("Invalid business uid: {business}, uid: {uid}")]
    InvalidUid {
      business: Business,
      uid: u32
    },

    #[error("Missing metadata entry: {business}, locale: {locale}, {key}: {val}, cursor: {cursor}")]
    MissingMetadataEntry {
      business: Business,
      locale: String,
      key: &'static str,
      val: String,
      cursor: usize
    },

    #[error("Failed to mapping uigf gacha type: {value}, cursor: {cursor}")]
    FailedMappingGachaType {
      value: u32,
      cursor: usize
    },

    #[error("Failed to create output '{path}': {cause}")]
    CreateOutput {
      path: PathBuf,
      cause: io::Error => serde_json::json!({
        "kind": cause.kind().to_string(),
        "message": cause.to_string(),
      })
    },

    #[error("Serialization json error: {cause}")]
    Serialize {
      cause: serde_json::Error => cause.to_string()
    },
  }
}

declare_error_kinds! {
  #[derive(Debug, thiserror::Error)]
  UigfGachaRecordsReadError {
    #[error("Failed to open input '{path}': {cause}")]
    OpenInput {
      path: PathBuf,
      cause: io::Error => serde_json::json!({
        "kind": cause.kind().to_string(),
        "message": cause.to_string(),
      })
    },

    #[error("Invalid json input: {cause}")]
    InvalidInput {
      cause: serde_json::Error => cause.to_string()
    },

    #[error("Invalid uigf version string: {version}")]
    InvalidVersion {
      version: String
    },

    #[error("Unsupported uigf version: {version} (Allowed: {allowed:?})")]
    UnsupportedVersion {
      version: UigfVersion,
      allowed: &'static [UigfVersion]
    },

    #[error("Invalid business uid: {business}, uid: {uid}")]
    InvalidUid {
      business: Business,
      uid: u32
    },

    #[error("Invalid region time zone: {business}, time zone: {value}")]
    InvalidRegionTimeZone {
      business: Business,
      value: i8
    },

    #[error("Missing metadata entry: {business}, locale: {locale}, {key}: {val}, cursor: {cursor}")]
    MissingMetadataEntry {
      business: Business,
      locale: String,
      key: &'static str,
      val: String,
      cursor: usize
    },
  }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Uigf {
  pub info: UigfInfo,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub hk4e: Option<Vec<UigfEntry<UigfHk4eItem>>>,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub hkrpg: Option<Vec<UigfEntry<UigfHkrpgItem>>>,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub nap: Option<Vec<UigfEntry<UigfNapItem>>>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfInfo {
  #[serde(with = "serde_helper::string_number_into")]
  pub export_timestamp: u64,
  pub export_app: String,
  pub export_app_version: String,
  pub version: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfEntry<Item> {
  #[serde(with = "serde_helper::string_number_into")]
  pub uid: u32,
  pub timezone: i8,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub lang: Option<String>,
  pub list: Vec<Item>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfHk4eItem {
  #[serde(with = "serde_helper::string_number_into")]
  pub uigf_gacha_type: u32,
  #[serde(with = "serde_helper::string_number_into")]
  pub gacha_type: u32,
  pub item_id: String,
  #[serde(
    with = "serde_helper::string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub count: Option<u32>,
  #[serde(with = "gacha_time_format")]
  pub time: PrimitiveDateTime,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub item_type: Option<String>,
  #[serde(
    with = "serde_helper::string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub rank_type: Option<u32>,
  pub id: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfHkrpgItem {
  #[serde(with = "serde_helper::string_number_into")]
  pub gacha_id: u32,
  #[serde(with = "serde_helper::string_number_into")]
  pub gacha_type: u32,
  pub item_id: String,
  #[serde(
    with = "serde_helper::string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub count: Option<u32>,
  #[serde(with = "gacha_time_format")]
  pub time: PrimitiveDateTime,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub item_type: Option<String>,
  #[serde(
    with = "serde_helper::string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub rank_type: Option<u32>,
  pub id: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfNapItem {
  #[serde(
    with = "serde_helper::string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub gacha_id: Option<u32>,
  #[serde(with = "serde_helper::string_number_into")]
  pub gacha_type: u32,
  pub item_id: String,
  #[serde(
    with = "serde_helper::string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub count: Option<u32>,
  #[serde(with = "gacha_time_format")]
  pub time: PrimitiveDateTime,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub item_type: Option<String>,
  #[serde(
    with = "serde_helper::string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub rank_type: Option<u32>,
  pub id: String,
}

impl Uigf {
  pub const SUPPORTED_VERSIONS: [UigfVersion; 1] = [UigfVersion::V4_0];
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UigfGachaRecordsWriter {
  pub businesses: Option<HashSet<Business>>, // None for all businesses
  pub accounts: HashMap<u32, String>,        // uid -> (timezone, locale)
  #[serde(with = "rfc3339")]
  pub export_time: OffsetDateTime,
  /// When `true`, all `Option` fields have a value of `None`.
  pub minimized: Option<bool>,
}

impl GachaRecordsWriter for UigfGachaRecordsWriter {
  type Error = UigfGachaRecordsWriteError;

  fn write(
    &self,
    metadata: &GachaMetadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<PathBuf, Self::Error> {
    let Self {
      businesses,
      accounts,
      export_time,
      minimized,
    } = self;

    let minimized = minimized.unwrap_or_default();

    let mut uigf = Uigf {
      info: UigfInfo {
        export_timestamp: export_time.unix_timestamp() as _,
        export_app: consts::ID.to_owned(),
        export_app_version: consts::VERSION_WITH_PREFIX.to_owned(),
        version: UigfVersion::V4_0.to_string(),
      },
      hk4e: None,
      hkrpg: None,
      nap: None,
    };

    // Group the records by business and uid
    let mut groups = records.into_iter().fold(
      HashMap::<Business, HashMap<u32, Vec<_>>>::new(),
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
    let (hk4e, hkrpg, nap) = if let Some(businesses) = businesses {
      (
        if businesses.contains(&Business::GenshinImpact) {
          groups.remove(&Business::GenshinImpact)
        } else {
          None
        },
        if businesses.contains(&Business::HonkaiStarRail) {
          groups.remove(&Business::HonkaiStarRail)
        } else {
          None
        },
        if businesses.contains(&Business::ZenlessZoneZero) {
          groups.remove(&Business::ZenlessZoneZero)
        } else {
          None
        },
      )
    } else {
      (
        groups.remove(&Business::GenshinImpact),
        groups.remove(&Business::HonkaiStarRail),
        groups.remove(&Business::ZenlessZoneZero),
      )
    };

    macro_rules! convert {
      ($business:ident, $entry:ident, $item_convert:expr) => {
        let mut entries = Vec::with_capacity($entry.len());

        for (uid, records) in $entry {
          // Ensure that the account information is provided
          let locale =
            accounts
              .get(&uid)
              .cloned()
              .ok_or(UigfGachaRecordsWriteErrorKind::VacantAccount {
                business: Business::$business,
                uid,
              })?;

          let server_region = ServerRegion::from_uid(Business::$business, uid).ok_or(
            UigfGachaRecordsWriteErrorKind::InvalidUid {
              business: Business::$business,
              uid,
            },
          )?;

          let mut list = Vec::with_capacity(records.len());
          for (cursor, record) in records.into_iter().enumerate() {
            // The cursor of the user's record, so it starts at 1
            let cursor = cursor + 1;

            let item_id = record.item_id.clone();
            let metadata_entry = metadata
              .obtain(Business::$business, &record.lang)
              .and_then(|map| map.entry_from_id(&item_id))
              .ok_or_else(|| UigfGachaRecordsWriteErrorKind::MissingMetadataEntry {
                business: Business::$business,
                locale: record.lang.clone(),
                key: FIELD_ITEM_ID,
                val: item_id.clone(),
                cursor,
              })?;

            let item = $item_convert(cursor, record, metadata_entry, minimized)?;
            list.push(item);
          }

          entries.push(UigfEntry {
            uid,
            timezone: server_region.time_zone().whole_hours(),
            lang: if minimized { None } else { Some(locale) },
            list,
          });
        }

        uigf.$entry.replace(entries);
      };
    }

    if let Some(hk4e) = hk4e {
      convert!(
        GenshinImpact,
        hk4e,
        |cursor: usize,
         record: GachaRecord,
         metadata_entry: GachaMetadataEntryRef<'_>,
         minimized: bool| {
          Result::<_, Self::Error>::Ok(UigfHk4eItem {
            uigf_gacha_type: *UIGF_GACHA_TYPE_MAPPINGS.get(&record.gacha_type).ok_or(
              UigfGachaRecordsWriteErrorKind::FailedMappingGachaType {
                value: record.gacha_type,
                cursor,
              },
            )?,
            gacha_type: record.gacha_type,
            count: if minimized { None } else { Some(record.count) },
            // HACK: No need offset, because `timezone` is already there.
            time: record.time_to_primitive(),
            item_type: if minimized {
              None
            } else {
              Some(metadata_entry.category_name.to_owned())
            },
            rank_type: if minimized {
              None
            } else {
              Some(record.rank_type)
            },
            item_id: record.item_id,
            id: record.id,
          })
        }
      );
    }

    if let Some(hkrpg) = hkrpg {
      convert!(
        HonkaiStarRail,
        hkrpg,
        |cursor: usize,
         record: GachaRecord,
         metadata_entry: GachaMetadataEntryRef<'_>,
         minimized: bool| {
          // HACK: In 'Honkai: Star Rail' business,
          //   the gacha_id value of the Record must exist.
          //   Unless the user manually modifies the database record
          let gacha_id = record.gacha_id.unwrap_or_else(|| {
            panic!("Missing gacha_id in the record: {record:?}, cursor: {cursor}")
          });

          Result::<_, Self::Error>::Ok(UigfHkrpgItem {
            gacha_id,
            gacha_type: record.gacha_type,
            count: if minimized { None } else { Some(record.count) },
            // HACK: No need offset, because `timezone` is already there.
            time: record.time_to_primitive(),
            item_type: if minimized {
              None
            } else {
              Some(metadata_entry.category_name.to_owned())
            },
            rank_type: if minimized {
              None
            } else {
              Some(record.rank_type)
            },
            item_id: record.item_id,
            id: record.id,
          })
        }
      );
    }

    if let Some(nap) = nap {
      convert!(
        ZenlessZoneZero,
        nap,
        |_: usize,
         record: GachaRecord,
         metadata_entry: GachaMetadataEntryRef<'_>,
         minimized: bool| {
          Result::<_, Self::Error>::Ok(UigfNapItem {
            gacha_id: record.gacha_id,
            gacha_type: record.gacha_type,
            count: if minimized { None } else { Some(record.count) },
            // HACK: No need offset, because `timezone` is already there.
            time: record.time_to_primitive(),
            item_type: if minimized {
              None
            } else {
              Some(metadata_entry.category_name.to_owned())
            },
            rank_type: if minimized {
              None
            } else {
              Some(record.rank_type)
            },
            item_id: record.item_id,
            id: record.id,
          })
        }
      );
    }

    let output = PathBuf::from(format!("{}.json", output.as_ref().display()));
    let output_file =
      File::create(&output).map_err(|cause| UigfGachaRecordsWriteErrorKind::CreateOutput {
        path: output.clone(),
        cause,
      })?;

    serde_json::to_writer(output_file, &uigf)
      .map_err(|cause| UigfGachaRecordsWriteErrorKind::Serialize { cause })?;

    Ok(output)
  }
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UigfGachaRecordsReader {
  pub businesses: Option<HashSet<Business>>, // None for all businesses
  pub accounts: HashMap<u32, String>,        // uid: locale
}

impl GachaRecordsReader for UigfGachaRecordsReader {
  type Error = UigfGachaRecordsReadError;

  fn read_from_file(
    &self,
    metadata: &GachaMetadata,
    input: impl AsRef<Path>,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    let file = File::open(&input).map_err(|cause| UigfGachaRecordsReadErrorKind::OpenInput {
      path: input.as_ref().to_path_buf(),
      cause,
    })?;

    self.read(metadata, file)
  }

  fn read(
    &self,
    metadata: &GachaMetadata,
    input: impl Read,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    let Self {
      businesses,
      accounts,
    } = self;

    let uigf: Uigf = serde_json::from_reader(input)
      .map_err(|cause| UigfGachaRecordsReadErrorKind::InvalidInput { cause })?;

    let uigf_version = UigfVersion::from_str(&uigf.info.version).map_err(|_| {
      UigfGachaRecordsReadErrorKind::InvalidVersion {
        version: uigf.info.version,
      }
    })?;

    if !Uigf::SUPPORTED_VERSIONS.contains(&uigf_version) {
      return Err(UigfGachaRecordsReadErrorKind::UnsupportedVersion {
        version: uigf_version,
        allowed: &Uigf::SUPPORTED_VERSIONS,
      })?;
    }

    // Filter out the businesses that are not expected
    let (hk4e, hkrpg, nap) = if let Some(businesses) = businesses {
      (
        if businesses.contains(&Business::GenshinImpact) {
          uigf.hk4e
        } else {
          None
        },
        if businesses.contains(&Business::HonkaiStarRail) {
          uigf.hkrpg
        } else {
          None
        },
        if businesses.contains(&Business::ZenlessZoneZero) {
          uigf.nap
        } else {
          None
        },
      )
    } else {
      (uigf.hk4e, uigf.hkrpg, uigf.nap)
    };

    // Calculate the total number of records
    #[inline]
    fn sum_vec_entry<T>(v: Option<&Vec<UigfEntry<T>>>) -> usize {
      v.map(|v| v.len()).unwrap_or(0)
    }

    let mut records = Vec::with_capacity(
      sum_vec_entry(hk4e.as_ref()) + sum_vec_entry(hkrpg.as_ref()) + sum_vec_entry(nap.as_ref()),
    );

    macro_rules! convert {
      ($business:ident, $entry:ident, $gacha_id:expr) => {
        for entry in $entry {
          // Skip the entry if the account is not expected
          let Some(locale) = accounts.get(&entry.uid) else {
            continue;
          };

          let server_region = ServerRegion::from_uid(Business::$business, entry.uid).ok_or(
            UigfGachaRecordsReadErrorKind::InvalidUid {
              business: Business::$business,
              uid: entry.uid,
            },
          )?;

          let server_time_zone = server_region.time_zone();
          let target_time_zone = UtcOffset::from_hms(entry.timezone, 0, 0).map_err(|_| {
            UigfGachaRecordsReadErrorKind::InvalidRegionTimeZone {
              business: Business::$business,
              value: entry.timezone,
            }
          })?;

          let locale = entry.lang.unwrap_or(locale.to_owned());
          for (cursor, item) in entry.list.into_iter().enumerate() {
            // Because the cursor of the user's record starts at 1
            let cursor = cursor + 1;

            let metadata_entry = metadata
              .obtain(Business::$business, &locale)
              .and_then(|map| map.entry_from_id(&item.item_id))
              .ok_or_else(|| UigfGachaRecordsReadErrorKind::MissingMetadataEntry {
                business: Business::$business,
                locale: locale.clone(),
                key: FIELD_ITEM_ID,
                val: item.item_id.clone(),
                cursor,
              })?;

            let gacha_id = $gacha_id(&item);
            records.push(GachaRecord {
              business: Business::$business,
              uid: entry.uid,
              id: item.id,
              gacha_type: item.gacha_type,
              gacha_id,
              rank_type: item.rank_type.unwrap_or(metadata_entry.rank as _),
              count: item.count.unwrap_or(1),
              lang: locale.clone(),
              time: item
                .time
                .assume_offset(target_time_zone)
                .to_offset(server_time_zone),
              name: metadata_entry.name.to_owned(),
              item_type: item
                .item_type
                .unwrap_or(metadata_entry.category_name.to_owned()),
              item_id: item.item_id,
            })
          }
        }
      };
    }

    if let Some(hk4e) = hk4e {
      convert!(GenshinImpact, hk4e, |_| None);
    }

    if let Some(hkrpg) = hkrpg {
      convert!(HonkaiStarRail, hkrpg, |item: &UigfHkrpgItem| Some(
        item.gacha_id
      ));
    }

    if let Some(nap) = nap {
      convert!(ZenlessZoneZero, nap, |item: &UigfNapItem| item.gacha_id);
    }

    Ok(records)
  }
}

// endregion

// region: SRGF

// Legacy SRGF Gacha Records
// Support: v1.0
// https://uigf.org/zh/standards/srgf.html

declare_error_kinds! {
  #[derive(Debug, thiserror::Error)]
  SrgfGachaRecordsWriteError {
    #[error("Invalid business uid: {uid}")]
    InvalidUid {
      uid: u32
    },

    #[error("Incompatible record business: {business}, id: {id}, name: {name}, cursor: {cursor}")]
    IncompatibleRecordBusiness {
      business: Business,
      id: String,
      name: String,
      cursor: usize
    },

    #[error("Incompatible record owner uid: expected: {expected}, actual: {actual}, cursor: {cursor}")]
    IncompatibleRecordOwner {
      expected: u32,
      actual: u32,
      cursor: usize
    },

    #[error("Incompatible record locale: expected: {expected}, actual: {actual}, cursor: {cursor}")]
    IncompatibleRecordLocale {
      expected: String,
      actual: String,
      cursor: usize
    },

    #[error("Failed to create output '{path}': {cause}")]
    CreateOutput {
      path: PathBuf,
      cause: io::Error => serde_json::json!({
        "kind": cause.kind().to_string(),
        "message": cause.to_string(),
      })
    },

    #[error("Serialization json error: {cause}")]
    Serialize {
      cause: serde_json::Error => cause.to_string()
    },
  }
}

declare_error_kinds! {
  #[derive(Debug, thiserror::Error)]
  SrgfGachaRecordsReadError {
    #[error("Failed to open input '{path}': {cause}")]
    OpenInput {
      path: PathBuf,
      cause: io::Error => serde_json::json!({
        "kind": cause.kind().to_string(),
        "message": cause.to_string(),
      })
    },

    #[error("Invalid json input: {cause}")]
    InvalidInput {
      cause: serde_json::Error => cause.to_string()
    },

    #[error("Invalid uigf version string: {version}")]
    InvalidVersion {
      version: String
    },

    #[error("Unsupported uigf version: {version} (Allowed: {allowed:?})")]
    UnsupportedVersion {
      version: UigfVersion,
      allowed: &'static [UigfVersion]
    },

    #[error("Inconsistent with expected uid: expected: {expected}, actual: {actual}, cursor: {cursor}")]
    InconsistentUid {
      expected: u32,
      actual: u32,
      cursor: usize
    },

    #[error("Invalid business uid: {uid}")]
    InvalidUid {
      uid: u32
    },

    #[error("Invalid region time zone: {value}")]
    InvalidRegionTimeZone {
      value: i8
    },

    #[error("Missing metadata locale: {locale}, cursor: {cursor}")]
    MissingMetadataLocale {
      locale: String,
      cursor: usize
    },

    #[error("Missing metadata entry: {key}: {val}, locale: {locale}, cursor: {cursor}")]
    MissingMetadataEntry {
      locale: String,
      key: &'static str,
      val: String,
      cursor: usize
    },
  }
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Srgf {
  pub info: SrgfInfo,
  pub list: Vec<SrgfItem>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SrgfInfo {
  #[serde(with = "serde_helper::string_number_into")]
  pub uid: u32,
  pub lang: String,
  pub export_timestamp: Option<u64>,
  pub export_app: Option<String>,
  pub export_app_version: Option<String>,
  pub srgf_version: String,
  pub region_time_zone: i8,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SrgfItem {
  pub id: String,
  #[serde(
    with = "serde_helper::string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub uid: Option<u32>,
  #[serde(with = "serde_helper::string_number_into")]
  pub gacha_id: u32,
  #[serde(with = "serde_helper::string_number_into")]
  pub gacha_type: u32,
  #[serde(
    with = "serde_helper::string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub count: Option<u32>,
  #[serde(with = "gacha_time_format")]
  pub time: PrimitiveDateTime,
  pub name: Option<String>,
  pub lang: Option<String>,
  pub item_id: String,
  pub item_type: Option<String>,
  #[serde(
    with = "serde_helper::string_number_into::option",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub rank_type: Option<u32>,
}

impl Srgf {
  pub const V1_0: UigfVersion = UigfVersion::new(1, 0);
  pub const SUPPORTED_VERSIONS: [UigfVersion; 1] = [Self::V1_0];
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SrgfGachaRecordsWriter {
  pub srgf_version: UigfVersion, // SRGF version: v1.0
  pub account_locale: String,
  pub account_uid: u32,
  #[serde(with = "rfc3339")]
  pub export_time: OffsetDateTime,
}

impl GachaRecordsWriter for SrgfGachaRecordsWriter {
  type Error = SrgfGachaRecordsWriteError;

  fn write(
    &self,
    _metadata: &GachaMetadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<PathBuf, Self::Error> {
    // SRGF Gacha Records only support: Honkai Star Rail
    const BUSINESS: Business = Business::HonkaiStarRail;

    let Self {
      srgf_version,
      account_locale,
      account_uid,
      export_time,
    } = self;

    let server_region = ServerRegion::from_uid(BUSINESS, *account_uid)
      .ok_or(SrgfGachaRecordsWriteErrorKind::InvalidUid { uid: *account_uid })?;

    let mut srgf = Srgf {
      info: SrgfInfo {
        uid: *account_uid,
        lang: account_locale.to_owned(),
        export_timestamp: Some(export_time.unix_timestamp() as _),
        export_app: Some(consts::ID.to_owned()),
        export_app_version: Some(consts::VERSION_WITH_PREFIX.to_owned()),
        srgf_version: srgf_version.to_string(),
        region_time_zone: server_region.time_zone().whole_hours(),
      },
      list: Vec::with_capacity(records.len()),
    };

    for (cursor, record) in records.into_iter().enumerate() {
      // Because the cursor of the user's record starts at 1
      let cursor = cursor + 1;

      // Avoid writing records that are not compatible with the account.
      if record.business != BUSINESS {
        return Err(SrgfGachaRecordsWriteErrorKind::IncompatibleRecordBusiness {
          business: record.business,
          id: record.id,
          name: record.name,
          cursor,
        })?;
      } else if record.uid != *account_uid {
        return Err(SrgfGachaRecordsWriteErrorKind::IncompatibleRecordOwner {
          expected: *account_uid,
          actual: record.uid,
          cursor,
        })?;
      } else if record.lang != *account_locale {
        return Err(SrgfGachaRecordsWriteErrorKind::IncompatibleRecordLocale {
          expected: account_locale.to_owned(),
          actual: record.lang,
          cursor,
        })?;
      }

      // HACK: In 'Honkai: Star Rail' business,
      //   the gacha_id value of the Record must exist.
      //   Unless the user manually modifies the database record
      if record.gacha_id.is_none() {
        panic!("Missing gacha_id in the record: {record:?}, cursor: {cursor}")
      }

      srgf.list.push(SrgfItem {
        uid: Some(record.uid),
        gacha_id: record.gacha_id.unwrap(),
        gacha_type: record.gacha_type,
        count: Some(record.count),
        // HACK: No need offset, because `region_time_zone` is already there.
        time: record.time_to_primitive(),
        name: Some(record.name),
        lang: Some(record.lang),
        item_id: record.item_id,
        item_type: Some(record.item_type),
        rank_type: Some(record.rank_type),
        id: record.id,
      })
    }

    let output = PathBuf::from(format!("{}.json", output.as_ref().display()));
    let output_file =
      File::create(&output).map_err(|cause| SrgfGachaRecordsWriteErrorKind::CreateOutput {
        path: output.clone(),
        cause,
      })?;

    serde_json::to_writer(output_file, &srgf)
      .map_err(|cause| SrgfGachaRecordsWriteErrorKind::Serialize { cause })?;

    Ok(output)
  }
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SrgfGachaRecordsReader {
  pub expected_uid: u32,
}

impl GachaRecordsReader for SrgfGachaRecordsReader {
  type Error = SrgfGachaRecordsReadError;

  fn read_from_file(
    &self,
    metadata: &GachaMetadata,
    input: impl AsRef<Path>,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    let file = File::open(&input).map_err(|cause| SrgfGachaRecordsReadErrorKind::OpenInput {
      path: input.as_ref().to_path_buf(),
      cause,
    })?;

    self.read(metadata, file)
  }

  fn read(
    &self,
    metadata: &GachaMetadata,
    input: impl Read,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    // Legacy SRGF Gacha Records only support: Honkai Star Rail
    const BUSINESS: Business = Business::HonkaiStarRail;

    let Self { expected_uid } = self;

    let srgf: Srgf = serde_json::from_reader(input)
      .map_err(|cause| SrgfGachaRecordsReadErrorKind::InvalidInput { cause })?;

    let srgf_version = UigfVersion::from_str(&srgf.info.srgf_version).map_err(|_| {
      SrgfGachaRecordsReadErrorKind::InvalidVersion {
        version: srgf.info.srgf_version,
      }
    })?;

    if !Srgf::SUPPORTED_VERSIONS.contains(&srgf_version) {
      return Err(SrgfGachaRecordsReadErrorKind::UnsupportedVersion {
        version: srgf_version,
        allowed: &Srgf::SUPPORTED_VERSIONS,
      })?;
    }

    if srgf.info.uid != *expected_uid {
      return Err(SrgfGachaRecordsReadErrorKind::InconsistentUid {
        expected: *expected_uid,
        actual: srgf.info.uid,
        cursor: 0, // When it is 0, the info data is incorrect
      })?;
    }

    let server_region = ServerRegion::from_uid(BUSINESS, *expected_uid)
      .ok_or(SrgfGachaRecordsReadErrorKind::InvalidUid { uid: *expected_uid })?;

    let server_time_zone = server_region.time_zone();
    let target_time_zone = UtcOffset::from_hms(srgf.info.region_time_zone, 0, 0).map_err(|_| {
      SrgfGachaRecordsReadErrorKind::InvalidRegionTimeZone {
        value: srgf.info.region_time_zone,
      }
    })?;

    let mut records = Vec::with_capacity(srgf.list.len());
    for (cursor, item) in srgf.list.into_iter().enumerate() {
      // Because the cursor of the user's record starts at 1
      let cursor = cursor + 1;

      if let Some(uid) = item.uid {
        if uid != *expected_uid {
          return Err(SrgfGachaRecordsReadErrorKind::InconsistentUid {
            expected: *expected_uid,
            actual: uid,
            cursor,
          })?;
        }
      }

      let locale = item.lang.unwrap_or(srgf.info.lang.clone());

      let metadata_locale = metadata.obtain(BUSINESS, &locale).ok_or_else(|| {
        SrgfGachaRecordsReadErrorKind::MissingMetadataLocale {
          locale: locale.clone(),
          cursor,
        }
      })?;

      let metadata_entry = metadata_locale
        .entry_from_id(&item.item_id)
        .ok_or_else(|| SrgfGachaRecordsReadErrorKind::MissingMetadataEntry {
          locale: locale.clone(),
          key: FIELD_ITEM_ID,
          val: item.item_id.clone(),
          cursor,
        })?;

      records.push(GachaRecord {
        business: BUSINESS,
        uid: item.uid.unwrap_or(*expected_uid),
        id: item.id,
        gacha_type: item.gacha_type,
        gacha_id: Some(item.gacha_id),
        rank_type: item.rank_type.unwrap_or(metadata_entry.rank as _),
        count: item.count.unwrap_or(1),
        lang: locale,
        time: item
          .time
          .assume_offset(target_time_zone)
          .to_offset(server_time_zone),
        name: item.name.unwrap_or(metadata_entry.name.to_owned()),
        item_type: item
          .item_type
          .unwrap_or(metadata_entry.category_name.to_owned()),
        item_id: item.item_id,
      })
    }

    Ok(records)
  }
}

// endregion

// region: zzz.rng.moe

// Gacha Records
// Support version: 1
// https://zzz.rng.moe

/*
 * Gacha type mapping between Official and zzz.rng.moe
 * Only support: Zenless Zone Zero
 *
 * Gacha Type (zzz.rng.moe) | Gacha Type (Official)
 *       1001               |       1
 *       2001               |       2
 *       3001               |       3
 *       5001               |       5
 */
static ZENLESS_RNG_MOE_GACHA_TYPE_MAPPINGS: LazyLock<HashMap<u32, u32>> =
  LazyLock::new(|| HashMap::from_iter([(1001, 1), (2001, 2), (3001, 3), (5001, 5)]));

declare_error_kinds! {
  #[derive(Debug, thiserror::Error)]
  ZenlessRngMoeGachaRecordsReadError {
    #[error("Failed to open input '{path}': {cause}")]
    OpenInput {
      path: PathBuf,
      cause: io::Error => serde_json::json!({
        "kind": cause.kind().to_string(),
        "message": cause.to_string(),
      })
    },

    #[error("Invalid json input: {cause}")]
    InvalidInput {
      cause: serde_json::Error => cause.to_string()
    },

    #[error("Unsupported backup version: {actual} (Expected: {expected})")]
    UnsupportedVersion {
      expected: u32,
      actual: u32
    },

    #[error("Unsupported backup game: {actual} (Expected: {expected})")]
    UnsupportedGame {
      expected: &'static str,
      actual: String
    },

    #[error("Backup profile id {id} does not exist")]
    ProfileNotExist {
      id: u32
    },

    #[error("Inconsistent uid: {actual} (Expected: {expected})")]
    InconsistentUid {
      expected: u32,
      actual: u32
    },

    #[error("Invalid business uid: {uid}")]
    InvalidUid {
      uid: u32
    },

    #[error("Missing metadata locale: {locale}")]
    MissingMetadataLocale {
      locale: String
    },

    #[error("Failed to mapping zzz.rng.moe gacha type: {value}, cursor: {cursor}")]
    FailedMappingGachaType {
      value: u32,
      cursor: usize
    },

    #[error("Missing metadata entry: {key}: {val}, locale: {locale}, gacha type: {gacha_type}, cursor: {cursor}")]
    MissingMetadataEntry {
      locale: String,
      gacha_type: u32,
      rng_moe_gacha_type: u32,
      key: &'static str,
      val: String,
      cursor: usize
    },

    #[error("Invalid item timestamp: {value}, gacha type: {gacha_type}, cursor: {cursor}")]
    InvalidTimestamp {
      gacha_type: u32,
      rng_moe_gacha_type: u32,
      value: u64,
      cursor: usize
    },
  }
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZenlessRngMoeBackup {
  pub version: u32, // 1
  pub game: String, // "zzz"
  pub data: ZenlessRngMoeBackupData,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZenlessRngMoeBackupData {
  // pub action_idx: u64,
  // pub profile_idx: u32,
  pub profiles: HashMap<u32, ZenlessRngMoeBackupDataProfile>,
  // pub cur_profile_id: u32,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZenlessRngMoeBackupDataProfile {
  pub name: String,
  pub id: u32,
  pub bind_uid: Option<u32>,
  pub stores: ZenlessRngMoeBackupDataProfileStores,
  // pub version: u32,
}

#[derive(Clone, Debug, Deserialize)]
pub struct ZenlessRngMoeBackupDataProfileStores {
  #[serde(rename = "0")]
  pub n0: ZenlessRngMoeBackupDataProfileStoreN0,
  // pub n1: ZenlessRngMoeBackupDataProfileStoreN1,
  // pub n2: ZenlessRngMoeBackupDataProfileStoreN2,
  // pub n3: ZenlessRngMoeBackupDataProfileStoreN3,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZenlessRngMoeBackupDataProfileStoreN0 {
  // pub identify_hash: String,
  // pub gacha_banners: ..,
  // pub gacha_types: ..,
  pub items: HashMap<u32, Vec<ZenlessRngMoeBackupDataProfileStoreN0Item>>,
  // pub last_manual_import_uid: u32,
  // pub share: ..,
  // pub item_append: ..,
  // pub flags: ..,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZenlessRngMoeBackupDataProfileStoreN0Item {
  pub uid: String,    // => record.id
  pub id: u32,        // => record.item_id
  pub timestamp: u64, // milliseconds / 1000 => record.time
  pub rarity: u32,    // => record.rank_type
  // pub gacha: u32,   // ↑ gacha_banners
  pub gacha_type: u32, // => MAPPING => record.gacha_type
                       // pub pity: u32,
                       // pub manual: bool,
                       // pub no: u32,
                       // pub result: u32,
}

// #[derive(Clone, Debug, Deserialize)]
// #[serde(rename_all = "camelCase")]
// pub struct ZenlessRngMoeBackupDataProfileStoreN1 {
//   pub item_list: Vec<..>,
// }

// #[derive(Clone, Debug, Deserialize)]
// #[serde(rename_all = "camelCase")]
// pub struct ZenlessRngMoeBackupDataProfileStoreN2 {
//   pub version: u32,
//   pub enabled: HashMap<u32, bool>,
//   pub arcade_enabled: ..,
//   pub po_enabled: ..,
// }

// #[derive(Clone, Debug, Deserialize)]
// #[serde(rename_all = "camelCase")]
// pub struct ZenlessRngMoeBackupDataProfileStoreN3 {
//   pub version: u32,
//   pub settings: ..,
// }

// TODO: I will not consider Writer for now,
//   because it has no data standard and cannot determine the meaning of some fields.
//   Unless we use A data to merge only the records of the items field.
// pub struct ZenlessRngMoeGachaRecordsWriter {}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ZenlessRngMoeGachaRecordsReader {
  pub expected_profile_id: u32,
  pub expected_locale: String,
  pub expected_uid: u32,
}

impl ZenlessRngMoeGachaRecordsReader {
  pub fn parse_backup(
    input: impl Read,
  ) -> Result<ZenlessRngMoeBackup, ZenlessRngMoeGachaRecordsReadError> {
    let backup: ZenlessRngMoeBackup = serde_json::from_reader(input)
      .map_err(|cause| ZenlessRngMoeGachaRecordsReadErrorKind::InvalidInput { cause })?;

    const EXPECTED_VERSION: u32 = 1;
    const EXPECTED_GAME: &str = "zzz";

    if backup.version != EXPECTED_VERSION {
      return Err(ZenlessRngMoeGachaRecordsReadErrorKind::UnsupportedVersion {
        expected: EXPECTED_VERSION,
        actual: backup.version,
      })?;
    }

    if backup.game.as_str() != EXPECTED_GAME {
      return Err(ZenlessRngMoeGachaRecordsReadErrorKind::UnsupportedGame {
        expected: EXPECTED_GAME,
        actual: backup.game,
      })?;
    }

    Ok(backup)
  }
}

impl GachaRecordsReader for ZenlessRngMoeGachaRecordsReader {
  type Error = ZenlessRngMoeGachaRecordsReadError;

  fn read_from_file(
    &self,
    metadata: &GachaMetadata,
    input: impl AsRef<Path>,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    let file =
      File::open(&input).map_err(|cause| ZenlessRngMoeGachaRecordsReadErrorKind::OpenInput {
        path: input.as_ref().to_path_buf(),
        cause,
      })?;

    self.read(metadata, file)
  }

  fn read(
    &self,
    metadata: &GachaMetadata,
    input: impl Read,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    // zzz.rng.moe Gacha Records only support: Zenless Zone Zero
    const BUSINESS: Business = Business::ZenlessZoneZero;

    let Self {
      expected_profile_id,
      expected_locale,
      expected_uid,
    } = self;

    let mut backup = Self::parse_backup(input)?;

    let Some(profile) = backup.data.profiles.remove(expected_profile_id) else {
      return Err(ZenlessRngMoeGachaRecordsReadErrorKind::ProfileNotExist {
        id: *expected_profile_id,
      })?;
    };

    // drop other useless data
    drop(backup);

    if let Some(uid) = profile.bind_uid {
      if uid != *expected_uid {
        return Err(ZenlessRngMoeGachaRecordsReadErrorKind::InconsistentUid {
          expected: *expected_uid,
          actual: uid,
        })?;
      }
    }

    let server_region = ServerRegion::from_uid(BUSINESS, *expected_uid)
      .ok_or(ZenlessRngMoeGachaRecordsReadErrorKind::InvalidUid { uid: *expected_uid })?;

    let metadata_locale = metadata.obtain(BUSINESS, expected_locale).ok_or(
      ZenlessRngMoeGachaRecordsReadErrorKind::MissingMetadataLocale {
        locale: expected_locale.to_owned(),
      },
    )?;

    let sum = profile.stores.n0.items.values().map(|e| e.len()).sum();
    let mut records = Vec::with_capacity(sum);

    for (rng_moe_gacha_type, items) in profile.stores.n0.items {
      let gacha_type = *ZENLESS_RNG_MOE_GACHA_TYPE_MAPPINGS
        .get(&rng_moe_gacha_type)
        .ok_or(
          ZenlessRngMoeGachaRecordsReadErrorKind::FailedMappingGachaType {
            value: rng_moe_gacha_type,
            cursor: 0,
          },
        )?;

      for (cursor, item) in items.into_iter().enumerate() {
        // Because the cursor of the user's record starts at 1
        let cursor = cursor + 1;

        // Ensure consistency and avoid errors
        if item.gacha_type != rng_moe_gacha_type {
          return Err(
            ZenlessRngMoeGachaRecordsReadErrorKind::FailedMappingGachaType {
              value: item.gacha_type,
              cursor,
            },
          )?;
        }

        let item_id = item.id.to_string();
        let entry = metadata_locale.entry_from_id(&item_id).ok_or({
          ZenlessRngMoeGachaRecordsReadErrorKind::MissingMetadataEntry {
            locale: expected_locale.to_owned(),
            gacha_type,
            rng_moe_gacha_type,
            key: FIELD_ITEM_ID,
            val: item_id.clone(),
            cursor,
          }
        })?;

        let time =
          OffsetDateTime::from_unix_timestamp(item.timestamp as i64 / 1000).map_err(|_| {
            ZenlessRngMoeGachaRecordsReadErrorKind::InvalidTimestamp {
              gacha_type,
              rng_moe_gacha_type,
              value: item.timestamp,
              cursor,
            }
          })?;

        records.push(GachaRecord {
          business: BUSINESS,
          uid: *expected_uid,
          id: item.uid,
          gacha_type,
          gacha_id: Some(0), // FIXME: Currently, it is always 0 ?
          rank_type: item.rarity,
          count: 1, // FIXME: item.no ?
          lang: expected_locale.to_owned(),
          // Convert to server time zone
          time: time.to_offset(server_region.time_zone()),
          name: entry.name.to_owned(),
          item_type: entry.category_name.to_owned(),
          item_id,
        });
      }
    }

    Ok(records)
  }
}

#[derive(Clone, Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ZenlessRngMoeBackupTouchProfile {
  pub name: String,
  pub id: u32,
  pub bind_uid: Option<u32>,
}

impl ZenlessRngMoeBackupTouchProfile {
  pub fn touch_profiles(
    input: impl Read,
  ) -> Result<HashMap<u32, Self>, ZenlessRngMoeGachaRecordsReadError> {
    let backup = ZenlessRngMoeGachaRecordsReader::parse_backup(input)?;

    let profiles = backup
      .data
      .profiles
      .into_iter()
      .map(|(id, profile)| {
        (
          id,
          Self {
            name: profile.name,
            id: profile.id,
            bind_uid: profile.bind_uid,
          },
        )
      })
      .collect();

    Ok(profiles)
  }
}

// endregion

// region: Excel Writer

// declare_error_kinds! {
//   ExcelGachaRecordsWriteError,
//   kinds {
//     #[error("Todo")]
//     Todo,
//   }
// }

// pub struct ExcelGachaRecordsWriter {}

// impl GachaRecordsWriter for ExcelGachaRecordsWriter {
//   type Error = ExcelGachaRecordsWriteErrorKind;

//   fn write(
//     &self,
//     metadata: &GachaMetadata,
//     records: Vec<GachaRecord>,
//     output: impl AsRef<Path>,
//   ) -> Result<(), Self::Error> {
//     todo!("Implement Excel Gacha Records Writer");
//   }
// }

// endregion

// region: Gacha Records Import and Export

#[derive(Clone, Debug, Deserialize)]
pub enum GachaRecordsImporter {
  LegacyUigf(LegacyUigfGachaRecordsReader),
  Uigf(UigfGachaRecordsReader),
  Srgf(SrgfGachaRecordsReader),
  RngMoe(ZenlessRngMoeGachaRecordsReader),
}

impl GachaRecordsImporter {
  pub fn import(
    self,
    metadata: &GachaMetadata,
    input: impl AsRef<Path>,
  ) -> Result<Vec<GachaRecord>, Box<dyn ErrorDetails + Send + 'static>> {
    match self {
      Self::LegacyUigf(r) => r.read_from_file(metadata, input).map_err(Error::boxed),
      Self::Uigf(r) => r.read_from_file(metadata, input).map_err(Error::boxed),
      Self::Srgf(r) => r.read_from_file(metadata, input).map_err(Error::boxed),
      Self::RngMoe(r) => r.read_from_file(metadata, input).map_err(Error::boxed),
    }
  }
}

#[derive(Clone, Debug, Deserialize)]
pub enum GachaRecordsExporter {
  LegacyUigf(LegacyUigfGachaRecordsWriter),
  Uigf(UigfGachaRecordsWriter),
  Srgf(SrgfGachaRecordsWriter),
}

impl GachaRecordsExporter {
  pub fn export(
    self,
    metadata: &GachaMetadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<PathBuf, Box<dyn ErrorDetails + Send + 'static>> {
    match self {
      Self::LegacyUigf(w) => w.write(metadata, records, output).map_err(Error::boxed),
      Self::Uigf(w) => w.write(metadata, records, output).map_err(Error::boxed),
      Self::Srgf(w) => w.write(metadata, records, output).map_err(Error::boxed),
    }
  }
}

// endregion

// region: Tests

#[cfg(test)]
mod tests {
  use io::Cursor;
  use time::macros::datetime;

  use super::*;

  #[test]
  fn test_parse_uigf_version() {
    assert_eq!("v2.2".parse(), Ok(UigfVersion::V2_2));
    assert_eq!("v2.3".parse(), Ok(UigfVersion::V2_3));
    assert_eq!("v2.4".parse(), Ok(UigfVersion::V2_4));
    assert_eq!("v4.0".parse(), Ok(UigfVersion::V4_0));

    assert_eq!("v2.2.1".parse::<UigfVersion>(), Err(()));
    assert_eq!("v2".parse::<UigfVersion>(), Err(()));
    assert_eq!("2.2".parse::<UigfVersion>(), Err(()));
    assert_eq!("2".parse::<UigfVersion>(), Err(()));
  }

  #[test]
  fn test_uigf_v2_2_reader() {
    // v2.2: The name and item_type fields must be provided.
    let input = br#"{
      "info": {
        "uid": "100000000",
        "uigf_version": "v2.2"
      },
      "list": [
        {
          "id": "1000000000000000000",
          "gacha_type": "301",
          "time": "2023-01-01 00:00:00",
          "name": "Kamisato Ayaka",
          "item_type": "Character",
          "uigf_gacha_type": "301"
        }
      ]
    }"#;

    let records = LegacyUigfGachaRecordsReader {
      expected_locale: "en-us".to_owned(),
      expected_uid: 100_000_000,
    }
    .read(GachaMetadata::current(), Cursor::new(input))
    .unwrap();

    assert_eq!(records.len(), 1);
    assert_eq!(
      records[0],
      GachaRecord {
        business: Business::GenshinImpact,
        uid: 100_000_000,
        id: "1000000000000000000".to_owned(),
        gacha_type: 301,
        gacha_id: None,
        rank_type: 5,
        count: 1,
        lang: "en-us".to_owned(),
        time: datetime!(2023-01-01 00:00:00 +8),
        name: "Kamisato Ayaka".to_owned(),
        item_type: "Character".to_owned(),
        item_id: "10000002".to_owned(),
      }
    );
  }

  #[test]
  fn test_uigf_v2_2_reader_error_record_cursor() {
    let input = br#"{
      "info": {
        "uid": "100000000",
        "uigf_version": "v2.2"
      },
      "list": [
        {
          "uid": "100000001",
          "id": "1000000000000000000",
          "gacha_type": "301",
          "time": "2023-01-01 00:00:00",
          "name": "Kamisato Ayaka",
          "item_type": "Character",
          "uigf_gacha_type": "301"
        }
      ]
    }"#;

    // The info uid is 100_000_000
    // but the uid in the list entry is different

    let err = LegacyUigfGachaRecordsReader {
      expected_locale: "en-us".to_owned(),
      expected_uid: 100_000_000,
    }
    .read(GachaMetadata::current(), Cursor::new(input))
    .unwrap_err();

    assert!(matches!(
      err.into_inner(),
      LegacyUigfGachaRecordsReadErrorKind::InconsistentUid { expected, actual, cursor }
        if expected == 100_000_000 && actual == 100_000_001 && cursor == 1
        // Because the cursor is the user's record, starts from 1
    ));
  }

  #[test]
  fn test_uigf_v2_3_reader() {
    // v2.3: The item_id field must be provided.
    let input = br#"{
      "info": {
        "uid": "100000000",
        "uigf_version": "v2.3"
      },
      "list": [
        {
          "id": "1000000000000000000",
          "gacha_type": "301",
          "time": "2023-01-01 00:00:00",
          "item_id": "10000002",
          "uigf_gacha_type": "301"
        }
      ]
    }"#;

    let records = LegacyUigfGachaRecordsReader {
      expected_locale: "en-us".to_owned(),
      expected_uid: 100_000_000,
    }
    .read(GachaMetadata::current(), Cursor::new(input))
    .unwrap();

    assert_eq!(records.len(), 1);
    assert_eq!(
      records[0],
      GachaRecord {
        business: Business::GenshinImpact,
        uid: 100_000_000,
        id: "1000000000000000000".to_owned(),
        gacha_type: 301,
        gacha_id: None,
        rank_type: 5,
        count: 1,
        lang: "en-us".to_owned(),
        time: datetime!(2023-01-01 00:00:00 +8), // Because the server time zone of this uid is +8
        name: "Kamisato Ayaka".to_owned(),
        item_type: "Character".to_owned(),
        item_id: "10000002".to_owned(),
      }
    );
  }

  #[test]
  fn test_uigf_v2_4_reader_null_region_time_zone() {
    // v2.4: The region_time_zone field must be provided.
    let input = br#"{
      "info": {
        "uid": "100000000",
        "uigf_version": "v2.4",
        "region_time_zone": null
      },
      "list": [
        {
          "id": "1000000000000000000",
          "gacha_type": "301",
          "time": "2023-01-01 00:00:00",
          "item_id": "10000002",
          "uigf_gacha_type": "301"
        }
      ]
    }"#;

    let err = LegacyUigfGachaRecordsReader {
      expected_locale: "en-us".to_owned(),
      expected_uid: 100_000_000,
    }
    .read(GachaMetadata::current(), Cursor::new(input))
    .unwrap_err();

    assert!(matches!(
      err.into_inner(),
      LegacyUigfGachaRecordsReadErrorKind::RequiredField { field, .. }
        if field == "region_time_zone"
    ));
  }

  #[test]
  fn test_uigf_v2_2_writer_and_reader() {
    let records = vec![GachaRecord {
      business: Business::GenshinImpact,
      uid: 100_000_000,
      id: "1000000000000000000".to_owned(),
      gacha_type: 301,
      gacha_id: None,
      rank_type: 5,
      count: 1,
      lang: "en-us".to_owned(),
      time: datetime!(2023-01-01 00:00:00 +8), // Because the server time zone of this uid is +8
      name: "Kamisato Ayaka".to_owned(),
      item_type: "Character".to_owned(),
      item_id: "10000002".to_owned(),
    }];

    let temp_dir = tempfile::tempdir().unwrap();
    let output = temp_dir.path().join("test_legacy_uigf_write_and_read");

    LegacyUigfGachaRecordsWriter {
      uigf_version: UigfVersion::V2_2,
      account_locale: "en-us".to_owned(),
      account_uid: 100_000_000,
      export_time: OffsetDateTime::now_utc().to_offset(*consts::LOCAL_OFFSET),
    }
    .write(GachaMetadata::current(), records.clone(), &output)
    .unwrap();

    let input = File::open(output.with_extension("json")).unwrap();
    let read_records = LegacyUigfGachaRecordsReader {
      expected_locale: "en-us".to_owned(),
      expected_uid: 100_000_000,
    }
    .read(GachaMetadata::current(), input)
    .unwrap();

    assert_eq!(records, read_records);

    temp_dir.close().unwrap();
  }

  #[test]
  fn test_uigf_v2_2_write_error_record_cursor() {
    let correct_uid = 100_000_000;
    let incorrect_uid = correct_uid + 0xE; // different uid

    let correct = GachaRecord {
      business: Business::GenshinImpact,
      uid: correct_uid,
      id: "1000000000000000000".to_owned(),
      gacha_type: 301,
      gacha_id: None,
      rank_type: 5,
      count: 1,
      lang: "en-us".to_owned(),
      time: datetime!(2023-01-01 00:00:00 +8), // Because the server time zone of this uid is +8
      name: "Kamisato Ayaka".to_owned(),
      item_type: "Character".to_owned(),
      item_id: "10000002".to_owned(),
    };

    let mut incorrect = correct.clone();
    incorrect.uid = incorrect_uid;

    let err = LegacyUigfGachaRecordsWriter {
      uigf_version: UigfVersion::V2_2,
      account_locale: "en-us".to_owned(),
      account_uid: correct_uid,
      export_time: OffsetDateTime::now_utc().to_offset(*consts::LOCAL_OFFSET),
    }
    .write(
      GachaMetadata::current(),
      vec![correct, incorrect],
      "It will not be written",
    )
    .unwrap_err();

    assert!(matches!(
      err.into_inner(),
      LegacyUigfGachaRecordsWriteErrorKind::IncompatibleRecordOwner { expected, actual, cursor }
        if expected == correct_uid && actual == incorrect_uid && cursor == 2
        // The second record, because the cursor is the user's record, starts from 1
    ));
  }

  #[test]
  fn test_uigf_v4_0_reader() {
    let input = br#"{
      "info": {
        "export_timestamp": "1672531200",
        "export_app": "foobar",
        "export_app_version": "1.0.0",
        "version": "v4.0"
      },
      "hk4e": [
        {
          "uid": "100000000",
          "timezone": 0,
          "list": [
            {
              "uigf_gacha_type": "301",
              "gacha_type": "301",
              "item_id": "10000002",
              "time": "2023-01-01 00:00:00",
              "id": "1000000000000000000"
            }
          ]
        }
      ],
      "hkrpg": [
        {
          "uid": "100000001",
          "timezone": 0,
          "list": [
            {
              "gacha_id": "1",
              "gacha_type": "11",
              "item_id": "1001",
              "time": "2023-01-01 00:00:00",
              "id": "1000000000000000001"
            }
          ]
        }
      ],
      "nap": [
        {
          "uid": "10000002",
          "timezone": 0,
          "list": [
            {
              "gacha_type": "1",
              "item_id": "1011",
              "time": "2023-01-01 00:00:00",
              "id": "1000000000000000002"
            }
          ]
        }
      ]
    }"#;

    let records = UigfGachaRecordsReader {
      businesses: None,
      accounts: HashMap::from_iter([
        (100_000_000, "en-us".to_owned()),
        (100_000_001, "en-us".to_owned()),
        (10_000_002, "en-us".to_owned()),
      ]),
    }
    .read(GachaMetadata::current(), Cursor::new(input))
    .unwrap();

    assert_eq!(records.len(), 3);

    assert_eq!(
      records[0],
      GachaRecord {
        business: Business::GenshinImpact,
        uid: 100_000_000,
        id: "1000000000000000000".to_owned(),
        gacha_type: 301,
        gacha_id: None,
        rank_type: 5,
        count: 1,
        lang: "en-us".to_owned(),
        time: datetime!(2023-01-01 00:00:00 +0),
        name: "Kamisato Ayaka".to_owned(),
        item_type: "Character".to_owned(),
        item_id: "10000002".to_owned(),
      }
    );

    assert_eq!(
      records[1],
      GachaRecord {
        business: Business::HonkaiStarRail,
        uid: 100_000_001,
        id: "1000000000000000001".to_owned(),
        gacha_type: 11,
        gacha_id: Some(1),
        rank_type: 4,
        count: 1,
        lang: "en-us".to_owned(),
        time: datetime!(2023-01-01 00:00:00 +0),
        name: "March 7th".to_owned(),
        item_type: "Character".to_owned(),
        item_id: "1001".to_owned(),
      }
    );

    assert_eq!(
      records[2],
      GachaRecord {
        business: Business::ZenlessZoneZero,
        uid: 10_000_002,
        id: "1000000000000000002".to_owned(),
        gacha_type: 1,
        gacha_id: None,
        rank_type: 3,
        count: 1,
        lang: "en-us".to_owned(),
        time: datetime!(2023-01-01 00:00:00 +0),
        name: "Anby".to_owned(),
        item_type: "Agents".to_owned(),
        item_id: "1011".to_owned(),
      }
    );
  }

  #[test]
  fn test_uigf_v4_0_writer_and_reader() {
    let records = vec![
      GachaRecord {
        business: Business::GenshinImpact,
        uid: 100_000_000,
        id: "1000000000000000000".to_owned(),
        gacha_type: 301,
        gacha_id: None,
        rank_type: 5,
        count: 1,
        lang: "en-us".to_owned(),
        time: datetime!(2023-01-01 00:00:00 +8), // Because the server time zone of this uid is +8
        name: "Kamisato Ayaka".to_owned(),
        item_type: "Character".to_owned(),
        item_id: "10000002".to_owned(),
      },
      GachaRecord {
        business: Business::HonkaiStarRail,
        uid: 100_000_001,
        id: "1000000000000000001".to_owned(),
        gacha_type: 11,
        gacha_id: Some(1),
        rank_type: 4,
        count: 1,
        lang: "en-us".to_owned(),
        time: datetime!(2023-01-01 00:00:00 +8), // Because the server time zone of this uid is +8
        name: "March 7th".to_owned(),
        item_type: "Character".to_owned(),
        item_id: "1001".to_owned(),
      },
      GachaRecord {
        business: Business::ZenlessZoneZero,
        uid: 10_000_002,
        id: "1000000000000000002".to_owned(),
        gacha_type: 1,
        gacha_id: None,
        rank_type: 3,
        count: 1,
        lang: "en-us".to_owned(),
        time: datetime!(2023-01-01 00:00:00 +8), // Because the server time zone of this uid is +8
        name: "Anby".to_owned(),
        item_type: "Agents".to_owned(),
        item_id: "1011".to_owned(),
      },
    ];

    let temp_dir = tempfile::tempdir().unwrap();
    let output = temp_dir.path().join("test_uigf_v4_0_gacha_records_writer");

    UigfGachaRecordsWriter {
      businesses: None,
      accounts: HashMap::from_iter([
        (100_000_000, "en-us".to_owned()),
        (100_000_001, "en-us".to_owned()),
        (10_000_002, "en-us".to_owned()),
      ]),
      export_time: OffsetDateTime::now_utc().to_offset(*consts::LOCAL_OFFSET),
      minimized: None,
    }
    .write(GachaMetadata::current(), records.clone(), &output)
    .unwrap();

    let input = File::open(output.with_extension("json")).unwrap();
    let read_records = UigfGachaRecordsReader {
      businesses: None,
      accounts: HashMap::from_iter([
        (100_000_000, "en-us".to_owned()),
        (100_000_001, "en-us".to_owned()),
        (10_000_002, "en-us".to_owned()),
      ]),
    }
    .read(GachaMetadata::current(), input)
    .unwrap();

    assert_eq!(records, read_records);

    temp_dir.close().unwrap();
  }

  #[test]
  fn test_srgf_v1_0_reader() {
    let input = br#"{
      "info": {
        "uid": "100000000",
        "lang": "en-us",
        "srgf_version": "v1.0",
        "region_time_zone": 8
      },
      "list": [
        {
          "id": "1000000000000000000",
          "gacha_id": "1",
          "gacha_type": "301",
          "time": "2023-01-01 00:00:00",
          "item_id": "1001"
        }
      ]
    }"#;

    let records = SrgfGachaRecordsReader {
      expected_uid: 100_000_000,
    }
    .read(GachaMetadata::current(), Cursor::new(input))
    .unwrap();

    assert_eq!(records.len(), 1);
    assert_eq!(
      records[0],
      GachaRecord {
        business: Business::HonkaiStarRail,
        uid: 100_000_000,
        id: "1000000000000000000".to_owned(),
        gacha_type: 301,
        gacha_id: Some(1),
        rank_type: 4,
        count: 1,
        lang: "en-us".to_owned(),
        time: datetime!(2023-01-01 00:00:00 +8),
        name: "March 7th".to_owned(),
        item_type: "Character".to_owned(),
        item_id: "1001".to_owned(),
      }
    );
  }

  #[test]
  fn test_srgf_v1_0_writer_and_reader() {
    let records = vec![GachaRecord {
      business: Business::HonkaiStarRail,
      uid: 100_000_000,
      id: "1000000000000000000".to_owned(),
      gacha_type: 301,
      gacha_id: Some(1),
      rank_type: 4,
      count: 1,
      lang: "en-us".to_owned(),
      time: datetime!(2023-01-01 00:00:00 +8), // Because the server time zone of this uid is +8
      name: "March 7th".to_owned(),
      item_type: "Character".to_owned(),
      item_id: "1001".to_owned(),
    }];

    let temp_dir = tempfile::tempdir().unwrap();
    let output = temp_dir.path().join("test_srgf_v1_0_gacha_records_write");

    SrgfGachaRecordsWriter {
      srgf_version: Srgf::V1_0,
      account_locale: "en-us".to_owned(),
      account_uid: 100_000_000,
      export_time: OffsetDateTime::now_utc().to_offset(*consts::LOCAL_OFFSET),
    }
    .write(GachaMetadata::current(), records.clone(), &output)
    .unwrap();

    let input = File::open(output.with_extension("json")).unwrap();
    let read_records = SrgfGachaRecordsReader {
      expected_uid: 100_000_000,
    }
    .read(GachaMetadata::current(), input)
    .unwrap();

    assert_eq!(records, read_records);

    temp_dir.close().unwrap();
  }

  // HACK: This is a backup of the zzz.rng.moe v1 Gacha Records
  const ZZZ_RNG_MOE_V1_BACKUP: &[u8] = br#"{
      "version": 1,
      "game": "zzz",
      "data": {
        "actionIdx": 1747379012555,
        "profileIdx": 3,
        "profiles": {
          "1": {
            "name": "Default",
            "id": 1,
            "bindUid": null,
            "stores": {
              "0": {
                "identityHash": "3205ec98",
                "gachaBanners": {
                  "1001001": {
                    "id": 1001001,
                    "gachaType": 1001,
                    "count2": 1,
                    "count3": 0,
                    "count4": 0,
                    "avgPityS": 0,
                    "avgPityA": 0,
                    "sWinCount": 0,
                    "sChallengeCount": 0,
                    "winRate": 0
                  }
                },
                "gachaTypes": {
                  "1001": {
                    "id": 1001,
                    "lastItemId": "1000000000000000002",
                    "count2": 1,
                    "count3": 0,
                    "count4": 0,
                    "avgPityS": 0,
                    "avgPityA": 0,
                    "winRate": 0,
                    "sWinCount": 0,
                    "sChallengeCount": 0,
                    "pity": {
                      "pityS": 1,
                      "pityA": 1
                    }
                  },
                  "2001": {
                    "id": 2001,
                    "lastItemId": "0",
                    "count2": 0,
                    "count3": 0,
                    "count4": 0,
                    "avgPityS": 0,
                    "avgPityA": 0,
                    "winRate": 0,
                    "sWinCount": 0,
                    "sChallengeCount": 0,
                    "pity": {
                      "pityS": 0,
                      "pityA": 0
                    }
                  },
                  "3001": {
                    "id": 3001,
                    "lastItemId": "0",
                    "count2": 0,
                    "count3": 0,
                    "count4": 0,
                    "avgPityS": 0,
                    "avgPityA": 0,
                    "winRate": 0,
                    "sWinCount": 0,
                    "sChallengeCount": 0,
                    "pity": {
                      "pityS": 0,
                      "pityA": 0
                    }
                  },
                  "5001": {
                    "id": 5001,
                    "lastItemId": "0",
                    "count2": 0,
                    "count3": 0,
                    "count4": 0,
                    "avgPityS": 0,
                    "avgPityA": 0,
                    "winRate": 0,
                    "sWinCount": 0,
                    "sChallengeCount": 0,
                    "pity": {
                      "pityS": 0,
                      "pityA": 0
                    }
                  }
                },
                "items": {
                  "1001": [
                    {
                      "uid": "1000000000000000002",
                      "id": 1011,
                      "timestamp": 1672502400000,
                      "rarity": 3,
                      "gacha": 1001001,
                      "gachaType": 1001,
                      "pity": 0,
                      "manual": false,
                      "no": 1,
                      "result": 0
                    }
                  ]
                },
                "lastManualImportUid": 0,
                "share": {
                  "name": "Proxy",
                  "profile": 3200000
                },
                "itemAppend": {
                  "1011": 1,
                  "1031": 1,
                  "1081": 1
                },
                "flags": {}
              },
              "1": {
                "itemList": []
              },
              "2": {
                "version": 2,
                "enabled": {
                  "1001001": true
                },
                "arcadeEnabled": {},
                "poEnabled": {}
              },
              "3": {
                "version": 1,
                "settings": {}
              }
            },
            "version": 6
          }
        },
        "curProfileId": 1
      }
    }"#;

  #[test]
  fn test_zzz_rng_moe_v1_reader() {
    let input = ZZZ_RNG_MOE_V1_BACKUP;
    let records = ZenlessRngMoeGachaRecordsReader {
      expected_profile_id: 1,
      expected_locale: "en-us".to_owned(),
      expected_uid: 10_000_002,
    }
    .read(GachaMetadata::current(), Cursor::new(input))
    .unwrap();

    assert_eq!(records.len(), 1);
    assert_eq!(
      records[0],
      GachaRecord {
        business: Business::ZenlessZoneZero,
        uid: 10_000_002,
        id: "1000000000000000002".to_owned(),
        gacha_type: 1,
        gacha_id: Some(0),
        rank_type: 3,
        count: 1,
        lang: "en-us".to_owned(),
        time: datetime!(2023-01-01 00:00:00 +8),
        name: "Anby".to_owned(),
        item_type: "Agents".to_owned(),
        item_id: "1011".to_owned(),
      }
    );
  }

  #[test]
  fn test_zzz_rng_moe_v1_touch_profiles() {
    let input = ZZZ_RNG_MOE_V1_BACKUP;
    let profiles = ZenlessRngMoeBackupTouchProfile::touch_profiles(Cursor::new(input)).unwrap();

    assert_eq!(profiles.len(), 1);
    assert_eq!(
      profiles[&1],
      ZenlessRngMoeBackupTouchProfile {
        name: "Default".to_owned(),
        id: 1,
        bind_uid: None,
      }
    );
  }
}

// endregion
