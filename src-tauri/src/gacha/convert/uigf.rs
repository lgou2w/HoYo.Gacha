use std::collections::HashMap;
use std::fmt;
use std::io::{Read, Write};
use std::num::ParseIntError;

use futures_util::future::BoxFuture;
use futures_util::FutureExt;
use num_enum::TryFromPrimitive;
use once_cell::sync::Lazy;
use regex::Regex;
use serde::{Deserialize, Serialize};
use time::format_description::FormatItem;
use time::macros::format_description;
use time::{OffsetDateTime, UtcOffset};

use super::{GachaConverter, GachaRecordsReader, GachaRecordsWriter};
use crate::constants;
use crate::gacha::dict::embedded as GachaDictionaryEmbedded;
use crate::models::{Business, AccountIdentifier, GachaRecord, GachaRecordRank};

// UIGF for Genshin Impact
// See: https://uigf.org/zh/standards/UIGF.html

#[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord)]
pub struct UIGFVersion {
  pub major: u8,
  pub minor: u8,
}

static REGEX_VERSION: Lazy<Regex> =
  Lazy::new(|| Regex::new(r"^v(?<major>\d+)\.(?<minor>\d+)$").unwrap());

impl UIGFVersion {
  pub const V2_2: Self = Self { major: 2, minor: 2 };
  pub const V2_3: Self = Self { major: 2, minor: 3 };
  #[allow(unused)]
  pub const V2_4: Self = Self { major: 2, minor: 4 };
  pub const V3_0: Self = Self { major: 3, minor: 0 };
  pub const CURRENT: Self = Self::V3_0;

  pub fn parse(str: impl AsRef<str>) -> Result<Self, String> {
    if let Some(captures) = REGEX_VERSION.captures(str.as_ref()) {
      let major = captures["major"].parse().unwrap();
      let minor = captures["minor"].parse().unwrap();
      Ok(Self { major, minor })
    } else {
      Err(format!(
        "Invalid version format: {} (Expected: {})",
        str.as_ref(),
        REGEX_VERSION.as_str()
      ))
    }
  }
}

impl fmt::Display for UIGFVersion {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.write_fmt(format_args!("v{}.{}", self.major, self.minor))
  }
}

impl Serialize for UIGFVersion {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::Serializer,
  {
    serializer.serialize_str(&self.to_string())
  }
}

impl<'de> Deserialize<'de> for UIGFVersion {
  fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
  where
    D: serde::Deserializer<'de>,
  {
    let str = String::deserialize(deserializer)?;
    let verion = Self::parse(str).map_err(serde::de::Error::custom)?;
    Ok(verion)
  }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UIGFInfo {
  pub uid: String,
  pub lang: String,
  pub export_time: Option<String>,
  pub export_timestamp: Option<u64>,
  pub export_app: Option<String>,
  pub export_app_version: Option<String>,
  pub uigf_version: UIGFVersion,
  // UIGF v2.4 -> required
  pub region_time_zone: Option<i8>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UIGFItem {
  pub id: String,
  pub uid: Option<String>,
  pub gacha_type: String,
  // UIGF v2.2 -> is null or empty string | v2.3 -> required
  pub item_id: Option<String>,
  pub count: Option<String>,
  pub time: String,
  // UIGF v2.2 -> required | v2.3 -> nullable
  pub name: Option<String>,
  pub lang: Option<String>,
  // UIGF v2.2 -> required | v2.3 -> nullable
  pub item_type: Option<String>,
  pub rank_type: Option<String>,
  pub uigf_gacha_type: String,
}

#[allow(clippy::upper_case_acronyms)]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct UIGF {
  pub info: UIGFInfo,
  pub list: Vec<UIGFItem>,
}

impl UIGF {
  pub fn from_json(reader: impl Read) -> Result<Self, serde_json::Error> {
    serde_json::from_reader(reader)
  }

