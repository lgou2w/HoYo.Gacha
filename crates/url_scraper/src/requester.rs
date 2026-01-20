use std::pin::Pin;
use std::time::Duration;

use exponential_backoff::Backoff;
use hg_game_biz::{GachaLogEndpointType, GameBiz};
use hg_url_finder::parse::{AsQueriesOptions, ParsedGachaUrl};
use reqwest::Client as Reqwest;
use snafu::{OptionExt, ResultExt, Snafu};

use crate::{GachaLogs, GachaLogsResponse, MihoyoResponse};

#[derive(Debug, Snafu)]
pub enum GachaUrlRequestError {
  #[snafu(display("Game biz '{game_biz:?}' does not support endpoint type: {endpoint:?}"))]
  UnsupportedEndpoint {
    game_biz: &'static GameBiz,
    endpoint: GachaLogEndpointType,
  },

  #[snafu(display("Reqwest error"))]
  Reqwest { source: reqwest::Error },

  #[snafu(display("Authkey timeout"))]
  AuthkeyTimeout,

  #[snafu(display("Visit too frequently"))]
  VisitTooFrequently,

  #[snafu(display("Unexpected response: retcode={}, message={}", retcode, message))]
  UnexpectedResponse { retcode: i32, message: String },

  #[snafu(display("Request reached max attempts"))]
  ReachedMaxAttempts,
}

#[derive(Clone, Debug)]
pub struct RetryOptions {
  pub max_attempts: u32,
  pub min: Duration,
  pub max: Duration,
}

impl Default for RetryOptions {
  fn default() -> Self {
    const RETRIES: u32 = 5; // 5 attempts
    const MIN: Duration = Duration::from_millis(200); // Min: 0.2s
    const MAX: Duration = Duration::from_millis(5000); // Max: 5s

    Self {
      max_attempts: RETRIES,
      min: MIN,
      max: MAX,
    }
  }
}

impl RetryOptions {
  #[inline]
  fn into_backoff(self) -> Backoff {
    Backoff::new(self.max_attempts, self.min, self.max)
  }
}

pub trait GachaUrlRequester {
  fn request(
    &self,
    endpoint: GachaLogEndpointType,
    options: AsQueriesOptions<'_>,
    timeout: Option<Duration>,
  ) -> impl Future<Output = Result<GachaLogsResponse, GachaUrlRequestError>>;

  fn request_with_retry<'a, S>(
    &'a self,
    endpoint: GachaLogEndpointType,
    options: AsQueriesOptions<'a>,
    retry: RetryOptions,
    sleeper: fn(Duration) -> S,
  ) -> Pin<Box<dyn Future<Output = Result<GachaLogsResponse, GachaUrlRequestError>> + Send + 'a>>
  where
    S: Future<Output = ()> + Send + 'static;
}

impl GachaUrlRequester for ParsedGachaUrl<'_> {
  async fn request(
    &self,
    endpoint: GachaLogEndpointType,
    options: AsQueriesOptions<'_>,
    timeout: Option<Duration>,
  ) -> Result<GachaLogsResponse, GachaUrlRequestError> {
    const DEFAULT_TIMEOUT: Duration = Duration::from_secs(10);

    // Check if the game biz supports this endpoint type.
    let base_url = self
      .game_biz
      .gacha_log_api_endpoint(endpoint)
      .with_context(|| UnsupportedEndpointSnafu {
        game_biz: self.game_biz,
        endpoint,
      })?;

    // Send request
    let queries = self.as_queries_with(options);
    let response = Reqwest::builder()
      .build()
      .context(ReqwestSnafu)?
      .get(base_url)
      .query(&queries)
      .timeout(timeout.unwrap_or(DEFAULT_TIMEOUT))
      .send()
      .await
      .context(ReqwestSnafu)?;

    let url = response.url().clone();
    let response = response
      .json::<MihoyoResponse<GachaLogs>>()
      .await
      .context(ReqwestSnafu)?;

    // Okay
    if response.retcode == 0 {
      return Ok(GachaLogsResponse {
        inner: response,
        url,
      });
    }

    // Error
    let retcode = response.retcode;
    let message = &response.message;

    if retcode == -101 || message.contains("authkey") || message.contains("auth key") {
      Err(GachaUrlRequestError::AuthkeyTimeout)
    } else if retcode == -110
      || message.contains("frequently")
      || message.contains("visit too frequently")
    {
      Err(GachaUrlRequestError::VisitTooFrequently)
    } else {
      Err(GachaUrlRequestError::UnexpectedResponse {
        retcode,
        message: response.message,
      })
    }
  }

  fn request_with_retry<'a, S>(
    &'a self,
    endpoint: GachaLogEndpointType,
    options: AsQueriesOptions<'a>,
    retry: RetryOptions,
    sleeper: fn(Duration) -> S,
  ) -> Pin<Box<dyn Future<Output = Result<GachaLogsResponse, GachaUrlRequestError>> + Send + 'a>>
  where
    S: Future<Output = ()> + Send + 'static,
  {
    let f = async move {
      let backoff = retry.into_backoff();
      let timeout = *backoff.max() + Duration::from_secs(5);

      for duration in &backoff {
        match self.request(endpoint, options.clone(), Some(timeout)).await {
          Ok(response) => return Ok(response),

          // Wait and retry only if the error is VisitTooFrequently.
          Err(GachaUrlRequestError::VisitTooFrequently) => {
            if let Some(dur) = duration {
              // Sleep and retry
              sleeper(dur).await;
              continue;
            } else {
              // Reached max retries
              break;
            }
          }

          // Other errors are returned
          Err(error) => return Err(error),
        }
      }

      // Reached max retries
      Err(GachaUrlRequestError::ReachedMaxAttempts)
    };

    Box::pin(f)
  }
}
