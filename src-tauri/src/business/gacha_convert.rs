use std::collections::{HashMap, HashSet};
use std::fmt::{self, Display};
use std::fs::File;
use std::io::{self, BufWriter, Cursor, Read};
use std::path::{Path, PathBuf};
use std::str::FromStr;

use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use time::format_description::FormatItem;
use time::macros::format_description;
use time::serde::rfc3339;
use time::OffsetDateTime;

use crate::consts;
use crate::error::declare_error_kinds;
use crate::models::{Business, GachaMetadata, GachaRecord, MetadataStructEntryRef};
use crate::utilities::serde_helper;

// region: Declares

pub trait GachaRecordsWriter {
  type Error;

  fn write(
    &self,
    metadata: &GachaMetadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>, // Output file path without extension.
  ) -> Result<(), Self::Error>;
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

  fn read_from_slice(
    &self,
    metadata: &GachaMetadata,
    input: impl AsRef<[u8]>,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    self.read(metadata, Cursor::new(input.as_ref()))
  }
}

// endregion

// region: Version number

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct UigfVersion {
  pub major: u8,
  pub minor: u8,
}

static VERSION_NUMBER_REGEX: Lazy<Regex> =
  Lazy::new(|| Regex::new(r"^v(?P<major>\d+)\.(?P<minor>\d+)$").unwrap());

impl UigfVersion {
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
static UIGF_GACHA_TYPE_MAPPINGS: Lazy<HashMap<u32, u32>> = Lazy::new(|| {
  let mut m = HashMap::with_capacity(6);
  m.insert(100, 100);
  m.insert(200, 200);
  m.insert(301, 301);
  m.insert(400, 301); // 400 -> 301
  m.insert(302, 302);
  m.insert(500, 500);
  m
});

const FIELD_NAME: &str = "name";
const FIELD_ITEM_ID: &str = "item_id";
const FIELD_ITEM_TYPE: &str = "item_type";
const FIELD_REGION_TIME_ZONE: &str = "region_time_zone";

// Legacy UIGF Gacha Records
// Only business: Genshin Impact
// Only support: v2.2, v2.3, v2.4, v3.0
// https://uigf.org/zh/standards/uigf-legacy-v3.0.html

declare_error_kinds!(
  LegacyUigfGachaRecordsWriteError,
  kinds {
    #[error("Incompatible record business: {business}, id: {id}, name: {name}")]
    IncompatibleRecordBusiness {
      business: Business,
      id: String,
      name: String
    },

    #[error("Incompatible record owner uid: expected: {expected}, actual: {actual}")]
    IncompatibleRecordOwner { expected: u32, actual: u32 },

    #[error("Incompatible record locale: expected: {expected}, actual: {actual}")]
    IncompatibleRecordLocale {
      expected: String,
      actual: String
    },

    #[error("Failed to mapping uigf gacha type: {value}")]
    FailedMappingGachaType { value: u32 },

    #[error("Failed to create output '{path}': {cause}")]
    CreateOutput {
      path: PathBuf,
      cause: io::Error => serde_json::json!({
        "kind": format_args!("{}", cause.kind()),
        "message": format_args!("{cause}"),
      })
    },

    #[error("Serialization json error: {cause}")]
    Serialize {
      cause: serde_json::Error => format_args!("{}", cause)
    },
  }
);

declare_error_kinds!(
  LegacyUigfGachaRecordsReadError,
  kinds {
    #[error("Failed to open input: {cause}")]
    OpenInput {
      cause: io::Error => serde_json::json!({
        "kind": format_args!("{}", cause.kind()),
        "message": format_args!("{cause}"),
      })
    },

    #[error("Invalid json input: {cause}")]
    InvalidInput {
      cause: serde_json::Error => format_args!("{}", cause)
    },

    #[error("Invalid uigf version string: {version}")]
    InvalidVersion { version: String },

    #[error("Unsupported uigf version: {version} (Allowed: {allowed})")]
    UnsupportedVersion { version: UigfVersion, allowed: String },

    #[error("Inconsistent with expected uid: expected: {expected}, actual: {actual}")]
    InconsistentUid { expected: u32, actual: u32 },

    #[error("Required field missing: {field}")]
    RequiredField { field: &'static str },

    #[error("Missing metadata entry: {business}, locale: {locale}, {key}: {val}")]
    MissingMetadataEntry {
      business: Business,
      locale: String,
      key: &'static str,
      val: String
    },
  }
);

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct LegacyUigf {
  pub info: LegacyUigfInfo,
  pub list: Vec<LegacyUigfItem>,
}

impl LegacyUigf {
  pub const SUPPORTED_VERSIONS: [UigfVersion; 4] = [
    UigfVersion::V2_2,
    UigfVersion::V2_3,
    UigfVersion::V2_4,
    UigfVersion::V3_0,
  ];
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct LegacyUigfInfo {
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number",
    serialize_with = "serde_helper::ser::number_as_string"
  )]
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
    deserialize_with = "serde_helper::de::string_as_number_option",
    serialize_with = "serde_helper::ser::option_number_as_string",
    default = "Option::default"
  )]
  pub uid: Option<u32>,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number",
    serialize_with = "serde_helper::ser::number_as_string"
  )]
  pub gacha_type: u32,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number_option",
    serialize_with = "serde_helper::ser::option_number_as_string",
    default = "Option::default"
  )]
  pub count: Option<u32>,
  pub time: String,
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
    deserialize_with = "serde_helper::de::string_as_number_option",
    serialize_with = "serde_helper::ser::option_number_as_string",
    default = "Option::default"
  )]
  pub rank_type: Option<u32>,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number",
    serialize_with = "serde_helper::ser::number_as_string"
  )]
  pub uigf_gacha_type: u32,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LegacyUigfGachaRecordsWriter {
  pub uigf_version: UigfVersion, // Legacy UIGF version: v2.2, v2.3, v2.4, v3.0
  pub account_locale: String,
  pub account_uid: u32,
  #[serde(with = "rfc3339")]
  pub export_time: OffsetDateTime,
  pub region_time_zone: i8,
}