  pub fn to_json(&self, writer: impl Write, pretty: bool) -> Result<(), serde_json::Error> {
    if pretty {
      serde_json::to_writer_pretty(writer, self)
    } else {
      serde_json::to_writer(writer, self)
    }
  }
}

// Convert

/*
 * Gacha Type (Official) | Gacha Type (UIGF)
 *       100             |       100
 *       200             |       200
 *       301             |       301
 *       400             |       301
 *       302             |       302
 *       500             |       500
 */
pub static UIGF_GACHA_TYPE_MAPPINGS: Lazy<HashMap<u32, &str>> = Lazy::new(|| {
  let mut m = HashMap::with_capacity(6);
  m.insert(100, "100");
  m.insert(200, "200");
  m.insert(301, "301");
  m.insert(400, "301"); // 400 -> 301
  m.insert(302, "302");
  m.insert(500, "500");
  m
});

#[derive(Debug, thiserror::Error)]
pub enum UIGFGachaConverterError {
  #[error("Incompatible business exists for records: {0:?}")]
  IncompatibleBusiness(Business),

  #[error("Inconsistent with expected uid. (Expected: {expected}, Actual: {actual})")]
  InconsistentUid { expected: String, actual: String },

  #[error("{0}")]
  IncorrectUid(String),

  #[error("Error while parsing field '{field}' as integer: {inner}")]
  FieldParseInt {
    field: &'static str,
    inner: ParseIntError,
  },

  #[error("Unsupported gacha type: {0}")]
  UnsupportedGachaType(u32),

  #[error("Missing dictionary data: {0}")]
  MissingDictionary(String),

