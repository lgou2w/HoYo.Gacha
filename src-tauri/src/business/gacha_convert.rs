use std::collections::HashMap;
use std::fmt::{self, Display};
use std::fs::File;
use std::io::{self, BufWriter, Cursor, Read};
use std::path::{Path, PathBuf};
use std::str::FromStr;

use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};
use time::format_description::FormatItem;
use time::macros::format_description;
use time::OffsetDateTime;

use crate::consts;
use crate::error::{declare_error_kinds, ErrorDetails};
use crate::models::{Business, GachaMetadata, GachaRecord};
use crate::utilities::serde_helper;

// region: Declares

pub trait GachaRecordsWriter {
  type Error: ErrorDetails;

  fn write(
    &self,
    metadata: &GachaMetadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>, // Output file path without extension.
  ) -> Result<(), Self::Error>;
}

pub trait GachaRecordsReader {
  type Error: ErrorDetails;

  fn read(
    &self,
    metadata: &GachaMetadata,
    input: impl Read,
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
pub struct VersionNumber {
  pub major: u8,
  pub minor: u8,
}

static VERSION_NUMBER_REGEX: Lazy<Regex> =
  Lazy::new(|| Regex::new(r"^v(?P<major>\d+)\.(?P<minor>\d+)$").unwrap());

impl VersionNumber {
  pub const fn new(major: u8, minor: u8) -> Self {
    Self { major, minor }
  }
}

impl Display for VersionNumber {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "v{}.{}", self.major, self.minor)
  }
}

impl FromStr for VersionNumber {
  type Err = ();

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    let caps = VERSION_NUMBER_REGEX.captures(s).ok_or(())?;
    let major = caps["major"].parse().unwrap();
    let minor = caps["minor"].parse().unwrap();
    Ok(VersionNumber { major, minor })
  }
}

// endregion

// region: UIGF

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
    IncompatibleRecordOwner {
      expected: u32,
      actual: u32
    },

    #[error("Incompatible record locale: expected: {expected}, actual: {actual}")]
    IncompatibleRecordLocale {
      expected: String,
      actual: String
    },

    #[error("Failed to mapping uigf gacha type: {gacha_type}")]
    FailedMappingGachaType {
      gacha_type: u32
    },

    #[error("Failed to create output '{path}': {cause}")]
    CreateOutput {
      path: PathBuf,
      cause: io::Error => format_args!("{}", cause)
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
    #[error("Invalid json input: {cause}")]
    InvalidInput {
      cause: serde_json::Error => format_args!("{}", cause)
    },

    #[error("Invalid uigf version string: {version}")]
    InvalidVersion { version: String },

    #[error("Unsupported uigf version: {version} (Allowed: {allowed})")]
    UnsupportedVersion {
      version: VersionNumber => format_args!("{}", version),
      allowed: String
    },

    #[error("Inconsistent with expected uid: expected: {expected}, actual: {actual})")]
    InconsistentUid { expected: u32, actual: u32 },

    #[error("Required field missing: {field}")]
    RequiredField { field: &'static str },

    #[error("Missing metadata entry: {business}, locale: {lang}, {key}: {val}")]
    MissingMetadataEntry {
      business: Business,
      lang: String,
      key: &'static str,
      val: String
    },
  }
);

/*
 * Gacha Type (Official) | Gacha Type (Legacy UIGF)
 *       100             |       100
 *       200             |       200
 *       301             |       301
 *       400             |       301
 *       302             |       302
 *       500             |       500
 */
static LEGACY_UIGF_GACHA_TYPE_MAPPINGS: Lazy<HashMap<u32, u32>> = Lazy::new(|| {
  let mut m = HashMap::with_capacity(6);
  m.insert(100, 100);
  m.insert(200, 200);
  m.insert(301, 301);
  m.insert(400, 301); // 400 -> 301
  m.insert(302, 302);
  m.insert(500, 500);
  m
});

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct LegacyUigf {
  pub info: LegacyUigfInfo,
  pub list: Vec<LegacyUigfItem>,
}

impl LegacyUigf {
  pub const V2_2: VersionNumber = VersionNumber::new(2, 2);
  pub const V2_3: VersionNumber = VersionNumber::new(2, 3);
  pub const V2_4: VersionNumber = VersionNumber::new(2, 4);
  pub const V3_0: VersionNumber = VersionNumber::new(3, 0);
  pub const SUPPORTED_VERSIONS: [VersionNumber; 4] =
    [Self::V2_2, Self::V2_3, Self::V2_4, Self::V3_0];
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

pub struct LegacyUigfGachaRecordsWriter {
  pub uigf_version: VersionNumber, // Legacy UIGF version: v2.2, v2.3, v2.4, v3.0
  pub account_locale: String,
  pub account_uid: u32,
  pub export_time: OffsetDateTime,
  pub region_time_zone: i8,
}

impl GachaRecordsWriter for LegacyUigfGachaRecordsWriter {
  type Error = LegacyUigfGachaRecordsWriteErrorKind;

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