impl GachaRecordsWriter for LegacyUigfGachaRecordsWriter {
  type Error = LegacyUigfGachaRecordsWriteError;

  fn write(
    &self,
    _metadata: &GachaMetadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<(), Self::Error> {
    // Legacy UIGF Gacha Records only support: Genshin Impact
    const BUSINESS: Business = Business::GenshinImpact;
    const TIME_FORMAT: &[FormatItem<'static>] =
      format_description!("[year]-[month]-[day] [hour]:[minute]:[second]");

    let Self {
      uigf_version,
      account_locale,
      account_uid,
      export_time,
      region_time_zone,
    } = self;

    let mut uigf = LegacyUigf {
      info: LegacyUigfInfo {
        uid: *account_uid,
        lang: Some(account_locale.to_owned()),
        export_time: Some(export_time.format(TIME_FORMAT).unwrap()),
        export_timestamp: Some(export_time.unix_timestamp() as _),
        export_app: Some(consts::ID.to_owned()),
        export_app_version: Some(consts::VERSION_WITH_PREFIX.to_owned()),
        uigf_version: uigf_version.to_string(),
        region_time_zone: Some(*region_time_zone),
      },
      list: Vec::with_capacity(records.len()),
    };

    for record in records {
      // Avoid writing records that are not compatible with the account.
      if record.business != BUSINESS {
        return Err(
          LegacyUigfGachaRecordsWriteErrorKind::IncompatibleRecordBusiness {
            business: record.business,
            id: record.id,
            name: record.name,
          },
        )?;
      } else if record.uid != *account_uid {
        return Err(
          LegacyUigfGachaRecordsWriteErrorKind::IncompatibleRecordOwner {
            expected: *account_uid,
            actual: record.uid,
          },
        )?;
      } else if record.lang != *account_locale {
        return Err(
          LegacyUigfGachaRecordsWriteErrorKind::IncompatibleRecordLocale {
            expected: account_locale.to_owned(),
            actual: record.lang,
          },
        )?;
      }

      let uigf_gacha_type = *UIGF_GACHA_TYPE_MAPPINGS
        .get(&record.gacha_type)
        .ok_or_else(
          || LegacyUigfGachaRecordsWriteErrorKind::FailedMappingGachaType {
            value: record.gacha_type,
          },
        )?;

      // Always fill in these optional fields to ensure compatibility
      uigf.list.push(LegacyUigfItem {
        id: record.id,
        uid: Some(record.uid),
        gacha_type: record.gacha_type,
        count: Some(record.count),
        time: record.time, // TODO: region_time_zone
        name: Some(record.name),
        lang: Some(record.lang),
        item_id: record.item_id,
        item_type: Some(record.item_type),
        rank_type: Some(record.rank_type),
        uigf_gacha_type,
      })
    }

    let output = output.as_ref().with_extension("json");
    let output_file = File::create(&output).map_err(|cause| {
      LegacyUigfGachaRecordsWriteErrorKind::CreateOutput {
        path: output,
        cause,
      }
    })?;

    serde_json::to_writer(output_file, &uigf)
      .map_err(|cause| LegacyUigfGachaRecordsWriteErrorKind::Serialize { cause })?;

    Ok(())
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
    let input = File::open(input)
      .map_err(|cause| LegacyUigfGachaRecordsReadErrorKind::OpenInput { cause })?;

    self.read(metadata, input)
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
        allowed: LegacyUigf::SUPPORTED_VERSIONS
          .iter()
          .map(ToString::to_string)
          .collect::<Vec<_>>()
          .join(", "),
      })?;
    }

    if uigf.info.uid != *expected_uid {
      return Err(LegacyUigfGachaRecordsReadErrorKind::InconsistentUid {
        expected: *expected_uid,
        actual: uigf.info.uid,
      })?;
    }

    let is_v2_2 = uigf_version == UigfVersion::V2_2;
    let is_v2_3 = uigf_version == UigfVersion::V2_3;
    let is_v2_4 = uigf_version == UigfVersion::V2_4;

    if is_v2_4 && uigf.info.region_time_zone.is_none() {
      return Err(LegacyUigfGachaRecordsReadErrorKind::RequiredField {
        field: FIELD_REGION_TIME_ZONE,
      })?;
    }