  #[error("Missing required fields: {0}")]
  RequiredFields(&'static str),

  #[error("Invalid rank type: {0}")]
  InvalidRankType(u8),

  #[error("Error while converting JSON serialization: {0}")]
  SerdeJson(#[from] serde_json::Error),
}

pub struct UIGFGachaConverter {
  pub uid: String,
  pub lang: String,
}

impl UIGFGachaConverter {
  const TARGET_BUSINESS: &'static Business = &Business::GenshinImpact;

  pub fn new(uid: String, lang: String) -> Self {
    Self { uid, lang }
  }
}

impl GachaConverter for UIGFGachaConverter {
  type Error = UIGFGachaConverterError;
  type Provided = Vec<UIGFItem>;
  type Context = UIGFInfo;

  fn convert(
    &self,
    records: Vec<GachaRecord>,
    _context: &Self::Context,
  ) -> Result<Self::Provided, Self::Error> {
    let mut provided = Vec::with_capacity(records.len());
    for record in records {
      if record.business != *Self::TARGET_BUSINESS {
        return Err(UIGFGachaConverterError::IncompatibleBusiness(
          record.business,
        ));
      }

      let uigf_gacha_type = UIGF_GACHA_TYPE_MAPPINGS
        .get(&record.gacha_type)
        .ok_or(UIGFGachaConverterError::UnsupportedGachaType(
          record.gacha_type,
        ))?
        .to_string();

      let item_id = if !record.item_id.is_empty() {
        record.item_id
      } else {
        GachaDictionaryEmbedded::name(Self::TARGET_BUSINESS, &self.lang, &record.name)
          .ok_or(UIGFGachaConverterError::MissingDictionary(format!(
            "lang({}), name({})",
            self.lang, record.name
          )))?
          .item_id
          .acceptance()
          .to_owned()
      };

      provided.push(UIGFItem {
        id: record.id,
        uid: Some(record.uid.to_string()),
        gacha_type: record.gacha_type.to_string(),
        item_id: Some(item_id),
        count: Some(record.count.to_string()),
        time: record.time,
        name: Some(record.name),
        lang: Some(record.lang),
        item_type: Some(record.item_type),
        rank_type: Some(u8::from(record.rank_type).to_string()),
        uigf_gacha_type,
      })
    }

    Ok(provided)
  }

  fn deconvert(
    &self,
    provided: Self::Provided,
    context: &Self::Context,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    let mut records = Vec::with_capacity(provided.len());
    for mut provide in provided {
      // Validation required fields
      if context.uigf_version <= UIGFVersion::V2_2
        && (provide.name.is_none() || provide.item_type.is_none())
      {
        return Err(UIGFGachaConverterError::RequiredFields("name, item_type"));
      } else if context.uigf_version >= UIGFVersion::V2_3 && provide.item_id.is_none() {
        return Err(UIGFGachaConverterError::RequiredFields("item_id"));
      }

      let uid: AccountIdentifier = provide
        .uid
        .as_deref()
        .unwrap_or(&self.uid)
        .parse::<u32>()
        .map_err(|inner| UIGFGachaConverterError::FieldParseInt {
          field: "uid",
          inner,
        })?
        .try_into()
        .map_err(UIGFGachaConverterError::IncorrectUid)?;

      let gacha_type = provide.gacha_type.parse::<u32>().map_err(|inner| {
        UIGFGachaConverterError::FieldParseInt {
          field: "gacha_type",
          inner,
        }
      })?;

      let count = provide
        .count
        .as_deref()
        .unwrap_or("1")
        .parse::<u32>()
        .map_err(|inner| UIGFGachaConverterError::FieldParseInt {
          field: "count",
          inner,
        })?;

      let lang = provide.lang.unwrap_or(self.lang.clone());
      let mut item_id = provide.item_id.unwrap_or_default();

      // UIGF v2.2
      if item_id.is_empty() {
        if let Some(item_name) = &provide.name {
          let entry = GachaDictionaryEmbedded::name(Self::TARGET_BUSINESS, &lang, item_name)
            .ok_or(UIGFGachaConverterError::MissingDictionary(format!(
              "lang({lang}), name({item_name})"
            )))?;
          entry.item_id.acceptance().clone_into(&mut item_id);
          provide
            .item_type
            .get_or_insert(entry.category_name.to_owned());
          provide.rank_type.get_or_insert(entry.rank_type.to_string());
        } else {
          return Err(UIGFGachaConverterError::RequiredFields("name"));
        }
      }

      let name: String;
      let item_type: String;
      let rank_type: u8;
      if provide.name.is_none() || provide.item_type.is_none() || provide.rank_type.is_none() {
        let entry = GachaDictionaryEmbedded::id(Self::TARGET_BUSINESS, &lang, &item_id).ok_or(
          UIGFGachaConverterError::MissingDictionary(format!("lang({lang}), item_id({item_id})")),
        )?;
        name = provide.name.unwrap_or(entry.item_name.to_string());
        item_type = provide.item_type.unwrap_or(entry.category_name.to_owned());
        rank_type = provide
          .rank_type
          .map(|v| {
            v.parse::<u8>()
              .map_err(|inner| UIGFGachaConverterError::FieldParseInt {
                field: "rank_type",
                inner,
              })
          })
          .transpose()?
          .unwrap_or(entry.rank_type);
      } else {
        // unwrap is SAFETY
        name = provide.name.unwrap();
        item_type = provide.item_type.unwrap();
        rank_type = provide.rank_type.unwrap().parse::<u8>().map_err(|inner| {
          UIGFGachaConverterError::FieldParseInt {
            field: "rank_type",
            inner,
          }
        })?;
      }

      let rank_type = GachaRecordRank::try_from_primitive(rank_type)
        .map_err(|_| UIGFGachaConverterError::InvalidRankType(rank_type))?;

      records.push(GachaRecord {
        id: provide.id,
        business: *Self::TARGET_BUSINESS,
        uid,
        gacha_type,
        gacha_id: None,
        rank_type,
        count,
        time: provide.time,
        lang,
        name,
        item_type,
        item_id,
      })
    }

    Ok(records)
  }
}

// Writer

pub struct UIGFGachaRecordsWriter {
  converter: UIGFGachaConverter,
  region_time_zone: UtcOffset,
  pretty: bool,
}

impl UIGFGachaRecordsWriter {
  pub const EXPORT_APP: &'static str = constants::ID;
  pub const EXPORT_APP_VERSION: &'static str = constants::VERSION;
  const TIME_FORMAT: &'static [FormatItem<'static>] =
    format_description!("[year]-[month]-[day] [hour]:[minute]:[second]");

  pub fn new(uid: String, lang: String, region_time_zone: UtcOffset) -> Self {
    Self {
      converter: UIGFGachaConverter::new(uid, lang),
      region_time_zone,
      pretty: false,
    }
  }

  pub fn pretty(&mut self, pretty: bool) -> &mut Self {
    self.pretty = pretty;
    self
  }

  fn construct_uigf_info(&self) -> UIGFInfo {
    let uid = self.converter.uid.clone();
    let lang = self.converter.lang.clone();
    let now_utc = OffsetDateTime::now_utc();
    let region_time = now_utc.to_offset(self.region_time_zone);
    let export_time = region_time.format(&Self::TIME_FORMAT).unwrap();
    let export_timestamp = region_time.unix_timestamp() as u64;

    UIGFInfo {
      uid,
      lang,
      export_time: Some(export_time),
      export_timestamp: Some(export_timestamp),
      export_app: Some(Self::EXPORT_APP.to_owned()),
      export_app_version: Some(Self::EXPORT_APP_VERSION.to_owned()),
      uigf_version: UIGFVersion::CURRENT,
      region_time_zone: Some(self.region_time_zone.whole_hours()),
    }
  }
}

impl GachaRecordsWriter for UIGFGachaRecordsWriter {
  type Error = <UIGFGachaConverter as GachaConverter>::Error;

