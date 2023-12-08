use std::collections::HashMap;
use std::io::{Read, Write};
use std::num::ParseIntError;

use futures_util::future::BoxFuture;
use futures_util::FutureExt;
use num_enum::TryFromPrimitive;
use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use time::format_description::FormatItem;
use time::macros::format_description;
use time::{OffsetDateTime, UtcOffset};

use super::{GachaConverter, GachaRecordsReader, GachaRecordsWriter};
use crate::constants;
use crate::database::{AccountFacet, GachaRecord, GachaRecordRankType};
use crate::gacha::dict::embedded as GachaDictionaryEmbedded;

// UIGF for Genshin Impact
// See: https://uigf.org/zh/standards/UIGF.html

#[derive(Clone, Serialize, Deserialize)]
pub struct UIGFInfo {
  pub uid: String,
  pub lang: String,
  pub export_time: Option<String>,
  pub export_timestamp: Option<u64>,
  pub export_app: Option<String>,
  pub export_app_version: Option<String>,
  pub uigf_version: String,
  pub region_time_zone: Option<i8>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct UIGFItem {
  pub id: String,
  pub uid: Option<String>,
  pub gacha_type: String,
  pub item_id: String,
  pub count: Option<String>,
  pub time: String,
  pub name: Option<String>,
  pub lang: Option<String>,
  pub item_type: Option<String>,
  pub rank_type: Option<String>,
  pub uigf_gacha_type: String,
}

#[allow(clippy::upper_case_acronyms)]
#[derive(Clone, Serialize, Deserialize)]
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
 */
pub static UIGF_GACHA_TYPE_MAPPINGS: Lazy<HashMap<u32, &str>> = Lazy::new(|| {
  let mut m = HashMap::with_capacity(5);
  m.insert(100, "100");
  m.insert(200, "200");
  m.insert(301, "301");
  m.insert(400, "301"); // 400 -> 301
  m.insert(302, "302");
  m
});

#[derive(Debug, thiserror::Error)]
pub enum UIGFGachaConverterError {
  #[error("Incompatible facet exists for records: {0:?}")]
  IncompatibleFacet(AccountFacet),

  #[error("Error while parsing field '{field}' as integer: {inner}")]
  FieldParseInt {
    field: &'static str,
    inner: ParseIntError,
  },

  #[error("Unsupported gacha type: {0}")]
  UnsupportedGachaType(u32),

  #[error("Missing dictionary data: {0}")]
  MissingDictionary(String),

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
  const TARGET_FACET: &'static AccountFacet = &AccountFacet::GenshinImpact;

  pub fn new(uid: String, lang: String) -> Self {
    Self { uid, lang }
  }
}

impl GachaConverter for UIGFGachaConverter {
  type Error = UIGFGachaConverterError;
  type Provided = Vec<UIGFItem>;