    let export_time_str = export_time.format(TIME_FORMAT).unwrap();
    let export_timestamp = export_time.unix_timestamp();

    let mut uigf = LegacyUigf {
      info: LegacyUigfInfo {
        uid: *account_uid,
        lang: Some(account_locale.clone()),
        export_time: Some(export_time_str),
        export_timestamp: Some(export_timestamp as _),
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
        return Err(Self::Error::IncompatibleRecordBusiness {
          business: record.business,
          id: record.id.clone(),
          name: record.name.clone(),
        });
      } else if record.uid != *account_uid {
        return Err(Self::Error::IncompatibleRecordOwner {
          expected: *account_uid,
          actual: record.uid,
        });
      } else if record.lang != *account_locale {
        return Err(Self::Error::IncompatibleRecordLocale {
          expected: account_locale.clone(),
          actual: record.lang.clone(),
        });
      }

      let uigf_gacha_type = *LEGACY_UIGF_GACHA_TYPE_MAPPINGS
        .get(&record.gacha_type)
        .ok_or_else(|| Self::Error::FailedMappingGachaType {
          gacha_type: record.gacha_type,
        })?;

      // Always fill in these optional fields to ensure compatibility
      uigf.list.push(LegacyUigfItem {
        id: record.id.clone(),
        uid: Some(record.uid),
        gacha_type: record.gacha_type,
        count: Some(record.count),
        time: record.time.clone(), // TODO: region_time_zone
        name: Some(record.name.clone()),
        lang: Some(record.lang.clone()),
        item_id: record.item_id.clone(),
        item_type: Some(record.item_type.clone()),
        rank_type: Some(record.rank_type),
        uigf_gacha_type,
      })
    }

    let output = output.as_ref().with_extension("json");
    let output_file = File::create(&output).map_err(|cause| Self::Error::CreateOutput {
      path: output,
      cause,
    })?;

    serde_json::to_writer(BufWriter::new(output_file), &uigf)
      .map_err(|cause| Self::Error::Serialize { cause })?;

    Ok(())
  }
}

pub struct LegacyUigfGachaRecordsReader {
  pub expected_locale: String,
  pub expected_uid: u32,
}

impl GachaRecordsReader for LegacyUigfGachaRecordsReader {
  type Error = LegacyUigfGachaRecordsReadErrorKind;

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

    let uigf: LegacyUigf =
      serde_json::from_reader(input).map_err(|cause| Self::Error::InvalidInput { cause })?;

    let uigf_version = VersionNumber::from_str(&uigf.info.uigf_version).map_err(|_| {
      Self::Error::InvalidVersion {
        version: uigf.info.uigf_version.clone(),
      }
    })?;

    if !LegacyUigf::SUPPORTED_VERSIONS.contains(&uigf_version) {
      return Err(Self::Error::UnsupportedVersion {
        version: uigf_version,
        allowed: LegacyUigf::SUPPORTED_VERSIONS
          .iter()
          .map(ToString::to_string)
          .collect::<Vec<_>>()
          .join(", "),
      });
    }

    if uigf.info.uid != *expected_uid {
      return Err(Self::Error::InconsistentUid {
        expected: *expected_uid,
        actual: uigf.info.uid,
      });
    }

    let is_v2_2 = uigf_version == LegacyUigf::V2_2;
    let is_v2_3 = uigf_version == LegacyUigf::V2_3;
    let is_v2_4 = uigf_version == LegacyUigf::V2_4;

    const FIELD_NAME: &str = "name";
    const FIELD_ITEM_ID: &str = "item_id";
    const FIELD_ITEM_TYPE: &str = "item_type";
    const FIELD_REGION_TIME_ZONE: &str = "region_time_zone";

    if is_v2_4 && uigf.info.region_time_zone.is_none() {
      return Err(Self::Error::RequiredField {
        field: FIELD_REGION_TIME_ZONE,
      });
    }

