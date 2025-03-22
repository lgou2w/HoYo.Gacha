use std::time::Duration;

use serde::Serialize;
use tauri::{Emitter, WebviewWindow};
use tokio::sync::mpsc;
use tracing::{error, info, warn};

use crate::error::{Error, ErrorDetails};
use crate::models::{Business, BusinessRegion, GachaRecord};

use super::GachaUrlError;

#[derive(Debug, Serialize)]
#[serde(rename_all = "PascalCase")] // Enum name
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
#[tracing::instrument(skip(window))]
pub async fn create_gacha_records_fetcher_channel(
  business: Business,
  region: BusinessRegion,
  uid: u32,
  gacha_url: String,
  gacha_type_and_last_end_id_mappings: Vec<(u32, Option<String>)>,
  window: WebviewWindow,
  event_channel: Option<String>,
) -> Result<Option<Vec<GachaRecord>>, Box<dyn ErrorDetails + Send + 'static>> {
  info!("Creating a Gacha Records Fetcher Channel");

  if gacha_type_and_last_end_id_mappings.is_empty() {
    warn!("Empty Gacha type and last end id mappings");
    return Ok(None);
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
      .map_err(Error::boxed)?;
    }

    sender.send(Fragment::Finished).await.unwrap();
    Ok(())
  });

  let event_channel = event_channel.unwrap_or_default();
  let event_emit = !event_channel.is_empty();
  let mut records = Vec::new();

  while let Some(fragment) = receiver.recv().await {
    if event_emit {
      // FIXME: emit SAFETY?
      // If the fragment is the actual records data, then just send the length
      if let Fragment::Data(records) = &fragment {
        window
          .emit(&event_channel, &Fragment::DataRef(records.len()))
          .unwrap();
      } else {
        window.emit(&event_channel, &fragment).unwrap();
      }
    }

    if let GachaRecordsFetcherChannelFragment::Data(data) = fragment {
      records.extend(data);
    }
  }

  match task.await {
    Ok(Ok(_)) => {
      info!("Fetcher channel execution is finished");
      Ok(Some(records))
    }
    Ok(Err(err)) => {
      error!("Error while pull gacha records: {err}");
      Err(err)
    }
    Err(err) => {
      panic!("Error while fetcher channel join: {err}"); // FIXME: wrapper
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