  fn write<'a>(
    &'a mut self,
    records: Vec<GachaRecord>,
    output: impl Write + Send + Sync + 'a,
  ) -> BoxFuture<'a, Result<(), Self::Error>> {
    async move {
      let info = self.construct_uigf_info();
      let list = self.converter.convert(records, &info)?;

      let uigf = UIGF { info, list };
      uigf.to_json(output, self.pretty)?;

      Ok(())
    }
    .boxed()
  }
}

// Reader

pub struct UIGFGachaRecordsReader {
  converter: UIGFGachaConverter,
}

impl UIGFGachaRecordsReader {
  pub fn new() -> Self {
    Self {
      // Changes on import based on the value of UIGFInfo
      converter: UIGFGachaConverter::new(String::default(), String::default()),
    }
  }
}

impl GachaRecordsReader for UIGFGachaRecordsReader {
  type Error = <UIGFGachaConverter as GachaConverter>::Error;

  fn read_with_validation<'a>(
    &'a mut self,
    input: impl Read + Send + Sync + 'a,
    expected_uid: Option<String>,
  ) -> BoxFuture<'a, Result<Vec<GachaRecord>, Self::Error>> {
    async move {
      let uigf = UIGF::from_json(input)?;

      // Validation
      if let Some(uid) = expected_uid {
        if uid != uigf.info.uid {
          return Err(UIGFGachaConverterError::InconsistentUid {
            expected: uid,
            actual: uigf.info.uid,
          });
        }
      }

      // Modify the uid and lang values in this converter
      let converter = &mut self.converter;
      converter.uid.clone_from(&uigf.info.uid);
      converter.lang.clone_from(&uigf.info.lang);

      let records = converter.deconvert(uigf.list, &uigf.info)?;
      Ok(records)
    }
    .boxed()
  }
}

// Tests

#[cfg(test)]
mod tests {
  use std::fs::File;
  use std::path::PathBuf;

  use time::UtcOffset;