    let mut records = Vec::with_capacity(uigf.list.len());
    for item in uigf.list {
      let locale = item
        .lang
        .or(uigf.info.lang.clone())
        .unwrap_or(expected_locale.clone());

      if is_v2_2 {
        if item.name.is_none() {
          return Err(Self::Error::RequiredField { field: FIELD_NAME });
        } else if item.item_type.is_none() {
          return Err(Self::Error::RequiredField {
            field: FIELD_ITEM_TYPE,
          });
        }
      } else if is_v2_3 && item.item_id.is_none() {
        return Err(Self::Error::RequiredField {
          field: FIELD_ITEM_ID,
        });
      }

      let metadata_entry = metadata
        .obtain(BUSINESS, &locale)
        .and_then(|map| {
          if is_v2_2 {
            map.entry_from_name_first(item.name.as_ref().unwrap())
          } else {
            map.entry_from_id(item.item_id.as_ref().unwrap())
          }
        })
        .ok_or_else(|| Self::Error::MissingMetadataEntry {
          business: BUSINESS,
          lang: locale.clone(),
          key: if is_v2_2 { FIELD_NAME } else { FIELD_ITEM_ID },
          val: if is_v2_2 {
            item.name.as_ref().unwrap().to_owned()
          } else {
            item.item_id.as_ref().unwrap().to_owned()
          },
        })?;

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
        name: item.name.clone().unwrap_or(metadata_entry.name.to_owned()),
        item_type: item
          .item_type
          .unwrap_or(metadata_entry.category_name.to_owned()),
        item_id: Some(item.item_id.clone().unwrap_or(metadata_entry.id.to_owned())),
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
    #[error("Todo")]
    Todo,
  }
);

declare_error_kinds!(
  UigfGachaRecordsReadError,
  kinds {
    #[error("Todo")]
    Todo,
  }
);

pub struct UigfGachaRecordsWriter {}

impl GachaRecordsWriter for UigfGachaRecordsWriter {
  type Error = UigfGachaRecordsWriteErrorKind;

  fn write(
    &self,
    metadata: &GachaMetadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<(), Self::Error> {
    todo!("Implement Fresh UIGF Gacha Records Writer");
  }
}

pub struct UigfGachaRecordsReader {}

impl GachaRecordsReader for UigfGachaRecordsReader {
  type Error = UigfGachaRecordsReadErrorKind;

  fn read(
    &self,
    metadata: &GachaMetadata,
    input: impl Read,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    todo!("Implement Fresh UIGF Gacha Records Reader");
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
    #[error("Todo")]
    Todo,
  }
);

declare_error_kinds!(
  SrgfGachaRecordsReadError,
  kinds {
    #[error("Todo")]
    Todo,
  }
);

pub struct SrgfGachaRecordsWriter {}

impl GachaRecordsWriter for SrgfGachaRecordsWriter {
  type Error = SrgfGachaRecordsWriteErrorKind;

  fn write(
    &self,
    metadata: &GachaMetadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<(), Self::Error> {
    todo!("Implement SRGF Gacha Records Writer");
  }
}

pub struct SrgfGachaRecordsReader {}

impl GachaRecordsReader for SrgfGachaRecordsReader {
  type Error = SrgfGachaRecordsReadErrorKind;

  fn read(
    &self,
    metadata: &GachaMetadata,
    input: impl Read,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    todo!("Implement SRGF Gacha Records Reader");
  }
}

// endregion

// region: Excel Writer

declare_error_kinds!(
  ExcelGachaRecordsWriteError,
  kinds {
    #[error("Todo")]
    Todo,
  }
);

pub struct ExcelGachaRecordsWriter {}

impl GachaRecordsWriter for ExcelGachaRecordsWriter {
  type Error = ExcelGachaRecordsWriteErrorKind;

  fn write(
    &self,
    metadata: &GachaMetadata,
    records: Vec<GachaRecord>,
    output: impl AsRef<Path>,
  ) -> Result<(), Self::Error> {
    todo!("Implement Excel Gacha Records Writer");
  }
}

// endregion

// region: Tests

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_version_number_from_str() {
    assert_eq!("v2.2".parse(), Ok(VersionNumber::new(2, 2)));
    assert_eq!("v2.3".parse(), Ok(VersionNumber::new(2, 3)));
    assert_eq!("v2.4".parse(), Ok(VersionNumber::new(2, 4)));
    assert_eq!("v4.0".parse(), Ok(VersionNumber::new(4, 0)));

    assert_eq!("v2.2.1".parse::<VersionNumber>(), Err(()));
    assert_eq!("v2".parse::<VersionNumber>(), Err(()));
    assert_eq!("2.2".parse::<VersionNumber>(), Err(()));
    assert_eq!("2".parse::<VersionNumber>(), Err(()));
  }

  #[test]
  fn test_legacy_uigf_v2_2_gacha_records_reader() {
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
  fn test_legacy_uigf_v2_3_gacha_records_reader() {
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
  fn test_legacy_uigf_v2_4_region_time_zone() {
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
      err,
      LegacyUigfGachaRecordsReadErrorKind::RequiredField { field }
        if field == "region_time_zone"
    ));
  }

  #[test]
  fn test_legacy_uigf_write_and_read() {
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
      uigf_version: LegacyUigf::V2_2,
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
}

// endregion