    let mut records = Vec::with_capacity(uigf.list.len());
    for item in uigf.list {
      let locale = item
        .lang
        .or(uigf.info.lang.clone())
        .unwrap_or(expected_locale.clone());

      if is_v2_2 {
        if item.name.is_none() {
          return Err(LegacyUigfGachaRecordsReadErrorKind::RequiredField { field: FIELD_NAME })?;
        } else if item.item_type.is_none() {
          return Err(LegacyUigfGachaRecordsReadErrorKind::RequiredField {
            field: FIELD_ITEM_TYPE,
          })?;
        }
      } else if is_v2_3 && item.item_id.is_none() {
        return Err(LegacyUigfGachaRecordsReadErrorKind::RequiredField {
          field: FIELD_ITEM_ID,
        })?;
      }

      let name = item.name.clone();
      let item_id = item.item_id.clone();
      let metadata_entry = metadata
        .obtain(BUSINESS, &locale)
        .and_then(|map| {
          if is_v2_2 {
            map.entry_from_name_first(name.as_ref().unwrap())
          } else {
            map.entry_from_id(item_id.as_ref().unwrap())
          }
        })
        .ok_or_else(
          || LegacyUigfGachaRecordsReadErrorKind::MissingMetadataEntry {
            business: BUSINESS,
            locale: locale.clone(),
            key: if is_v2_2 { FIELD_NAME } else { FIELD_ITEM_ID },
            val: if is_v2_2 {
              name.clone().unwrap()
            } else {
              item_id.clone().unwrap()
            },
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
        time: item.time, // TODO: uigf.info.region_time_zone
        name: item.name.unwrap_or(metadata_entry.name.to_owned()),
        item_type: item
          .item_type
          .unwrap_or(metadata_entry.category_name.to_owned()),
        item_id: Some(item.item_id.unwrap_or(metadata_entry.id.to_owned())),
      })
    }

    Ok(records)
  }
}

// Fresh UIGF Gacha Records
// Support: v4.0
// https://uigf.org/zh/standards/uigf.html

declare_error_kinds!(
  UigfGachaRecordsWriteError,
  kinds {
    #[error("Missing account information provided: {uid}")]
    MissingAccountInfo { uid: u32 },

    #[error("Missing metadata entry: {business}, locale: {locale}, {key}: {val}")]
    MissingMetadataEntry {
      business: Business,
      locale: String,
      key: &'static str,
      val: String
    },

    #[error("Failed to mapping uigf gacha type: {value}")]
    FailedMappingGachaType { value: u32 },

    #[error("Failed to create output '{path}': {cause}")]
    CreateOutput {
      path: PathBuf,
      cause: io::Error => serde_json::json!({
        "kind": format_args!("{}", cause.kind()),
        "message": format_args!("{cause}"),
      })
    },

    #[error("Serialization json error: {cause}")]
    Serialize {
      cause: serde_json::Error => format_args!("{}", cause)
    },
  }
);

declare_error_kinds!(
  UigfGachaRecordsReadError,
  kinds {
    #[error("Failed to open input: {cause}")]
    OpenInput {
      cause: io::Error => serde_json::json!({
        "kind": format_args!("{}", cause.kind()),
        "message": format_args!("{cause}"),
      })
    },

    #[error("Invalid json input: {cause}")]
    InvalidInput {
      cause: serde_json::Error => format_args!("{}", cause)
    },

    #[error("Invalid uigf version string: {version}")]
    InvalidVersion { version: String },

    #[error("Unsupported uigf version: {version} (Allowed: {allowed})")]
    UnsupportedVersion { version: UigfVersion, allowed: String },

    #[error("Missing metadata entry: {business}, locale: {locale}, {key}: {val}")]
    MissingMetadataEntry {
      business: Business,
      locale: String,
      key: &'static str,
      val: String
    },
  }
);

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Uigf {
  pub info: UigfInfo,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub hk4e: Option<Vec<UigfProject<UigfHk4eItem>>>,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub hkrpg: Option<Vec<UigfProject<UigfHkrpgItem>>>,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub nap: Option<Vec<UigfProject<UigfNapItem>>>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfInfo {
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number",
    serialize_with = "serde_helper::ser::number_as_string"
  )]
  pub export_timestamp: u64,
  pub export_app: String,
  pub export_app_version: String,
  pub version: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfProject<Item> {
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number",
    serialize_with = "serde_helper::ser::number_as_string"
  )]
  pub uid: u32,
  pub timezone: i8,
  pub lang: String,
  pub list: Vec<Item>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfHk4eItem {
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number",
    serialize_with = "serde_helper::ser::number_as_string"
  )]
  pub uigf_gacha_type: u32,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number",
    serialize_with = "serde_helper::ser::number_as_string"
  )]
  pub gacha_type: u32,
  pub item_id: String,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number_option",
    serialize_with = "serde_helper::ser::option_number_as_string",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub count: Option<u32>,
  pub time: String,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub item_type: Option<String>,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number_option",
    serialize_with = "serde_helper::ser::option_number_as_string",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub rank_type: Option<u32>,
  pub id: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfHkrpgItem {
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number",
    serialize_with = "serde_helper::ser::number_as_string"
  )]
  pub gacha_id: u32,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number",
    serialize_with = "serde_helper::ser::number_as_string"
  )]
  pub gacha_type: u32,
  pub item_id: String,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number_option",
    serialize_with = "serde_helper::ser::option_number_as_string",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub count: Option<u32>,
  pub time: String,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub item_type: Option<String>,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number_option",
    serialize_with = "serde_helper::ser::option_number_as_string",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub rank_type: Option<u32>,
  pub id: String,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct UigfNapItem {
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number_option",
    serialize_with = "serde_helper::ser::option_number_as_string",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub gacha_id: Option<u32>,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number",
    serialize_with = "serde_helper::ser::number_as_string"
  )]
  pub gacha_type: u32,
  pub item_id: String,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number_option",
    serialize_with = "serde_helper::ser::option_number_as_string",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub count: Option<u32>,
  pub time: String,
  #[serde(default = "Option::default", skip_serializing_if = "Option::is_none")]
  pub item_type: Option<String>,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number_option",
    serialize_with = "serde_helper::ser::option_number_as_string",
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
  pub accounts: HashMap<u32, (i8, String)>,  // uid -> (timezone, lang)
  #[serde(with = "rfc3339")]
  pub export_time: OffsetDateTime,
}

