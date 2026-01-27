use std::path::PathBuf;
use std::time::Instant;

use hg_game_biz::Uid;
use tauri::ipc::{Channel, IpcResponse};
use tracing::debug;

use crate::bootstrap::{TauriDatabaseState, TauriMetadataState};
use crate::business::converters::{RecordsReaderFactory, RecordsWriterFactory};
use crate::business::data_folder::{
  DataFolder, DataFolderLocator, DataFolderLocatorFactory, LocateDataFolderError,
};
use crate::business::fetcher::{FetchEventPayload, FetchRecordError, GachaRecordSaveToDatabase};
use crate::business::gacha_url::{GachaUrl, GachaUrlError};
use crate::business::image_resolver::ImageResolver;
use crate::business::prettized::PrettizedRecords;
use crate::database::DatabaseError;
use crate::database::legacy::{LegacyMigration, LegacyMigrationError};
use crate::database::schemas::{
  AccountBusiness, GachaRecordQuestioner, GachaRecordSaveOnConflict, GachaRecordSaver,
};
use crate::error::{AppError, BoxDynErrorDetails, ErrorDetails};

#[tauri::command]
pub fn business_validate_uid(business: AccountBusiness, uid: u32) -> Option<&'static str> {
  Uid::validate(business.as_game(), uid).map(|res| res.game_biz().server().as_str())
}

#[tauri::command]
pub async fn business_locate_data_folder(
  business: AccountBusiness,
  uid: u32,
  factory: DataFolderLocatorFactory,
) -> Result<DataFolder, AppError<LocateDataFolderError>> {
  factory.locate(business, uid).await.map_err(Into::into)
}

#[tauri::command]
pub async fn business_from_webcaches_gacha_url(
  business: AccountBusiness,
  uid: u32,
  data_folder: PathBuf,
) -> Result<GachaUrl, AppError<GachaUrlError>> {
  GachaUrl::from_webcaches(business, uid, data_folder).await
}

#[tauri::command]
pub async fn business_from_dirty_gacha_url(
  business: AccountBusiness,
  uid: u32,
  dirty: String,
) -> Result<GachaUrl, AppError<GachaUrlError>> {
  GachaUrl::from_dirty(business, uid, dirty).await
}

#[tauri::command]
pub async fn business_resolve_image_mime() -> &'static str {
  ImageResolver::MIME
}

#[tauri::command]
pub async fn business_resolve_image(
  business: AccountBusiness,
  item_category: String,
  item_id: u32,
) -> Result<impl IpcResponse, String> {
  ImageResolver::resolve(business, item_category, item_id).await
}

#[tauri::command]
#[tracing::instrument(skip(database, metadata))]
pub async fn business_pretty_records(
  database: TauriDatabaseState<'_>,
  metadata: TauriMetadataState<'_>,
  business: AccountBusiness,
  uid: u32,
  custom_locale: Option<String>,
) -> Result<serde_json::Value, AppError<DatabaseError>> {
  let metadata = { &*metadata.read().await };
  let records = database.find_gacha_records(business, uid).await?;

  let start = Instant::now();
  let prettized = PrettizedRecords::pretty(
    metadata,
    business,
    uid,
    &records[..],
    custom_locale.as_deref(),
  );

  debug!(
    message = "Prettized records computed",
    elapsed = ?start.elapsed()
  );

  let value = serde_json::to_value(&prettized).unwrap(); // SAFETY
  Ok(value)
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub async fn business_fetch_records(
  database: TauriDatabaseState<'_>,
  metadata: TauriMetadataState<'_>,
  business: AccountBusiness,
  uid: u32,
  gacha_url: String,
  gacha_type_and_last_end_ids: Vec<(u32, Option<&str>)>,
  event_channel: Channel<FetchEventPayload>,
  save_to_database: Option<GachaRecordSaveToDatabase>,
  save_on_conflict: Option<GachaRecordSaveOnConflict>,
) -> Result<i64, AppError<FetchRecordError>> {
  let metadata = { &*metadata.read().await };
  crate::business::fetcher::fetch(
    &database,
    metadata,
    business,
    uid,
    gacha_url,
    gacha_type_and_last_end_ids,
    event_channel,
    save_to_database,
    save_on_conflict,
  )
  .await
}

#[tauri::command]
pub async fn business_legacy_migration(
  database: TauriDatabaseState<'_>,
  metadata: TauriMetadataState<'_>,
  legacy: Option<PathBuf>,
) -> Result<LegacyMigration, AppError<LegacyMigrationError>> {
  let metadata = { &*metadata.read().await };
  LegacyMigration::migrate(&database, metadata, legacy)
    .await
    .map_err(Into::into)
}

#[tauri::command]
#[tracing::instrument(skip(database, metadata))]
pub async fn business_export_records(
  database: TauriDatabaseState<'_>,
  metadata: TauriMetadataState<'_>,
  writer: RecordsWriterFactory,
  output: PathBuf,
) -> Result<PathBuf, BoxDynErrorDetails> {
  let metadata = { &*metadata.read().await };
  let records = match &writer {
    RecordsWriterFactory::ClassicUigf(_)
    | RecordsWriterFactory::ClassicSrgf(_)
    | RecordsWriterFactory::Csv(_) => {
      let (business, uid) = match &writer {
        RecordsWriterFactory::ClassicUigf(writer) => (AccountBusiness::GenshinImpact, writer.uid),
        RecordsWriterFactory::ClassicSrgf(writer) => (AccountBusiness::HonkaiStarRail, writer.uid),
        RecordsWriterFactory::Csv(writer) => (writer.business, writer.uid),
        _ => unreachable!(), // SAFETY
      };

      database
        .find_gacha_records(business, uid)
        .await
        .map_err(ErrorDetails::boxed)?
    }
    RecordsWriterFactory::Uigf(writer) => {
      let mut records = Vec::new();

      for (business, uids) in &writer.businesses {
        for uid in uids.keys() {
          records.extend(
            database
              .find_gacha_records(*business, *uid)
              .await
              .map_err(ErrorDetails::boxed)?,
          );
        }
      }

      records
    }
  };

  writer.write(metadata, records, output)
}

#[tauri::command]
#[tracing::instrument(skip(database, metadata, progress_channel))]
pub async fn business_import_records(
  database: TauriDatabaseState<'_>,
  metadata: TauriMetadataState<'_>,
  reader: RecordsReaderFactory,
  input: PathBuf,
  save_on_conflict: Option<GachaRecordSaveOnConflict>,
  progress_channel: Channel<u64>,
) -> Result<u64, BoxDynErrorDetails> {
  let metadata = { &*metadata.read().await };
  let records = reader.read(metadata, input)?;

  GachaRecordSaver::new(
    &records[..],
    save_on_conflict.unwrap_or_default(),
    Some(|progress| {
      let _ = progress_channel.send(progress);
    }),
  )
  .save(&database)
  .await
  .map_err(ErrorDetails::boxed)
}
