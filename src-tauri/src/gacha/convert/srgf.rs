use std::io::{Read, Write};
use std::num::ParseIntError;

use futures_util::future::BoxFuture;
use futures_util::FutureExt;
use num_enum::TryFromPrimitive;
use serde::{Deserialize, Serialize};
use time::{OffsetDateTime, UtcOffset};

use super::{GachaConverter, GachaRecordsReader, GachaRecordsWriter};
use crate::constants;
use crate::gacha::dict::embedded as GachaDictionaryEmbedded;
use crate::models::{AccountBusiness, AccountIdentifier, GachaRecord, GachaRecordRank};

// SRGF for Honkai: Star Rail
// See: https://uigf.org/zh/standards/SRGF.html

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SRGFInfo {
  pub uid: String,
  pub lang: String,
  pub export_timestamp: Option<u64>,
  pub export_app: Option<String>,
  pub export_app_version: Option<String>,
  pub srgf_version: String,
  pub region_time_zone: i8,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SRGFItem {
  pub id: String,
  pub uid: Option<String>,
  pub gacha_type: String,
  pub gacha_id: String,
  pub item_id: String,
  pub count: Option<String>,
  pub time: String,
  pub name: Option<String>,
  pub lang: Option<String>,
  pub item_type: Option<String>,
  pub rank_type: Option<String>,
}

#[allow(clippy::upper_case_acronyms)]
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SRGF {
  pub info: SRGFInfo,
  pub list: Vec<SRGFItem>,
}

impl SRGF {
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

#[derive(Debug, thiserror::Error)]
pub enum SRGFGachaConverterError {
  #[error("Incompatible business exists for records: {0:?}")]
  IncompatibleBusiness(AccountBusiness),

  #[error("Inconsistent with expected uid. (Expected: {expected}, Actual: {actual})")]
  InconsistentUid { expected: String, actual: String },

  #[error("{0}")]
  IncorrectUid(String),

  #[error("Error while parsing field '{field}' as integer: {inner}")]
  FieldParseInt {
    field: &'static str,
    inner: ParseIntError,
  },

  #[error("Missing dictionary data: {0}")]
  MissingDictionary(String),

  #[error("Missing required fields: {0}")]
  RequiredFields(&'static str),

  #[error("Invalid rank type: {0}")]
  InvalidRankType(u8),

  #[error("Error while converting JSON serialization: {0}")]
  SerdeJson(#[from] serde_json::Error),
}

pub struct SRGFGachaConverter {
  pub uid: String,
  pub lang: String,
}

impl SRGFGachaConverter {
  const TARGET_BUSINESS: &'static AccountBusiness = &AccountBusiness::HonkaiStarRail;

  pub fn new(uid: String, lang: String) -> Self {
    Self { uid, lang }
  }
}

impl GachaConverter for SRGFGachaConverter {
  type Error = SRGFGachaConverterError;
  type Provided = Vec<SRGFItem>;
  type Context = SRGFInfo;

  fn convert(
    &self,
    records: Vec<GachaRecord>,
    _context: &Self::Context,
  ) -> Result<Self::Provided, Self::Error> {
    let mut provided = Vec::with_capacity(records.len());
    for record in records {
      if record.business != *Self::TARGET_BUSINESS {
        return Err(SRGFGachaConverterError::IncompatibleBusiness(
          record.business,
        ));
      }

      let gacha_id = record
        .gacha_id
        .ok_or(SRGFGachaConverterError::RequiredFields("gacha_id"))?
        .to_string();

      provided.push(SRGFItem {
        id: record.id,
        uid: Some(record.uid.to_string()),
        gacha_type: record.gacha_type.to_string(),
        gacha_id,
        item_id: record.item_id,
        count: Some(record.count.to_string()),
        time: record.time,
        name: Some(record.name),
        lang: Some(record.lang),
        item_type: Some(record.item_type),
        rank_type: Some(u8::from(record.rank_type).to_string()),
      })
    }

    Ok(provided)
  }

  fn deconvert(
    &self,
    provided: Self::Provided,
    _context: &Self::Context,
  ) -> Result<Vec<GachaRecord>, Self::Error> {
    let mut records = Vec::with_capacity(provided.len());
    for provide in provided {
      let uid: AccountIdentifier = provide
        .uid
        .as_deref()
        .unwrap_or(&self.uid)
        .parse::<u32>()
        .map_err(|inner| SRGFGachaConverterError::FieldParseInt {
          field: "uid",
          inner,
        })?
        .try_into()
        .map_err(SRGFGachaConverterError::IncorrectUid)?;

      let gacha_type = provide.gacha_type.parse::<u32>().map_err(|inner| {
        SRGFGachaConverterError::FieldParseInt {
          field: "gacha_type",
          inner,
        }
      })?;

      let gacha_id = provide.gacha_id.parse::<u32>().map_err(|inner| {
        SRGFGachaConverterError::FieldParseInt {
          field: "gacha_id",
          inner,
        }
      })?;

      let count = provide
        .count
        .as_deref()
        .unwrap_or("1")
        .parse::<u32>()
        .map_err(|inner| SRGFGachaConverterError::FieldParseInt {
          field: "count",
          inner,
        })?;

      let lang = provide.lang.unwrap_or(self.lang.clone());
      let item_id = provide.item_id;

      let name: String;
      let item_type: String;
      let rank_type: u8;
      if provide.name.is_none() || provide.item_type.is_none() || provide.rank_type.is_none() {
        let entry = GachaDictionaryEmbedded::id(Self::TARGET_BUSINESS, &lang, &item_id).ok_or(
          SRGFGachaConverterError::MissingDictionary(format!("lang({lang}), item_id({item_id})")),
        )?;
        name = provide.name.unwrap_or(entry.item_name.to_string());
        item_type = provide.item_type.unwrap_or(entry.category_name.to_owned());
        rank_type = provide
          .rank_type
          .map(|v| {
            v.parse::<u8>()
              .map_err(|inner| SRGFGachaConverterError::FieldParseInt {
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
          SRGFGachaConverterError::FieldParseInt {
            field: "rank_type",
            inner,
          }
        })?;
      }

      let rank_type = GachaRecordRank::try_from_primitive(rank_type)
        .map_err(|_| SRGFGachaConverterError::InvalidRankType(rank_type))?;

      records.push(GachaRecord {
        id: provide.id,
        business: *Self::TARGET_BUSINESS,
        uid,
        gacha_type,
        gacha_id: Some(gacha_id),
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

pub struct SRGFGachaRecordsWriter {
  converter: SRGFGachaConverter,
  region_time_zone: UtcOffset,
  pretty: bool,
}

impl SRGFGachaRecordsWriter {
  pub const SRGF_VERSION: &'static str = "v1.0";
  pub const EXPORT_APP: &'static str = constants::ID;
  pub const EXPORT_APP_VERSION: &'static str = constants::VERSION;

  pub fn new(uid: String, lang: String, region_time_zone: UtcOffset) -> Self {
    Self {
      converter: SRGFGachaConverter::new(uid, lang),
      region_time_zone,
      pretty: false,
    }
  }

  pub fn pretty(&mut self, pretty: bool) -> &mut Self {
    self.pretty = pretty;
    self
  }

  fn construct_srgf_info(&self) -> SRGFInfo {
    let uid = self.converter.uid.clone();
    let lang = self.converter.lang.clone();
    let now_utc = OffsetDateTime::now_utc();
    let region_time = now_utc.to_offset(self.region_time_zone);
    let export_timestamp = region_time.unix_timestamp() as u64;

    SRGFInfo {
      uid,
      lang,
      export_timestamp: Some(export_timestamp),
      export_app: Some(Self::EXPORT_APP.to_owned()),
      export_app_version: Some(Self::EXPORT_APP_VERSION.to_owned()),
      srgf_version: Self::SRGF_VERSION.to_owned(),
      region_time_zone: self.region_time_zone.whole_hours(),
    }
  }
}

impl GachaRecordsWriter for SRGFGachaRecordsWriter {
  type Error = <SRGFGachaConverter as GachaConverter>::Error;

  fn write<'a>(
    &'a mut self,
    records: Vec<GachaRecord>,
    output: impl Write + Send + Sync + 'a,
  ) -> BoxFuture<'a, Result<(), Self::Error>> {
    async move {
      let info = self.construct_srgf_info();
      let list = self.converter.convert(records, &info)?;

      let srgf = SRGF { info, list };
      srgf.to_json(output, self.pretty)?;

      Ok(())
    }
    .boxed()
  }
}

// Reader

pub struct SRGFGachaRecordsReader {
  converter: SRGFGachaConverter,
}

impl SRGFGachaRecordsReader {
  pub fn new() -> Self {
    Self {
      // Changes on import based on the value of UIGFInfo
      converter: SRGFGachaConverter::new(String::default(), String::default()),
    }
  }
}

impl GachaRecordsReader for SRGFGachaRecordsReader {
  type Error = <SRGFGachaConverter as GachaConverter>::Error;

  fn read_with_validation<'a>(
    &'a mut self,
    input: impl Read + Send + Sync + 'a,
    expected_uid: Option<String>,
  ) -> BoxFuture<'a, Result<Vec<GachaRecord>, Self::Error>> {
    async move {
      let srgf = SRGF::from_json(input)?;

      // Validation
      if let Some(uid) = expected_uid {
        if uid != srgf.info.uid {
          return Err(SRGFGachaConverterError::InconsistentUid {
            expected: uid,
            actual: srgf.info.uid,
          });
        }
      }

      // Modify the uid and lang values in this converter
      let converter = &mut self.converter;
      converter.uid.clone_from(&srgf.info.uid);
      converter.lang.clone_from(&srgf.info.lang);

      let records = converter.deconvert(srgf.list, &srgf.info)?;
      Ok(records)
    }
    .boxed()
  }
}

// Tests

#[cfg(test)]
mod tests {
  use time::UtcOffset;

  use super::{
    GachaRecordsReader, GachaRecordsWriter, SRGFGachaConverterError, SRGFGachaRecordsReader,
    SRGFGachaRecordsWriter, SRGF,
  };
  use crate::models::{AccountBusiness, AccountIdentifier, GachaRecord, GachaRecordRank};

  #[tokio::test]
  async fn test_writer() -> Result<(), SRGFGachaConverterError> {
    let uid = 100_000_001;
    let lang = "zh-cn";
    let record = GachaRecord {
      id: "1683774600000000000".into(),
      business: AccountBusiness::HonkaiStarRail,
      uid: AccountIdentifier::try_from(uid).unwrap(),
      gacha_type: 1,
      gacha_id: Some(1001),
      rank_type: GachaRecordRank::Blue,
      count: 1,
      time: "2023-01-01 00:00:00".into(),
      lang: lang.to_owned(),
      name: "灵钥".into(),
      item_type: "光锥".into(),
      item_id: "20013".into(),
    };

    let region_time_zone = UtcOffset::from_hms(8, 0, 0).unwrap();
    let mut writer =
      SRGFGachaRecordsWriter::new(uid.to_string(), lang.to_owned(), region_time_zone);

    let records = vec![record.clone()];
    let mut output = vec![];
    writer.write(records, &mut output).await?;

    // validation
    let srgf: SRGF = serde_json::from_slice(&output).unwrap();
    assert_eq!(srgf.info.uid, uid.to_string());
    assert_eq!(srgf.info.lang, lang);
    assert!(srgf.info.export_timestamp.is_some());
    assert_eq!(
      srgf.info.export_app.as_deref(),
      Some(SRGFGachaRecordsWriter::EXPORT_APP)
    );
    assert_eq!(
      srgf.info.export_app_version.as_deref(),
      Some(SRGFGachaRecordsWriter::EXPORT_APP_VERSION)
    );
    assert_eq!(srgf.info.srgf_version, SRGFGachaRecordsWriter::SRGF_VERSION);
    assert_eq!(srgf.info.region_time_zone, region_time_zone.whole_hours());

    assert_eq!(srgf.list.len(), 1);
    let item = srgf.list.first().unwrap();
    assert_eq!(item.id, record.id);
    assert_eq!(item.uid, Some(record.uid.to_string()));
    assert_eq!(item.gacha_type, record.gacha_type.to_string());
    assert_eq!(item.rank_type, Some(u8::from(record.rank_type).to_string()));
    assert_eq!(item.count, Some(record.count.to_string()));
    assert_eq!(item.time, record.time);
    assert_eq!(item.lang, Some(record.lang));
    assert_eq!(item.name, Some(record.name));
    assert_eq!(item.item_type, Some(record.item_type));
    assert_eq!(item.item_id, record.item_id);

    Ok(())
  }

  #[tokio::test]
  async fn test_reader() -> Result<(), SRGFGachaConverterError> {
    let json = r#"
    {
      "info": {
        "uid": "100000001",
        "lang": "zh-cn",
        "export_timestamp": 1701777600,
        "export_app": "some app",
        "export_app_version": "1.0.0",
        "srgf_version": "v1.0",
        "region_time_zone": 8
      },
      "list": [
        {
          "id": "1683774600000000000",
          "uid": "100000001",
          "gacha_type": "1",
          "gacha_id": "1003",
          "rank_type": "3",
          "count": "1",
          "time": "2023-01-01 00:00:00",
          "lang": "zh-cn",
          "name": "灵钥",
          "item_type": "光锥",
          "item_id": "20013"
        }
      ]
    }
    "#;

    let mut reader = SRGFGachaRecordsReader::new();
    let records = reader.read(json.as_bytes()).await?;

    assert_eq!(records.len(), 1);
    let record = records.first().unwrap();
    assert_eq!(record.id, "1683774600000000000");
    assert_eq!(record.business, AccountBusiness::HonkaiStarRail);
    assert_eq!(record.uid, 100_000_001);
    assert_eq!(record.gacha_type, 1);
    assert_eq!(record.gacha_id, Some(1003));
    assert_eq!(record.rank_type, GachaRecordRank::Blue);
    assert_eq!(record.count, 1);
    assert_eq!(record.time, "2023-01-01 00:00:00");
    assert_eq!(record.lang, "zh-cn");
    assert_eq!(record.name, "灵钥");
    assert_eq!(record.item_type, "光锥");
    assert_eq!(record.item_id, "20013");

    Ok(())
  }
}