impl GachaRecordsWriter for UigfGachaRecordsWriter {
  type Error = UigfGachaRecordsWriteError;

  fn write(
    &self,
    metadata: &GachaMetadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<(), Self::Error> {
    let Self {
      businesses,
      accounts,
      export_time,
    } = self;

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
      ($business:ident, $project:ident, $item:ident, $item_convert:expr) => {
        let mut projects = Vec::with_capacity($project.len());
        for (uid, records) in $project {
          // Ensure that the account information is provided
          let (timezone, lang) = accounts
            .get(&uid)
            .cloned()
            .ok_or(UigfGachaRecordsWriteErrorKind::MissingAccountInfo { uid })?;

          let mut list = Vec::with_capacity(records.len());
          for record in records {
            // Find the metadata entry
            let name = record.name.clone();
            let item_id = record.item_id.clone();
            let has_item_id = item_id.is_some();

            let metadata_entry = metadata
              .obtain(Business::$business, &record.lang)
              .and_then(|map| {
                if has_item_id {
                  map.entry_from_id(item_id.as_ref().unwrap())
                } else {
                  map.entry_from_name_first(&name)
                }
              })
              .ok_or_else(|| UigfGachaRecordsWriteErrorKind::MissingMetadataEntry {
                business: Business::$business,
                locale: record.lang.clone(),
                key: if has_item_id {
                  FIELD_ITEM_ID
                } else {
                  FIELD_NAME
                },
                val: if has_item_id {
                  item_id.clone().unwrap()
                } else {
                  name.clone()
                },
              })?;

            let item = $item_convert(record, metadata_entry)?;
            list.push(item);
          }

          projects.push(UigfProject {
            uid,
            timezone,
            lang,
            list,
          });
        }

        uigf.$project.replace(projects);
      };
    }

    if let Some(hk4e) = hk4e {
      convert!(
        GenshinImpact,
        hk4e,
        UigfHk4eItem,
        |record: GachaRecord, metadata_entry: MetadataStructEntryRef<'_>| {
          Result::<_, Self::Error>::Ok(UigfHk4eItem {
            uigf_gacha_type: *UIGF_GACHA_TYPE_MAPPINGS
              .get(&record.gacha_type)
              .ok_or_else(|| UigfGachaRecordsWriteErrorKind::FailedMappingGachaType {
                value: record.gacha_type,
              })?,
            gacha_type: record.gacha_type,
            item_id: record.item_id.unwrap_or(metadata_entry.id.to_owned()),
            count: Some(record.count),
            time: record.time,
            item_type: Some(metadata_entry.category_name.to_owned()),
            rank_type: Some(record.rank_type),
            id: record.id,
          })
        }
      );
    }

    if let Some(hkrpg) = hkrpg {
      convert!(
        HonkaiStarRail,
        hkrpg,
        UigfHkrpgItem,
        |record: GachaRecord, metadata_entry: MetadataStructEntryRef<'_>| {
          // HACK: In Honkai Star Rail business,
          //   the gacha_id value of the Record must exist.
          //   Unless the user manually modifies the database record
          let gacha_id = record.gacha_id.unwrap();

          Result::<_, Self::Error>::Ok(UigfHkrpgItem {
            gacha_id,
            gacha_type: record.gacha_type,
            item_id: record.item_id.unwrap_or(metadata_entry.id.to_owned()),
            count: Some(record.count),
            time: record.time,
            item_type: Some(record.item_type),
            rank_type: Some(record.rank_type),
            id: record.id,
          })
        }
      );
    }

    if let Some(nap) = nap {
      convert!(
        ZenlessZoneZero,
        nap,
        UigfNapItem,
        |record: GachaRecord, metadata_entry: MetadataStructEntryRef<'_>| {
          Result::<_, Self::Error>::Ok(UigfNapItem {
            gacha_id: record.gacha_id,
            gacha_type: record.gacha_type,
            item_id: record.item_id.unwrap_or(metadata_entry.id.to_owned()),
            count: Some(record.count),
            time: record.time,
            item_type: Some(record.item_type),
            rank_type: Some(record.rank_type),
            id: record.id,
          })
        }
      );
    }

    let output = output.as_ref().with_extension("json");
    let output_file =
      File::create(&output).map_err(|cause| UigfGachaRecordsWriteErrorKind::CreateOutput {
        path: output,
        cause,
      })?;

    serde_json::to_writer(BufWriter::new(output_file), &uigf)
      .map_err(|cause| UigfGachaRecordsWriteErrorKind::Serialize { cause })?;

    Ok(())
  }
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UigfGachaRecordsReader {
  pub businesses: Option<HashSet<Business>>, // None for all businesses
  pub accounts: Option<HashSet<u32>>,        // None for all accounts
}

