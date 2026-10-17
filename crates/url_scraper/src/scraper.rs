use std::time::Duration;

use hg_gamebiz::GachaLogEndpoint;
use hg_url_parser::{AsParamsOptions, ParsedGachaUrl};

use crate::request::{GachaUrlRequestError, GachaUrlRequester, RetryOptions};
use crate::{GachaLog, GachaLogs, GachaType};

#[derive(Debug)]
pub enum GachaUrlScraperEvent<'d> {
  Sleeping,
  Ready(GachaType),
  Pagination(usize),
  Data(&'d [GachaLog]),
  Completed(GachaType),
  Finished,
}

// for abbreviation
type Event<'d> = GachaUrlScraperEvent<'d>;
type Callback = Box<dyn Fn(GachaUrlScraperEvent<'_>) + Send + Sync + 'static>;

// Helper macro to visit event callback
macro_rules! cb {
  ($callback:expr => $event:expr) => {
    if let Some(f) = &$callback {
      f($event);
    }
  };
}

pub struct GachaUrlScraper<'u, 'a, S> {
  url: &'u ParsedGachaUrl<'a>,
  retry: RetryOptions,
  sleeper: fn(Duration) -> S,
  callback: Option<Callback>,
}

impl<'u, 'a, S> GachaUrlScraper<'u, 'a, S>
where
  S: Future<Output = ()> + Send + 'static,
{
  /// Create a scraper that borrows `url` for its entire lifetime.
  ///
  /// The caller must keep `url` alive as long as the scraper is in use —
  /// this avoids owning a `ParsedGachaUrl` just to read a few fields.
  pub fn new(
    url: &'u ParsedGachaUrl<'a>,
    retry: RetryOptions,
    sleeper: fn(Duration) -> S,
    callback: Option<Callback>,
  ) -> Self {
    Self {
      url,
      retry,
      sleeper,
      callback,
    }
  }

  #[inline]
  pub const fn url(&self) -> &ParsedGachaUrl<'a> {
    self.url
  }
}

pub type LastEndId<'a> = Option<&'a str>;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ScrapeRange<'a> {
  pub gacha_type: GachaType,
  pub last_end_id: LastEndId<'a>,
}

impl<'a> ScrapeRange<'a> {
  #[inline]
  pub const fn new(gacha_type: GachaType, last_end_id: LastEndId<'a>) -> Self {
    Self {
      gacha_type,
      last_end_id,
    }
  }
}

impl<'a> From<(GachaType, LastEndId<'a>)> for ScrapeRange<'a> {
  #[inline]
  fn from(value: (GachaType, LastEndId<'a>)) -> Self {
    Self {
      gacha_type: value.0,
      last_end_id: value.1,
    }
  }
}

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct ScrapedGachaLogs {
  pub data: Vec<GachaLog>,
  pub region: Option<String>,
  pub region_time_zone: Option<i8>,
}

impl ScrapedGachaLogs {
  /// Merges another `ScrapedGachaLogs` into this one, combining their data and region information.
  fn merge(&mut self, other: Self) {
    self.data.extend(other.data);
    self.region = self.region.take().or(other.region);
    self.region_time_zone = self.region_time_zone.take().or(other.region_time_zone);
  }
}

