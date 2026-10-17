use std::ops::ControlFlow;
use std::time::Duration;

use hg_gamebiz::GachaLogEndpoint;
use hg_url_parser::{AsParamsOptions, ParsedGachaUrl};

use crate::request::{GachaUrlRequestError, GachaUrlRequester, RetryOptions};
use crate::{GachaLog, GachaLogs, GachaType};

/// Progress events emitted by [`GachaUrlScraper`] during a scrape.
///
/// Delivered through the [`Callback`]. The callback may return
/// [`ControlFlow::Break`] on any event to stop the scrape early — no
/// further events are delivered and the partial results are discarded.
#[derive(Debug)]
pub enum GachaUrlScraperEvent<'d> {
  /// About to sleep between pagination batches (rate-limit avoidance).
  Sleeping,
  /// Starting to scrape a new `gacha_type`.
  Ready(GachaType),
  /// Requesting pagination page `n` (1-indexed, per `gacha_type`).
  Pagination(usize),
  /// A non-empty batch of logs was received. The slice is valid only for
  /// the duration of the callback.
  Data(&'d [GachaLog]),
  /// Finished scraping the current `gacha_type`.
  Completed(GachaType),
  /// All `gacha_type`s are done. Not emitted if the callback broke early.
  Finished,
}

// for abbreviation
type Event<'d> = GachaUrlScraperEvent<'d>;

/// Called for every [`GachaUrlScraperEvent`].
///
/// Returns [`ControlFlow::Continue`] to keep scraping, or
/// [`ControlFlow::Break`] to stop. When it breaks, the scraper returns
/// `Ok(ControlFlow::Break(()))` and drops any partial data — `Completed`
/// and `Finished` are **not** emitted.
type Callback = Box<dyn Fn(GachaUrlScraperEvent<'_>) -> ControlFlow<()> + Send + Sync + 'static>;

/// Visit the callback; propagate a `Break` out of the current function.
///
/// Usable inside any `fn` that returns
/// `Result<ControlFlow<(), _>, GachaUrlRequestError>`.
macro_rules! cb {
  ($callback:expr => $event:expr) => {
    if let Some(f) = &$callback
      && f($event).is_break()
    {
      return Ok(ControlFlow::Break(()));
    }
  };
}

/// Scrapes gacha logs from a single [`ParsedGachaUrl`].
///
/// # Lifetimes
///
/// - `'u` — the `&url` borrow. Independent of the parsed URL's inner data
///   so the caller doesn't need to keep its `ParsedGachaUrl` alive for as
///   long as the URL's own `&str` fields.
/// - `'a` — the lifetime carried inside `ParsedGachaUrl<'a>`.
///
/// `S` is the sleeper future type used for rate-limit waits (typically
/// `tokio::time::Sleep`).
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
  ///
  /// `callback` may be `None` for a headless scrape. See [`Callback`] for
  /// the early-stop protocol.
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
  pub const fn url(&self) -> &'u ParsedGachaUrl<'a> {
    self.url
  }
}

pub type LastEndId<'a> = Option<&'a str>;

/// A `(gacha_type, last_end_id)` pair, describing one thing to scrape.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ScrapeRange<'a> {
  pub gacha_type: GachaType,
  /// Newest already-known record `id`. The scraper stops paginating this
  /// `gacha_type` when it reaches it, avoiding duplicate downloads.
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

/// Scraped gacha logs plus server-reported metadata for the account.
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct ScrapedGachaLogs {
  pub data: Vec<GachaLog>,
  /// Region reported by the server. Populated from the first non-empty
  /// response; later responses keep the value set here.
  pub region: Option<String>,
  /// Region timezone (hours east of UTC) reported by the server. Same
  /// merge rule as `region`.
  pub region_time_zone: Option<i8>,
}