impl GachaRecordsReader for UigfGachaRecordsReader {
  type Error = UigfGachaRecordsReadError;

  fn read_from_file(
    &self,
    metadata: &GachaMetadata,
    input: impl AsRef<Path>,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    let input =
      File::open(input).map_err(|cause| UigfGachaRecordsReadErrorKind::OpenInput { cause })?;

    self.read(metadata, input)
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
        allowed: Uigf::SUPPORTED_VERSIONS
          .iter()
          .map(ToString::to_string)
          .collect::<Vec<_>>()
          .join(", "),
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
    fn sum_vec_project<T>(v: Option<&Vec<UigfProject<T>>>) -> usize {
      v.map(|v| v.len()).unwrap_or(0)
    }

    let mut records = Vec::with_capacity(
      sum_vec_project(hk4e.as_ref())
        + sum_vec_project(hkrpg.as_ref())
        + sum_vec_project(nap.as_ref()),
    );

    macro_rules! convert {
      ($business:ident, $project:ident, $item:ident, $gacha_id:expr) => {
        for project in $project {
          // Skip the project if the account is not expected
          if let Some(accounts) = accounts {
            if !accounts.contains(&project.uid) {
              continue;
            }
          }

          for item in project.list {
            let metadata_entry = metadata
              .obtain(Business::$business, &project.lang)
              .and_then(|map| map.entry_from_id(&item.item_id))
              .ok_or_else(|| UigfGachaRecordsReadErrorKind::MissingMetadataEntry {
                business: Business::$business,
                locale: project.lang.clone(),
                key: FIELD_ITEM_ID,
                val: item.item_id.clone(),
              })?;

            let gacha_id = $gacha_id(&item);
            records.push(GachaRecord {
              business: Business::$business,
              uid: project.uid,
              id: item.id,
              gacha_type: item.gacha_type,
              gacha_id,
              rank_type: item.rank_type.unwrap_or(metadata_entry.rank as _),
              count: item.count.unwrap_or(1),
              lang: project.lang.clone(),
              time: item.time, // TODO: project.timezone
              name: metadata_entry.name.to_owned(),
              item_type: item
                .item_type
                .unwrap_or(metadata_entry.category_name.to_owned()),
              item_id: Some(item.item_id),
            })
          }
        }
      };
    }

    if let Some(hk4e) = hk4e {
      convert!(GenshinImpact, hk4e, UigfHk4eItem, |_| None);
    }

    if let Some(hkrpg) = hkrpg {
      convert!(
        HonkaiStarRail,
        hkrpg,
        UigfHkrpgItem,
        |item: &UigfHkrpgItem| Some(item.gacha_id)
      );
    }

    if let Some(nap) = nap {
      convert!(ZenlessZoneZero, nap, UigfNapItem, |item: &UigfNapItem| item
        .gacha_id);
    }

    Ok(records)
  }
}

// endregion

// region: SRGF

// Legacy SRGF Gacha Records
// Support: v1.0
// https://uigf.org/zh/standards/srgf.html

declare_error_kinds!(
  SrgfGachaRecordsWriteError,
  kinds {
    #[error("Incompatible record business: {business}, id: {id}, name: {name}")]
    IncompatibleRecordBusiness {
      business: Business,
      id: String,
      name: String
    },

    #[error("Incompatible record owner uid: expected: {expected}, actual: {actual}")]
    IncompatibleRecordOwner { expected: u32, actual: u32 },

    #[error("Incompatible record locale: expected: {expected}, actual: {actual}")]
    IncompatibleRecordLocale { expected: String, actual: String },

    #[error("Failed to create output '{path}': {cause}")]
    CreateOutput {
      path: PathBuf,
      cause: io::Error => serde_json::json!({
        "kind": format_args!("{}", cause.kind()),
        "message": format_args!("{cause}"),
      })
    },

    #[error("Serialization json error: {cause}")]
    Serialize {
      cause: serde_json::Error => format_args!("{}", cause)
    },
  }
);