  use super::{
    GachaRecordsReader, GachaRecordsWriter, UIGFGachaConverterError, UIGFGachaRecordsReader,
    UIGFGachaRecordsWriter, UIGFVersion, UIGF,
  };
  use crate::models::{Business, AccountIdentifier, GachaRecord, GachaRecordRank};

  #[tokio::test]
  async fn test_writer() -> Result<(), UIGFGachaConverterError> {
    let uid = 100_000_001;
    let lang = "zh-cn";
    let record = GachaRecord {
      id: "1675850760000000000".into(),
      business: Business::GenshinImpact,
      uid: AccountIdentifier::try_from(uid).unwrap(),
      gacha_type: 400,
      gacha_id: None,
      rank_type: GachaRecordRank::Blue,
      count: 1,
      time: "2023-01-01 00:00:00".into(),
      lang: lang.to_owned(),
      name: "弹弓".into(),
      item_type: "武器".into(),
      item_id: "".into(),
    };

    let region_time_zone = UtcOffset::from_hms(8, 0, 0).unwrap();
    let mut writer =
      UIGFGachaRecordsWriter::new(uid.to_string(), lang.to_owned(), region_time_zone);

    let records = vec![record.clone()];
    let mut output = vec![];
    writer.write(records, &mut output).await?;

    // validation
    let uigf: UIGF = serde_json::from_slice(&output).unwrap();
    assert_eq!(uigf.info.uid, uid.to_string());
    assert_eq!(uigf.info.lang, lang);
    assert!(uigf.info.export_time.is_some());
    assert!(uigf.info.export_timestamp.is_some());
    assert_eq!(
      uigf.info.export_app.as_deref(),
      Some(UIGFGachaRecordsWriter::EXPORT_APP)
    );
    assert_eq!(
      uigf.info.export_app_version.as_deref(),
      Some(UIGFGachaRecordsWriter::EXPORT_APP_VERSION)
    );
    assert_eq!(uigf.info.uigf_version, UIGFVersion::CURRENT);
    assert_eq!(
      uigf.info.region_time_zone,
      Some(region_time_zone.whole_hours())
    );

    assert_eq!(uigf.list.len(), 1);
    let item = uigf.list.first().unwrap();
    assert_eq!(item.id, record.id);
    assert_eq!(item.uid, Some(record.uid.to_string()));
    assert_eq!(item.gacha_type, record.gacha_type.to_string());
    assert_eq!(item.rank_type, Some(u8::from(record.rank_type).to_string()));
    assert_eq!(item.count, Some(record.count.to_string()));
    assert_eq!(item.time, record.time);
    assert_eq!(item.lang, Some(record.lang));
    assert_eq!(item.name, Some(record.name));
    assert_eq!(item.item_type, Some(record.item_type));

    // auto dictionary
    assert_eq!(record.item_id, "");
    assert_eq!(item.item_id.as_deref(), Some("15304"));

    Ok(())
  }

  fn generate_uigf_json_str(
    version: &UIGFVersion,
    name: Option<&str>,
    item_type: Option<&str>,
    item_id: Option<&str>,
  ) -> String {
    fn option_or_null(s: Option<&str>) -> String {
      if let Some(s) = s {
        format!("\"{s}\"")
      } else {
        "null".into()
      }
    }

    format!(
      r#"
    {{
      "info": {{
        "uid": "100000001",
        "lang": "zh-cn",
        "export_time": "2023-12-05 20:00:00",
        "export_timestamp": 1701777600,
        "export_app": "some app",
        "export_app_version": "1.0.0",
        "uigf_version": "{}",
        "region_time_zone": 8
      }},
      "list": [
        {{
          "id": "1675850760000000000",
          "uid": "100000001",
          "gacha_type": "400",
          "rank_type": "3",
          "count": "1",
          "time": "2023-01-01 00:00:00",
          "lang": "zh-cn",
          "name": {},
          "item_type": {},
          "item_id": {},
          "uigf_gacha_type": "301"
        }}
      ]
    }}
    "#,
      version,
      option_or_null(name),
      option_or_null(item_type),
      option_or_null(item_id)
    )
  }

