use tauri::plugin::{Builder as TauriPluginBuilder, TauriPlugin};
use tauri::{generate_handler, Wry};

pub struct GachaConvertPluginBuilder;

impl GachaConvertPluginBuilder {
  const PLUGIN_NAME: &'static str = "hg_gacha_convert";

  pub fn new() -> Self {
    Self
  }

  pub fn build(self) -> TauriPlugin<Wry> {
    TauriPluginBuilder::new(Self::PLUGIN_NAME)
      .invoke_handler(generate_handler![
        handler::export_gacha_records,
        handler::import_gacha_records
      ])
      .build()
  }
}

mod handler {
  use std::fs::File;

  use serde::ser::SerializeStruct;
  use serde::{Serialize, Serializer};
  use time::macros::offset;
  use time::UtcOffset;

  use crate::database::{
    AccountFacet, AccountServer, DatabaseError, DatabaseGachaRecordAdditions, DatabasePluginState,
    GachaRecordQuestioner,
  };
  use crate::gacha::convert::srgf::{
    SRGFGachaConverterError, SRGFGachaRecordsReader, SRGFGachaRecordsWriter,
  };
  use crate::gacha::convert::uigf::{
    UIGFGachaConverterError, UIGFGachaRecordsReader, UIGFGachaRecordsWriter,
  };
  use crate::gacha::convert::{GachaRecordsReader, GachaRecordsWriter};

  #[derive(Debug, thiserror::Error)]
  pub enum GachaConvertError {
    #[error("Error while creating output file: {0}")]
    CreateOutput(std::io::Error),

    #[error("Error while opening input file: {0}")]
    OpenInput(std::io::Error),

    #[error("Error while operating database: {0}")]
    Database(#[from] DatabaseError),

    #[error(transparent)]
    UIGFGachaConverter(#[from] UIGFGachaConverterError),

    #[error(transparent)]
    SRGFGachaConverter(#[from] SRGFGachaConverterError),
  }

  impl Serialize for GachaConvertError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
      S: Serializer,
    {
      let mut state = serializer.serialize_struct("Error", 2)?;
      state.serialize_field("identifier", stringify!(GachaConvertError))?;
      state.serialize_field("message", &self.to_string())?;
      state.end()
    }
  }

  #[tauri::command]
  pub async fn export_gacha_records(
    database: DatabasePluginState<'_>,
    facet: AccountFacet,
    uid: u32,
    output: String,
    pretty: Option<bool>,
  ) -> Result<(), GachaConvertError> {
    let output = File::create(output).map_err(GachaConvertError::CreateOutput)?;
    let gacha_records = GachaRecordQuestioner
      .find_many_by_facet_and_uid(facet, uid, None)
      .fetch_all(database.executor())
      .await
      .map_err(DatabaseError::from)?;

    if gacha_records.is_empty() {
      return Ok(());
    }

    let (uid, lang) = gacha_records
      .first()
      .map(|v| (v.uid, v.lang.clone()))
      .unwrap();

    const OFFSET_AMERICA: UtcOffset = offset!(-05:00:00);
    const OFFSET_EUROPE: UtcOffset = offset!(+01:00:00);
    const OFFSET_COMMON: UtcOffset = offset!(+08:00:00);

    let region_time_zone = match uid.detect_server() {
      Some(AccountServer::USA) => OFFSET_AMERICA,
      Some(AccountServer::Euro) => OFFSET_EUROPE,
      _ => OFFSET_COMMON,
    };

    match facet {
      AccountFacet::GenshinImpact => {
        UIGFGachaRecordsWriter::new(uid.to_string(), lang, region_time_zone)
          .pretty(pretty.unwrap_or(false))
          .write(gacha_records, output)
          .await?;
      }
      AccountFacet::HonkaiStarRail => {
        SRGFGachaRecordsWriter::new(uid.to_string(), lang, region_time_zone)
          .pretty(pretty.unwrap_or(false))
          .write(gacha_records, output)
          .await?;
      }
    };

    Ok(())
  }

  #[tauri::command]
  pub async fn import_gacha_records(
    database: DatabasePluginState<'_>,
    facet: AccountFacet,
    uid: u32,
    input: String,
  ) -> Result<u64, GachaConvertError> {
    let input = File::open(input).map_err(GachaConvertError::OpenInput)?;
    let gacha_records = match facet {
      AccountFacet::GenshinImpact => {
        UIGFGachaRecordsReader::new()
          .read_with_validation(input, Some(uid.to_string()))
          .await?
      }
      AccountFacet::HonkaiStarRail => {
        SRGFGachaRecordsReader::new()
          .read_with_validation(input, Some(uid.to_string()))
          .await?
      }
    };

    let changes = database.save_gacha_records(gacha_records).await?;
    Ok(changes)
  }
}
