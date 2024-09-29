use std::future::Future;
use std::path::Path;
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;
use tracing::{error, info, warn};

use crate::error::ErrorDetails;
use crate::models::{Business, BusinessRegion, GachaMetadata, GachaRecord};

use super::{
  GachaRecordsReader, GachaRecordsWriter, GachaUrlError, LegacyUigfGachaRecordsReader,
  LegacyUigfGachaRecordsWriter, SrgfGachaRecordsReader, SrgfGachaRecordsWriter,
  UigfGachaRecordsReader, UigfGachaRecordsWriter,
};

// region: Gacha Records Fetcher Channel

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum GachaRecordsFetcherChannelFragment {
  Sleeping,
  Ready(u32),
  Pagination(usize),
  DataRef(usize),
  Data(Vec<GachaRecord>),
  Completed(u32),
  Finished,
}

#[allow(clippy::too_many_arguments)]
#[tracing::instrument(skip(callback))]
pub async fn create_gacha_records_fetcher_channel<F, Callback>(
  business: Business,
  region: BusinessRegion,
  uid: u32,
  gacha_url: String,
  gacha_type_and_last_end_id_mappings: Vec<(u32, Option<String>)>,
  callback: Callback,
) -> Result<(), Box<dyn ErrorDetails + Send + 'static>>
where
  F: Future<Output = Result<(), Box<dyn ErrorDetails + Send + 'static>>>,
  Callback: Fn(GachaRecordsFetcherChannelFragment) -> F,
{
  info!("Creating a Gacha Records Fetcher Channel");

  if gacha_type_and_last_end_id_mappings.is_empty() {
    warn!("Empty Gacha type and last end id mappings");
    return Ok(());
  }

  // Internal Abbreviations
  type Fragment = GachaRecordsFetcherChannelFragment;

  let (sender, mut receiver) = mpsc::channel(1);
  let task = tokio::spawn(async move {
    for (gacha_type, last_end_id) in gacha_type_and_last_end_id_mappings {
      pull_gacha_records(
        business,
        region,
        &sender,
        &gacha_url,
        &gacha_type,
        last_end_id.as_deref(),
      )
      .await
      .map_err(|error| Box::new(error.into_inner()) as _)?;
    }

    sender.send(Fragment::Finished).await.unwrap();
    Ok(())
  });

  while let Some(fragment) = receiver.recv().await {
    callback(fragment).await?;
  }

  match task.await {
    Ok(result) => {
      info!("Fetcher channel execution is finished");
      result
    }
    Err(err) => {
      error!("Error while fetcher channel join: {err}");
      Ok(())
    }
  }
}

#[tracing::instrument(skip_all, fields(?gacha_type, ?last_end_id))]
async fn pull_gacha_records(
  business: Business,
  region: BusinessRegion,
  sender: &mpsc::Sender<GachaRecordsFetcherChannelFragment>,
  gacha_url: &str,
  gacha_type: &u32,
  last_end_id: Option<&str>,
) -> Result<(), GachaUrlError> {
  // Internal Abbreviations
  type Fragment = GachaRecordsFetcherChannelFragment;

  info!(message = "Start pulling gacha records...");
  sender.send(Fragment::Ready(*gacha_type)).await.unwrap();

  const THRESHOLD: usize = 5;
  const WAIT_MOMENT_MILLIS: u64 = 500;

  let mut end_id = String::from("0");
  let mut pagination: usize = 0;
  loop {
    // Avoid visit too frequently
    if pagination > 1 && pagination % THRESHOLD == 0 {
      info!("One continuous request reached. Wait a moment...");
      sender.send(Fragment::Sleeping).await.unwrap();
      tokio::time::sleep(Duration::from_millis(WAIT_MOMENT_MILLIS)).await;
    }

    pagination += 1;
    info!("Start fetching page {pagination} data...");
    sender.send(Fragment::Pagination(pagination)).await.unwrap();

    if let Some(records) = super::gacha_url::fetch_gacha_records(
      business,
      region,
      gacha_url,
      Some(&format!("{}", *gacha_type)),
      Some(&end_id),
      None,
    )
    .await?
    {
      // The gacha records is always not empty.
      // See: `super::gacha_url::fetch_gacha_records`
      end_id.clone_from(&records.last().as_ref().unwrap().id);

      let mut should_break = false;
      let data = if let Some(last) = last_end_id {
        let mut temp = Vec::with_capacity(records.len());
        for record in records {
          if last.cmp(&record.id).is_lt() {
            temp.push(record);
          } else {
            should_break = true;
          }
        }
        temp
      } else {
        records
      };

      info!("Send {} pieces of data to the channel...", data.len());
      sender.send(Fragment::Data(data)).await.unwrap();

      if should_break {
        info!("Break loop. Data reaches the last end id: {last_end_id:?}");
        break;
      } else {
        continue;
      }
    }

    // None gacha records. break loop
    break;
  }

  // Completed gacha type
  info!("Gacha type {gacha_type} completed");
  sender.send(Fragment::Completed(*gacha_type)).await.unwrap();

  Ok(())
}

// endregion

// region: Gacha Records Import and Export

#[derive(Clone, Debug, Deserialize)]
pub enum GachaRecordsImporter {
  LegacyUigf(LegacyUigfGachaRecordsReader),
  Uigf(UigfGachaRecordsReader),
  Srgf(SrgfGachaRecordsReader),
}

impl GachaRecordsImporter {
  pub fn import(
    self,
    metadata: &GachaMetadata,
    input: impl AsRef<Path>,
  ) -> Result<Vec<GachaRecord>, Box<dyn ErrorDetails + 'static>> {
    match self {
      Self::LegacyUigf(reader) => reader
        .read_from_file(metadata, input)
        .map_err(|err| Box::new(err.into_inner()) as _),
      Self::Uigf(reader) => reader
        .read_from_file(metadata, input)
        .map_err(|err| Box::new(err.into_inner()) as _),
      Self::Srgf(reader) => reader
        .read_from_file(metadata, input)
        .map_err(|err| Box::new(err.into_inner()) as _),
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
  ) -> Result<(), Box<dyn ErrorDetails + 'static>> {
    match self {
      Self::LegacyUigf(writer) => writer
        .write(metadata, records, output)
        .map_err(|err| Box::new(err.into_inner()) as _),
      Self::Uigf(writer) => writer
        .write(metadata, records, output)
        .map_err(|err| Box::new(err.into_inner()) as _),
      Self::Srgf(writer) => writer
        .write(metadata, records, output)
        .map_err(|err| Box::new(err.into_inner()) as _),
    }
  }
}

// endregion