declare_error_kinds!(
  SrgfGachaRecordsReadError,
  kinds {
    #[error("Failed to open input: {cause}")]
    OpenInput {
      cause: io::Error => serde_json::json!({
        "kind": format_args!("{}", cause.kind()),
        "message": format_args!("{cause}"),
      })
    },

    #[error("Invalid json input: {cause}")]
    InvalidInput {
      cause: serde_json::Error => format_args!("{}", cause)
    },

    #[error("Invalid uigf version string: {version}")]
    InvalidVersion { version: String },

    #[error("Unsupported uigf version: {version} (Allowed: {allowed})")]
    UnsupportedVersion { version: UigfVersion, allowed: String },

    #[error("Inconsistent with expected uid: expected: {expected}, actual: {actual}")]
    InconsistentUid { expected: u32, actual: u32 },

    #[error("Missing metadata entry: {business}, locale: {lang}, {key}: {val}")]
    MissingMetadataEntry {
      business: Business,
      lang: String,
      key: &'static str,
      val: String
    },
  }
);

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct Srgf {
  pub info: SrgfInfo,
  pub list: Vec<SrgfItem>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct SrgfInfo {
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number",
    serialize_with = "serde_helper::ser::number_as_string"
  )]
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
    deserialize_with = "serde_helper::de::string_as_number_option",
    serialize_with = "serde_helper::ser::option_number_as_string",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub uid: Option<u32>,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number",
    serialize_with = "serde_helper::ser::number_as_string"
  )]
  pub gacha_id: u32,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number",
    serialize_with = "serde_helper::ser::number_as_string"
  )]
  pub gacha_type: u32,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number_option",
    serialize_with = "serde_helper::ser::option_number_as_string",
    default = "Option::default",
    skip_serializing_if = "Option::is_none"
  )]
  pub count: Option<u32>,
  pub time: String,
  pub name: Option<String>,
  pub lang: Option<String>,
  pub item_id: String,
  pub item_type: Option<String>,
  #[serde(
    deserialize_with = "serde_helper::de::string_as_number_option",
    serialize_with = "serde_helper::ser::option_number_as_string",
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
  pub region_time_zone: i8,
}

impl GachaRecordsWriter for SrgfGachaRecordsWriter {
  type Error = SrgfGachaRecordsWriteError;

  fn write(
    &self,
    _metadata: &GachaMetadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<(), Self::Error> {
    // SRGF Gacha Records only support: Honkai Star Rail
    const BUSINESS: Business = Business::HonkaiStarRail;

    let Self {
      srgf_version,
      account_locale,
      account_uid,
      export_time,
      region_time_zone,
    } = self;

    let mut srgf = Srgf {
      info: SrgfInfo {
        uid: *account_uid,
        lang: account_locale.to_owned(),
        export_timestamp: Some(export_time.unix_timestamp() as _),
        export_app: Some(consts::ID.to_owned()),
        export_app_version: Some(consts::VERSION_WITH_PREFIX.to_owned()),
        srgf_version: srgf_version.to_string(),
        region_time_zone: *region_time_zone,
      },
      list: Vec::with_capacity(records.len()),
    };

    for record in records {
      // Avoid writing records that are not compatible with the account.
      if record.business != BUSINESS {
        return Err(SrgfGachaRecordsWriteErrorKind::IncompatibleRecordBusiness {
          business: record.business,
          id: record.id,
          name: record.name,
        })?;
      } else if record.uid != *account_uid {
        return Err(SrgfGachaRecordsWriteErrorKind::IncompatibleRecordOwner {
          expected: *account_uid,
          actual: record.uid,
        })?;
      } else if record.lang != *account_locale {
        return Err(SrgfGachaRecordsWriteErrorKind::IncompatibleRecordLocale {
          expected: account_locale.to_owned(),
          actual: record.lang,
        })?;
      }

      // HACK: In Honkai Star Rail business,
      //   the gacha_id and item_id value of the Record must exist.
      //   Unless the user manually modifies the database record
      let gacha_id = record.gacha_id.unwrap();
      let item_id = record.item_id.unwrap();

      srgf.list.push(SrgfItem {
        id: record.id,
        uid: Some(record.uid),
        gacha_id,
        gacha_type: record.gacha_type,
        count: Some(record.count),
        time: record.time, // TODO: region_time_zone
        name: Some(record.name),
        lang: Some(record.lang),
        item_id,
        item_type: Some(record.item_type),
        rank_type: Some(record.rank_type),
      })
    }

    let output = output.as_ref().with_extension("json");
    let output_file =
      File::create(&output).map_err(|cause| SrgfGachaRecordsWriteErrorKind::CreateOutput {
        path: output,
        cause,
      })?;

    serde_json::to_writer(BufWriter::new(output_file), &srgf)
      .map_err(|cause| SrgfGachaRecordsWriteErrorKind::Serialize { cause })?;

    Ok(())
  }
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SrgfGachaRecordsReader {
  pub expected_locale: String,
  pub expected_uid: u32,
}

impl GachaRecordsReader for SrgfGachaRecordsReader {
  type Error = SrgfGachaRecordsReadError;

  fn read_from_file(
    &self,
    metadata: &GachaMetadata,
    input: impl AsRef<Path>,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    let input =
      File::open(input).map_err(|cause| SrgfGachaRecordsReadErrorKind::OpenInput { cause })?;

    self.read(metadata, input)
  }

  fn read(
    &self,
    metadata: &GachaMetadata,
    input: impl Read,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    // Legacy SRGF Gacha Records only support: Honkai Star Rail
    const BUSINESS: Business = Business::HonkaiStarRail;

    let Self {
      expected_locale,
      expected_uid,
    } = self;

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
        allowed: Srgf::SUPPORTED_VERSIONS
          .iter()
          .map(ToString::to_string)
          .collect::<Vec<_>>()
          .join(", "),
      })?;
    }