impl<'u, 'a, S> GachaUrlScraper<'u, 'a, S>
where
  S: Future<Output = ()> + Send + 'static,
{
  async fn scrape_with(
    &self,
    endpoint: GachaLogEndpoint,
    scrape_range: &ScrapeRange<'_>,
    pagination_size: Option<u32>,
  ) -> Result<ScrapedGachaLogs, GachaUrlRequestError> {
    // Tell the visitor we're ready to start scraping this gacha type
    cb! { self.callback => Event::Ready(scrape_range.gacha_type) }

    const PAGINATION_THRESHOLD: usize = 5;
    const PAGINATION_SIZE: Option<u32> = Some(20);
    const WAIT_MOMENT: Duration = Duration::from_millis(500);

    let mut pagination = 0;
    let mut end_id = String::from("0");
    let mut scraped = ScrapedGachaLogs::default();
    loop {
      // Avoid visiting too frequently.
      if pagination > 1 && pagination % PAGINATION_THRESHOLD == 0 {
        cb! { self.callback => Event::Sleeping }
        (self.sleeper)(WAIT_MOMENT).await;
      }

      // Tell the visitor about the current pagination
      pagination += 1;
      cb! { self.callback => Event::Pagination(pagination) }

      // Start requesting
      let response = self
        .url
        .request_with_retry(
          endpoint,
          AsParamsOptions {
            gacha_type: Some(scrape_range.gacha_type),
            end_id: Some(&end_id),
            size: pagination_size.or(PAGINATION_SIZE),
            ..Default::default()
          },
          self.retry.clone(),
          self.sleeper,
        )
        .await?;

      // Ensure the data is not empty
      let Some(GachaLogs {
        list,
        region,
        region_time_zone,
      }) = response.data
      else {
        // no data, break loop
        break;
      };

      if list.is_empty() {
        break;
      }

      scraped.region = region;
      scraped.region_time_zone = region_time_zone;

      // SAFETY, checked above
      end_id.clone_from(&list.last().as_ref().unwrap().id);

      // Check if the slice reached the specified last end id
      let mut should_break = false;
      let logs = if let Some(last_end_id) = scrape_range.last_end_id {
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
      cb! { self.callback => Event::Data(&logs[..]) }
      scraped.data.extend(logs);

      // reached the specified last end id, break loop
      if should_break {
        break;
      }
    }

    // Tell the visitor we've completed scraping this gacha type
    cb! { self.callback => Event::Completed(scrape_range.gacha_type) }
    Ok(scraped)
  }

  /// Scrape the gacha logs from the specified endpoint and scrape ranges.
  pub async fn scrape(
    &self,
    endpoint: GachaLogEndpoint,
    scrape_ranges: &[ScrapeRange<'_>],
    pagination_size: Option<u32>,
  ) -> Result<ScrapedGachaLogs, GachaUrlRequestError> {
    let mut result = ScrapedGachaLogs::default();
    for scrape_range in scrape_ranges {
      result.merge(
        self
          .scrape_with(endpoint, scrape_range, pagination_size)
          .await?,
      );
    }

    // Tell the visitor we've finished all scraping
    cb! { self.callback => Event::Finished }
    Ok(result)
  }

  /// Scrape the gacha logs from multiple endpoints and scrape ranges.
  pub async fn scrape_multiple(
    &self,
    endpoints: &[(GachaLogEndpoint, &[ScrapeRange<'_>])],
    pagination_size: Option<u32>,
  ) -> Result<ScrapedGachaLogs, GachaUrlRequestError> {
    let mut result = ScrapedGachaLogs::default();
    for (endpoint, scrape_ranges) in endpoints {
      result.merge(
        self
          .scrape(*endpoint, scrape_ranges, pagination_size)
          .await?,
      );
    }

    Ok(result)
  }
}

// Tests
#[cfg(test)]
mod tests {
  use super::*;
  use crate::KnownGachaType;

  #[tokio::test]
  #[ignore = "Hard-coded unit test"]
  async fn scrape() {
    let url = "https://public-operation-hkrpg.mihoyo.com/common/gacha_record/api/getGachaLog?authkey_ver=1&sign_type=2&region=prod_gf_cn&default_gacha_type=11&lang=zh-cn&game_biz=hkrpg_cn&page=1&size=5&gacha_type=11&end_id=0&authkey=yourauthkey%2B";

    let parsed = ParsedGachaUrl::parse(url).unwrap();
    let scraper = GachaUrlScraper::new(
      &parsed,
      RetryOptions::default(),
      tokio::time::sleep,
      Some(Box::new(|event| println!("Scraper event: {event:?}"))),
    );

    let logs = scraper
      .scrape(
        GachaLogEndpoint::Standard,
        &[ScrapeRange::new(KnownGachaType::Hkrpg.permanent(), None)],
        None,
      )
      .await
      .unwrap();

    println!("GachaLogs length: {:?}", logs.data.len());
    // std::fs::write("./GachaLogs.dump.txt", format!("{logs:#?}")).unwrap();
  }
}