  fn convert(&self, records: Vec<GachaRecord>) -> Result<Self::Provided, Self::Error> {
    let mut provided = Vec::with_capacity(records.len());
    for record in records {
      if record.facet != *Self::TARGET_FACET {
        return Err(UIGFGachaConverterError::IncompatibleFacet(record.facet));
      }

      let uigf_gacha_type = UIGF_GACHA_TYPE_MAPPINGS
        .get(&record.gacha_type)
        .ok_or(UIGFGachaConverterError::UnsupportedGachaType(
          record.gacha_type,
        ))?
        .to_string();

      let item_id = if let Some(item_id) = record.item_id {
        item_id
      } else {
        GachaDictionaryEmbedded::name(Self::TARGET_FACET, &self.lang, &record.name)
          .ok_or(UIGFGachaConverterError::MissingDictionary(format!(
            "lang({}), name({})",
            self.lang, record.name
          )))?
          .item_id
          .to_owned()
      };

      provided.push(UIGFItem {
        id: record.id,
        uid: Some(record.uid.to_string()),
        gacha_type: record.gacha_type.to_string(),
        item_id,
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

  fn deconvert(&self, provided: Self::Provided) -> Result<Vec<GachaRecord>, Self::Error> {
    let mut records = Vec::with_capacity(provided.len());
    for provide in provided {
      let uid = provide
        .uid
        .as_deref()
        .unwrap_or(&self.uid)
        .parse::<u32>()
        .map_err(|inner| UIGFGachaConverterError::FieldParseInt {
          field: "uid",
          inner,
        })?;

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
      let item_id = provide.item_id;

      let name: String;
      let item_type: String;
      let rank_type: u8;
      if provide.name.is_none() || provide.item_type.is_none() || provide.rank_type.is_none() {
        let entry = GachaDictionaryEmbedded::id(Self::TARGET_FACET, &lang, &item_id).ok_or(
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

      let rank_type = GachaRecordRankType::try_from_primitive(rank_type)
        .map_err(|_| UIGFGachaConverterError::InvalidRankType(rank_type))?;

      records.push(GachaRecord {
        id: provide.id,
        facet: *Self::TARGET_FACET,
        uid,
        gacha_type,
        gacha_id: None,
        rank_type,
        count,
        time: provide.time,
        lang,
        name,
        item_type,
        item_id: Some(item_id),
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

// TODO: Support v2.2

impl UIGFGachaRecordsWriter {
  pub const UIGF_VERSION: &'static str = "v2.4";
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

  pub fn pretty(&mut self) -> &mut Self {
    self.pretty = true;
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
      uigf_version: Self::UIGF_VERSION.to_owned(),
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
      let list = self.converter.convert(records)?;

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

  fn read<'a>(
    &'a mut self,
    input: impl Read + Send + Sync + 'a,
  ) -> BoxFuture<'a, Result<Vec<GachaRecord>, Self::Error>> {
    async move {
      let uigf = UIGF::from_json(input)?;

      // Modify the uid and lang values in this converter
      let converter = &mut self.converter;
      converter.uid = uigf.info.uid;
      converter.lang = uigf.info.lang;

      let records = converter.deconvert(uigf.list)?;
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
    GachaRecordsReader, GachaRecordsWriter, UIGFGachaConverterError, UIGFGachaRecordsReader,
    UIGFGachaRecordsWriter, UIGF,
  };
  use crate::database::{AccountFacet, GachaRecord, GachaRecordRankType};

  #[tokio::test]
  async fn test_writer() -> Result<(), UIGFGachaConverterError> {
    let uid = 100_000_001;
    let lang = "zh-cn";
    let record = GachaRecord {
      id: "1675850760000000000".into(),
      facet: AccountFacet::GenshinImpact,
      uid,
      gacha_type: 400,
      gacha_id: None,
      rank_type: GachaRecordRankType::Blue,
      count: 1,
      time: "2023-01-01 00:00:00".into(),
      lang: lang.to_owned(),
      name: "弹弓".into(),
      item_type: "武器".into(),
      item_id: None,
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
    assert_eq!(uigf.info.uigf_version, UIGFGachaRecordsWriter::UIGF_VERSION);
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

    assert_eq!(record.item_id, None);
    assert_eq!(item.item_id, "15304"); // auto dictionary

    Ok(())
  }

  #[tokio::test]
  async fn test_reader() -> Result<(), UIGFGachaConverterError> {
    let json = r#"
    {
      "info": {
        "uid": "100000001",
        "lang": "zh-cn",
        "export_time": "2023-12-05 20:00:00",
        "export_timestamp": 1701777600,
        "export_app": "some app",
        "export_app_version": "1.0.0",
        "uigf_version": "v2.4",
        "region_time_zone": 8
      },
      "list": [
        {
          "id": "1675850760000000000",
          "uid": "100000001",
          "gacha_type": "400",
          "rank_type": "3",
          "count": "1",
          "time": "2023-01-01 00:00:00",
          "lang": "zh-cn",
          "name": "弹弓",
          "item_type": "武器",
          "item_id": "15304",
          "uigf_gacha_type": "301"
        }
      ]
    }
    "#;

    let mut reader = UIGFGachaRecordsReader::new();
    let records = reader.read(json.as_bytes()).await?;

    assert_eq!(records.len(), 1);
    let record = records.first().unwrap();
    assert_eq!(record.id, "1675850760000000000");
    assert_eq!(record.facet, AccountFacet::GenshinImpact);
    assert_eq!(record.uid, 100_000_001);
    assert_eq!(record.gacha_type, 400);
    assert_eq!(record.gacha_id, None);
    assert_eq!(record.rank_type, GachaRecordRankType::Blue);
    assert_eq!(record.count, 1);
    assert_eq!(record.time, "2023-01-01 00:00:00");
    assert_eq!(record.lang, "zh-cn");
    assert_eq!(record.name, "弹弓");
    assert_eq!(record.item_type, "武器");
    assert_eq!(record.item_id.as_deref(), Some("15304"));

    Ok(())
  }

  #[ignore = "Not yet compatible with UIGF v2.2"]
  #[tokio::test]
  async fn test_reader_v2_2() -> Result<(), UIGFGachaConverterError> {
    // TODO: UIGF v2.2
    //  `item_id`   : is null or empty string
    //  `name`      : must not be null
    //  `item_type` : must not be null
    let json = r#"
    {
      "info": {
        "uid": "100000001",
        "lang": "zh-cn",
        "export_time": "2023-12-05 20:00:00",
        "export_timestamp": 1701777600,
        "export_app": "some app",
        "export_app_version": "1.0.0",
        "uigf_version": "v2.2"
      },
      "list": [
        {
          "id": "1675850760000000000",
          "uid": "100000001",
          "gacha_type": "400",
          "rank_type": "3",
          "count": "1",
          "time": "2023-01-01 00:00:00",
          "lang": "zh-cn",
          "name": "弹弓",
          "item_type": "武器",
          "item_id": null,
          "uigf_gacha_type": "301"
        }
      ]
    }
    "#;

    let mut reader = UIGFGachaRecordsReader::new();
    let records = reader.read(json.as_bytes()).await?;

    assert_eq!(records.len(), 1);
    let record = records.first().unwrap();
    assert_eq!(record.id, "1675850760000000000");
    assert_eq!(record.facet, AccountFacet::GenshinImpact);
    assert_eq!(record.uid, 100_000_001);
    assert_eq!(record.gacha_type, 400);
    assert_eq!(record.gacha_id, None);
    assert_eq!(record.rank_type, GachaRecordRankType::Blue);
    assert_eq!(record.count, 1);
    assert_eq!(record.time, "2023-01-01 00:00:00");
    assert_eq!(record.lang, "zh-cn");
    assert_eq!(record.name, "弹弓");
    assert_eq!(record.item_type, "武器");
    assert_eq!(record.item_id.as_deref(), Some("15304"));

    Ok(())
  }
}