impl ScrapedGachaLogs {
  /// Merge `other` into `self`.
  ///
  /// - `data` is appended.
  /// - `region` / `region_time_zone` use `self`'s value when present;
  ///   otherwise the first non-`None` value from `other` wins. Later
  ///   responses (which always report the same values for the same
  ///   account) do not overwrite an established value.
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
  /// Scrape one `ScrapeRange` from `endpoint`.
  ///
  /// Returns `Ok(ControlFlow::Continue(logs))` on success, or
  /// `Ok(ControlFlow::Break(()))` if the callback broke — in which case
  /// any partial data is dropped and `Completed` is not emitted.
  async fn scrape_with(
    &self,
    endpoint: GachaLogEndpoint,
    scrape_range: &ScrapeRange<'_>,
    pagination_size: Option<u32>,
  ) -> Result<ControlFlow<(), ScrapedGachaLogs>, GachaUrlRequestError> {
    // Tell the visitor we're ready to start scraping this gacha type
    cb! { self.callback => Event::Ready(scrape_range.gacha_type) }

    const PAGINATION_THRESHOLD: usize = 5;
    const PAGINATION_SIZE: Option<u32> = Some(20);
    const WAIT_MOMENT: Duration = Duration::from_millis(500);

    let mut pagination = 0;
    let mut end_id = String::from("0");
    let mut scraped = ScrapedGachaLogs::default();
    loop {
      // Rate-limit avoidance: after the first batch, pause every
      // `PAGINATION_THRESHOLD` pages. The server rejects frequent calls
      // with `retcode: -110`, so a modest delay is cheaper than retries.
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

      // If the callback breaks here, we lose only the current page's
      // batch — everything accumulated so far is also dropped because we
      // return `Break(())` rather than the partial result. That is the
      // intended contract: `Break` means "don't use this run's data".
      cb! { self.callback => Event::Data(&logs[..]) }
      scraped.data.extend(logs);

      // reached the specified last end id, break loop
      if should_break {
        break;
      }
    }

    // Tell the visitor we've completed scraping this gacha type
    cb! { self.callback => Event::Completed(scrape_range.gacha_type) }
    Ok(ControlFlow::Continue(scraped))
  }

  /// Scrape all `scrape_ranges` from `endpoint` sequentially.
  ///
  /// Stops at the first `gacha_type` whose callback broke, discarding all
  /// results accumulated so far. `Finished` is only emitted when every
  /// range completed normally.
  pub async fn scrape(
    &self,
    endpoint: GachaLogEndpoint,
    scrape_ranges: &[ScrapeRange<'_>],
    pagination_size: Option<u32>,
  ) -> Result<ControlFlow<(), ScrapedGachaLogs>, GachaUrlRequestError> {
    let mut result = ScrapedGachaLogs::default();
    for scrape_range in scrape_ranges {
      match self
        .scrape_with(endpoint, scrape_range, pagination_size)
        .await?
      {
        ControlFlow::Continue(scraped) => result.merge(scraped),
        ControlFlow::Break(()) => {
          // The caller asked to stop; discard partial results and
          // propagate the break without firing `Finished`.
          return Ok(ControlFlow::Break(()));
        }
      }
    }

    // Tell the visitor we've finished all scraping
    cb! { self.callback => Event::Finished }
    Ok(ControlFlow::Continue(result))
  }

  /// Scrape from multiple `(endpoint, ranges)` pairs sequentially.
  ///
  /// Same break semantics as [`Self::scrape`]: the first `Break`
  /// short-circuits the whole call and discards accumulated results.
  pub async fn scrape_multiple(
    &self,
    endpoints: &[(GachaLogEndpoint, &[ScrapeRange<'_>])],
    pagination_size: Option<u32>,
  ) -> Result<ControlFlow<(), ScrapedGachaLogs>, GachaUrlRequestError> {
    let mut result = ScrapedGachaLogs::default();
    for (endpoint, scrape_ranges) in endpoints {
      match self
        .scrape(*endpoint, scrape_ranges, pagination_size)
        .await?
      {
        ControlFlow::Continue(scraped) => result.merge(scraped),
        ControlFlow::Break(()) => {
          // The caller asked to stop; discard partial results and
          // propagate the break without firing `Finished`.
          return Ok(ControlFlow::Break(()));
        }
      }
    }

    Ok(ControlFlow::Continue(result))
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
      Some(Box::new(|event| {
        println!("Scraper event: {event:?}");
        ControlFlow::Continue(())
      })),
    );

    match scraper
      .scrape(
        GachaLogEndpoint::Standard,
        &[ScrapeRange::new(KnownGachaType::Hkrpg.permanent(), None)],
        None,
      )
      .await
      .unwrap()
    {
      ControlFlow::Break(()) => {}
      ControlFlow::Continue(logs) => {
        println!("GachaLogs length: {:?}", logs.data.len());
        // std::fs::write("./GachaLogs.dump.txt", format!("{logs:#?}")).unwrap();
      }
    }
  }
}