  #[tokio::test]
  async fn test_reader() -> Result<(), UIGFGachaConverterError> {
    let json = generate_uigf_json_str(
      &UIGFVersion::V2_4,
      Some("弹弓"),
      Some("武器"),
      Some("15304"),
    );

    let mut reader = UIGFGachaRecordsReader::new();
    let records = reader.read(json.as_bytes()).await?;

    assert_eq!(records.len(), 1);
    let record = records.first().unwrap();
    assert_eq!(record.id, "1675850760000000000");
    assert_eq!(record.business, Business::GenshinImpact);
    assert_eq!(record.uid, 100_000_001);
    assert_eq!(record.gacha_type, 400);
    assert_eq!(record.gacha_id, None);
    assert_eq!(record.rank_type, GachaRecordRank::Blue);
    assert_eq!(record.count, 1);
    assert_eq!(record.time, "2023-01-01 00:00:00");
    assert_eq!(record.lang, "zh-cn");
    assert_eq!(record.name, "弹弓");
    assert_eq!(record.item_type, "武器");
    assert_eq!(record.item_id, "15304");

    Ok(())
  }

  #[tokio::test]
  async fn test_reader_v2_4_required_item_id() {
    let json = generate_uigf_json_str(&UIGFVersion::V2_4, Some("弹弓"), Some("武器"), None);

    let mut reader = UIGFGachaRecordsReader::new();
    let result = reader.read(json.as_bytes()).await;

    assert!(result.is_err());
    assert!(result.is_err_and(|e| matches!(e, UIGFGachaConverterError::RequiredFields(_))));
  }

  #[tokio::test]
  async fn test_reader_v2_2() -> Result<(), UIGFGachaConverterError> {
    let json = generate_uigf_json_str(&UIGFVersion::V2_2, Some("弹弓"), Some("武器"), None);

    let mut reader = UIGFGachaRecordsReader::new();
    let records = reader.read(json.as_bytes()).await?;

    assert_eq!(records.len(), 1);
    let record = records.first().unwrap();
    assert_eq!(record.id, "1675850760000000000");
    assert_eq!(record.business, Business::GenshinImpact);
    assert_eq!(record.uid, 100_000_001);
    assert_eq!(record.gacha_type, 400);
    assert_eq!(record.gacha_id, None);
    assert_eq!(record.rank_type, GachaRecordRank::Blue);
    assert_eq!(record.count, 1);
    assert_eq!(record.time, "2023-01-01 00:00:00");
    assert_eq!(record.lang, "zh-cn");
    assert_eq!(record.name, "弹弓");
    assert_eq!(record.item_type, "武器");
    assert_eq!(record.item_id, "15304");

    Ok(())
  }

  #[tokio::test]
  async fn test_reader_v2_2_required_name_and_item_type() {
    let json = generate_uigf_json_str(&UIGFVersion::V2_2, None, None, None);

    let mut reader = UIGFGachaRecordsReader::new();
    let result = reader.read(json.as_bytes()).await;

    assert!(result.is_err());
    assert!(result.is_err_and(|e| matches!(e, UIGFGachaConverterError::RequiredFields(_))));
  }

  #[ignore = "Because the file is hard-coded, it is for manual testing only"]
  #[tokio::test]
  async fn test_reader_v2_2_local_file() {
    let path = PathBuf::from(std::env::var("USERPROFILE").unwrap())
      .join("Desktop")
      .join("tmp/HoYo.Gacha/HoYo.Gacha_原神祈愿记录_UIGF_20231108_222127.json");

    let file = File::open(path).unwrap();

    let mut reader = UIGFGachaRecordsReader::new();
    let result = reader.read(file).await;

    assert!(result.is_ok());
  }
}
