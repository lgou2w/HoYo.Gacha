use std::path::PathBuf;
use std::time::Instant;

use hg_gamebiz::Uid;
use tauri::ipc::{Channel, IpcResponse, Response};
use tracing::debug;

use crate::business::fetcher::{self, FetchEventPayload, FetchOptions, GachaFetchError};
use crate::business::img_resolver;
use crate::business::metadata::TauriMetadataState;
use crate::business::stats::{AnalyzeContext, AnalyzeRecord, GachaStats};
use crate::business::url::{GachaUrl, GachaUrlError};
use crate::database::schemas::{AccountBusiness, GachaRecordQuestioner};
use crate::database::{DatabaseError, TauriDatabaseState};
use crate::error::AppError;

#[tauri::command]
#[tracing::instrument]
pub async fn business_from_webcaches_gacha_url(
  business: AccountBusiness,
  uid: u32,
  data_folder: PathBuf,
) -> Result<Option<GachaUrl>, AppError<GachaUrlError>> {
  // Generally, the uid should be valid, but we still need to check it here to avoid panics.
  let Some(uid) = Uid::parse(business.as_game(), uid) else {
    return Ok(None);
  };

  let url = GachaUrl::from_webcaches(business, uid, data_folder).await?;
  Ok(Some(url))
}

#[tauri::command]
#[tracing::instrument(skip(dirty))]
pub async fn business_from_dirty_gacha_url(
  business: AccountBusiness,
  uid: u32,
  dirty: String,
) -> Result<Option<GachaUrl>, AppError<GachaUrlError>> {
  // Generally, the uid should be valid, but we still need to check it here to avoid panics.
  let Some(uid) = Uid::parse(business.as_game(), uid) else {
    return Ok(None);
  };

  let url = GachaUrl::from_dirty(business, uid, dirty).await?;
  Ok(Some(url))
}

#[tauri::command]
#[tracing::instrument]
pub async fn business_resolve_image(
  business: AccountBusiness,
  item_category: String,
  item_id: u32,
  online: Option<bool>,
) -> Result<impl IpcResponse, String> {
  match img_resolver::resolve(business, item_category, item_id, online).await {
    Ok(None) => Ok(Response::new(vec![])),
    Ok(Some(data)) => Ok(Response::new(data)),
    Err(err) => Err(err.to_string()),
  }
}

#[tauri::command]
#[tracing::instrument(skip(metadata, database))]
pub async fn business_analyze_records(
  metadata: TauriMetadataState<'_>,
  database: TauriDatabaseState<'_>,
  business: AccountBusiness,
  uid: u32,
  custom_locale: Option<String>,
) -> Result<serde_json::Value, AppError<DatabaseError>> {
  debug!(message = "Preparing to analyze records");

  // Generally, the uid should be valid, but we still need to check it here to avoid panics.
  let Some(uid) = Uid::parse(business.as_game(), uid) else {
    return Ok(serde_json::Value::Null);
  };

  let records = database
    .interact(move |conn| conn.find_analysis_records(business, uid.value()))
    .await?;

  let start = Instant::now();
  let records: Vec<AnalyzeRecord<'_>> = records.iter().map(AnalyzeRecord::from).collect();

  let metadata = &*{ metadata.read().await };
  let stats = GachaStats::analyze(AnalyzeContext::new(
    Some(metadata),
    business,
    uid,
    &records,
    custom_locale.as_deref(),
  ));

  debug!(
    message = "Analysis completed",
    records = records.len(),
    elapsed = ?start.elapsed()
  );

  // SAFETY: GachaStats is serializable
  Ok(serde_json::to_value(stats).unwrap())
}

#[tauri::command]
// #[tracing::instrument(skip(database, metadata, event_channel))] // See: fetcher::fetch
pub async fn business_fetch_records(
  database: TauriDatabaseState<'_>,
  metadata: TauriMetadataState<'_>,
  event_channel: Channel<FetchEventPayload>,
  options: FetchOptions<'_>,
) -> Result<i64, AppError<GachaFetchError>> {
  let metadata = { &*metadata.read().await };
  let result = fetcher::fetch(&database, metadata, event_channel, options)
    .await
    .map_err(AppError::from);

  // Flash the window and beep if unfocused to
  // notify the user that the fetching is completed
  let _ = hg_ffi::flash_window(None);
  result
}