    if srgf.info.uid != *expected_uid {
      return Err(SrgfGachaRecordsReadErrorKind::InconsistentUid {
        expected: *expected_uid,
        actual: srgf.info.uid,
      })?;
    }

    let mut records = Vec::with_capacity(srgf.list.len());
    for item in srgf.list {
      let locale = item.lang.unwrap_or(expected_locale.clone());
      let metadata_entry = metadata
        .obtain(BUSINESS, &locale)
        .and_then(|map| map.entry_from_id(&item.item_id))
        .ok_or_else(|| SrgfGachaRecordsReadErrorKind::MissingMetadataEntry {
          business: BUSINESS,
          lang: locale.clone(),
          key: FIELD_ITEM_ID,
          val: item.item_id.clone(),
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
        time: item.time, // TODO: srgf.info.region_time_zone
        name: item.name.unwrap_or(metadata_entry.name.to_owned()),
        item_type: item
          .item_type
          .unwrap_or(metadata_entry.category_name.to_owned()),
        item_id: Some(item.item_id),
      })
    }

    Ok(records)
  }
}

// endregion

// region: Excel Writer

// declare_error_kinds!(
//   ExcelGachaRecordsWriteError,
//   kinds {
//     #[error("Todo")]
//     Todo,
//   }
// );

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

// region: Tests

#[cfg(test)]
mod tests {
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
    .read_from_slice(GachaMetadata::embedded(), input)
    .unwrap();

    assert_eq!(records.len(), 1);

    let record = &records[0];
    assert_eq!(record.business, Business::GenshinImpact);
    assert_eq!(record.uid, 100_000_000);
    assert_eq!(record.id, "1000000000000000000");
    assert_eq!(record.gacha_type, 301);
    assert_eq!(record.gacha_id, None);
    assert_eq!(record.rank_type, 5);
    assert_eq!(record.count, 1);
    assert_eq!(record.lang, "en-us");
    assert_eq!(record.time, "2023-01-01 00:00:00");
    assert_eq!(record.name, "Kamisato Ayaka");
    assert_eq!(record.item_type, "Character");
    assert_eq!(record.item_id.as_deref(), Some("10000002"));
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
    .read_from_slice(GachaMetadata::embedded(), input)
    .unwrap();

    assert_eq!(records.len(), 1);

    let record = &records[0];
    assert_eq!(record.business, Business::GenshinImpact);
    assert_eq!(record.uid, 100_000_000);
    assert_eq!(record.id, "1000000000000000000");
    assert_eq!(record.gacha_type, 301);
    assert_eq!(record.gacha_id, None);
    assert_eq!(record.rank_type, 5);
    assert_eq!(record.count, 1);
    assert_eq!(record.lang, "en-us");
    assert_eq!(record.time, "2023-01-01 00:00:00");
    assert_eq!(record.name, "Kamisato Ayaka");
    assert_eq!(record.item_type, "Character");
    assert_eq!(record.item_id.as_deref(), Some("10000002"));
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
    .read_from_slice(GachaMetadata::embedded(), input)
    .unwrap_err();

    assert!(matches!(
      err.into_inner(),
      LegacyUigfGachaRecordsReadErrorKind::RequiredField { field }
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
      time: "2023-01-01 00:00:00".to_owned(),
      name: "Kamisato Ayaka".to_owned(),
      item_type: "Character".to_owned(),
      item_id: Some("10000002".to_owned()),
    }];

    let temp_dir = tempfile::tempdir().unwrap();
    let output = temp_dir.path().join("test_legacy_uigf_write_and_read");

    LegacyUigfGachaRecordsWriter {
      uigf_version: UigfVersion::V2_2,
      account_locale: "en-us".to_owned(),
      account_uid: 100_000_000,
      export_time: OffsetDateTime::now_utc().to_offset(*consts::LOCAL_OFFSET),
      region_time_zone: 8,
    }
    .write(GachaMetadata::embedded(), records.clone(), &output)
    .unwrap();

    let input = File::open(output.with_extension("json")).unwrap();
    let read_records = LegacyUigfGachaRecordsReader {
      expected_locale: "en-us".to_owned(),
      expected_uid: 100_000_000,
    }
    .read(GachaMetadata::embedded(), input)
    .unwrap();

    assert_eq!(records, read_records);

