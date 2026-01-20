use std::time::Duration;

use hg_game_biz::GachaLogEndpointType;
use hg_url_finder::parse::{AsQueriesOptions, ParsedGachaUrl};

use crate::requester::{GachaUrlRequestError, GachaUrlRequester, RetryOptions};
use crate::{GachaLog, GachaLogs};

#[derive(Debug)]
pub enum GachaLogsScraperNotify<'d> {
  Sleeping,
  Ready(u32),
  Pagination(usize),
  Data(&'d [GachaLog]),
  Completed(u32),
  Finished,
}

// for abbreviation
type Notify<'d> = GachaLogsScraperNotify<'d>;
type Notifier = Box<dyn Fn(GachaLogsScraperNotify<'_>) + Send + Sync + 'static>;

// Helper macro to visit notifier callback
macro_rules! notify {
  ($notifier:expr => $notify:expr) => {
    if let Some(n) = &$notifier {
      n($notify);
    }
  };
}

pub struct GachaLogsScraper<'a, S> {
  url: ParsedGachaUrl<'a>,
  retry: RetryOptions,
  sleeper: fn(Duration) -> S,
  notifier: Option<Notifier>,
}

impl<'a, S> GachaLogsScraper<'a, S>
where
  S: Future<Output = ()> + Send + 'static,
{
  pub fn new(
    url: ParsedGachaUrl<'a>,
    retry: RetryOptions,
    sleeper: fn(Duration) -> S,
    notifier: Option<Notifier>,
  ) -> Self {
    Self {
      url,
      retry,
      sleeper,
      notifier,
    }
  }

  #[inline]
  pub const fn url(&self) -> &ParsedGachaUrl<'_> {
    &self.url
  }

  #[allow(clippy::type_complexity)]
  pub async fn scrapes(
    &self,
    mappings: Vec<(GachaLogEndpointType, &[(u32, Option<&str>)])>,
    pagination_size: Option<u32>,
  ) -> Result<Vec<GachaLog>, GachaUrlRequestError> {
    let mut results = Vec::new();

    for (endpoint, gacha_type_and_last_end_ids) in mappings {
      let logs = self
        .scrape(endpoint, gacha_type_and_last_end_ids, pagination_size)
        .await?;

      results.extend(logs);
    }

    Ok(results)
  }

  pub async fn scrape(
    &self,
    endpoint: GachaLogEndpointType,
    gacha_type_and_last_end_ids: &[(u32, Option<&str>)],
    pagination_size: Option<u32>,
  ) -> Result<Vec<GachaLog>, GachaUrlRequestError> {
    // Collect all gacha logs
    let mut results = Vec::new();

    for (gacha_type, last_end_id) in gacha_type_and_last_end_ids {
      let logs = self
        .scrape_with(
          endpoint,
          *gacha_type,
          last_end_id.as_deref(),
          pagination_size,
        )
        .await?;

      results.extend(logs);
    }

    // Tell the visitor we've finished all scraping
    notify! { self.notifier => Notify::Finished };

    Ok(results)
  }

  #[inline]
  async fn scrape_with(
    &self,
    endpoint: GachaLogEndpointType,
    gacha_type: u32,
    last_end_id: Option<&str>,
    pagination_size: Option<u32>,
  ) -> Result<Vec<GachaLog>, GachaUrlRequestError> {
    // Tell the visitor we're ready to start scraping this gacha type
    notify! { self.notifier => Notify::Ready(gacha_type) };

    const PAGINATION_THRESHOLD: usize = 5;
    const PAGINATION_SIZE: Option<u32> = Some(20);
    const WAIT_MOMENT: Duration = Duration::from_millis(500);

    let mut pagination = 0;
    let mut end_id = String::from("0");
    let mut results = Vec::new();
    loop {
      // Avoid visiting too frequently.
      if pagination > 1 && pagination % PAGINATION_THRESHOLD == 0 {
        notify! { self.notifier => Notify::Sleeping };
        (self.sleeper)(WAIT_MOMENT).await;
      }

      // Tell the visitor about the current pagination
      pagination += 1;
      notify! { self.notifier => Notify::Pagination(pagination) };

      // Start requesting
      let response = self
        .url
        .request_with_retry(
          endpoint,
          AsQueriesOptions {
            gacha_type: Some(gacha_type),
            end_id: Some(&end_id),
            size: pagination_size.or(PAGINATION_SIZE),
            ..Default::default()
          },
          self.retry.clone(),
          self.sleeper,
        )
        .await?;

      // Ensure the data is not empty
      if let Some(GachaLogs { list, .. }) = response.into_inner().data
        && !list.is_empty()
      {
        // SAFETY, checked
        end_id.clone_from(&list.last().as_ref().unwrap().id);

        // Check if the slice reached the specified last end id
        let mut should_break = false;
        let logs = if let Some(last_end_id) = last_end_id {
          let mut temp = Vec::with_capacity(list.len());
          for log in list {
            if last_end_id.cmp(&log.id).is_lt() {
              temp.push(log);
            } else {
              should_break = true;
            }
          }

          temp
        } else {
          list
        };

        // Tell the visitor about the new data
        notify! { self.notifier => Notify::Data(&logs[..]) };
        results.extend(logs);

        // reached the specified last end id, break loop
        if should_break {
          break;
        } else {
          continue;
        }
      }

      // no data, break loop
      break;
    }

    // Tell the visitor we've completed scraping this gacha type
    notify! { self.notifier => Notify::Completed(gacha_type) };

    Ok(results)
  }
}