    temp_dir.close().unwrap();
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
          "timezone": 8,
          "lang": "en-us",
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
          "timezone": 8,
          "lang": "en-us",
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
          "uid": "100000002",
          "timezone": 8,
          "lang": "en-us",
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
      accounts: None,
    }
    .read_from_slice(GachaMetadata::embedded(), input)
    .unwrap();

    assert_eq!(records.len(), 3);

    let record = &records[0];
    assert_eq!(record.business, Business::GenshinImpact);
    assert_eq!(record.uid, 100_000_000);
    assert_eq!(record.id, "1000000000000000000");
    assert_eq!(record.gacha_type, 301);
    assert_eq!(record.gacha_id, None);
    assert_eq!(record.rank_type, 5);
    assert_eq!(record.count, 1);
    assert_eq!(record.lang, "en-us");
    assert_eq!(record.time, "2023-01-01 00:00:00");
    assert_eq!(record.name, "Kamisato Ayaka");
    assert_eq!(record.item_type, "Character");
    assert_eq!(record.item_id.as_deref(), Some("10000002"));

    let record = &records[1];
    assert_eq!(record.business, Business::HonkaiStarRail);
    assert_eq!(record.uid, 100_000_001);
    assert_eq!(record.id, "1000000000000000001");
    assert_eq!(record.gacha_type, 11);
    assert_eq!(record.gacha_id, Some(1));
    assert_eq!(record.rank_type, 4);
    assert_eq!(record.count, 1);
    assert_eq!(record.lang, "en-us");
    assert_eq!(record.time, "2023-01-01 00:00:00");
    assert_eq!(record.name, "March 7th");
    assert_eq!(record.item_type, "Character");
    assert_eq!(record.item_id.as_deref(), Some("1001"));

    let record = &records[2];
    assert_eq!(record.business, Business::ZenlessZoneZero);
    assert_eq!(record.uid, 100_000_002);
    assert_eq!(record.id, "1000000000000000002");
    assert_eq!(record.gacha_type, 1);
    assert_eq!(record.gacha_id, None);
    assert_eq!(record.rank_type, 3);
    assert_eq!(record.count, 1);
    assert_eq!(record.lang, "en-us");
    assert_eq!(record.time, "2023-01-01 00:00:00");
    assert_eq!(record.name, "Anby");
    assert_eq!(record.item_type, "Agents");
    assert_eq!(record.item_id.as_deref(), Some("1011"));
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
        time: "2023-01-01 00:00:00".to_owned(),
        name: "Kamisato Ayaka".to_owned(),
        item_type: "Character".to_owned(),
        item_id: Some("10000002".to_owned()),
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
        time: "2023-01-01 00:00:00".to_owned(),
        name: "March 7th".to_owned(),
        item_type: "Character".to_owned(),
        item_id: Some("1001".to_owned()),
      },
      GachaRecord {
        business: Business::ZenlessZoneZero,
        uid: 100_000_002,
        id: "1000000000000000002".to_owned(),
        gacha_type: 1,
        gacha_id: None,
        rank_type: 3,
        count: 1,
        lang: "en-us".to_owned(),
        time: "2023-01-01 00:00:00".to_owned(),
        name: "Anby".to_owned(),
        item_type: "Agents".to_owned(),
        item_id: Some("1011".to_owned()),
      },
    ];

    let temp_dir = tempfile::tempdir().unwrap();
    let output = temp_dir.path().join("test_uigf_v4_0_gacha_records_writer");

    UigfGachaRecordsWriter {
      businesses: None,
      accounts: HashMap::from_iter([
        (100_000_000, (8, "en-us".to_owned())),
        (100_000_001, (8, "en-us".to_owned())),
        (100_000_002, (8, "en-us".to_owned())),
      ]),
      export_time: OffsetDateTime::now_utc().to_offset(*consts::LOCAL_OFFSET),
    }
    .write(GachaMetadata::embedded(), records.clone(), &output)
    .unwrap();

    let input = File::open(output.with_extension("json")).unwrap();
    let read_records = UigfGachaRecordsReader {
      businesses: None,
      accounts: None,
    }
    .read(GachaMetadata::embedded(), input)
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
      expected_locale: "en-us".to_owned(),
      expected_uid: 100_000_000,
    }
    .read_from_slice(GachaMetadata::embedded(), input)
    .unwrap();

    assert_eq!(records.len(), 1);

    let record = &records[0];
    assert_eq!(record.business, Business::HonkaiStarRail);
    assert_eq!(record.uid, 100_000_000);
    assert_eq!(record.id, "1000000000000000000");
    assert_eq!(record.gacha_type, 301);
    assert_eq!(record.gacha_id, Some(1));
    assert_eq!(record.rank_type, 4);
    assert_eq!(record.count, 1);
    assert_eq!(record.lang, "en-us");
    assert_eq!(record.time, "2023-01-01 00:00:00");
    assert_eq!(record.name, "March 7th");
    assert_eq!(record.item_type, "Character");
    assert_eq!(record.item_id.as_deref(), Some("1001"));
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
      time: "2023-01-01 00:00:00".to_owned(),
      name: "March 7th".to_owned(),
      item_type: "Character".to_owned(),
      item_id: Some("1001".to_owned()),
    }];

    let temp_dir = tempfile::tempdir().unwrap();
    let output = temp_dir.path().join("test_srgf_v1_0_gacha_records_write");

    SrgfGachaRecordsWriter {
      srgf_version: Srgf::V1_0,
      account_locale: "en-us".to_owned(),
      account_uid: 100_000_000,
      export_time: OffsetDateTime::now_utc().to_offset(*consts::LOCAL_OFFSET),
      region_time_zone: 8,
    }
    .write(GachaMetadata::embedded(), records.clone(), &output)
    .unwrap();

    let input = File::open(output.with_extension("json")).unwrap();
    let read_records = SrgfGachaRecordsReader {
      expected_locale: "en-us".to_owned(),
      expected_uid: 100_000_000,
    }
    .read(GachaMetadata::embedded(), input)
    .unwrap();

    assert_eq!(records, read_records);

    temp_dir.close().unwrap();
  }
}

// endregion
