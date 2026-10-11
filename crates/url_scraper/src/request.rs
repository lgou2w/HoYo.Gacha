use std::borrow::Cow;
use std::pin::Pin;
use std::sync::LazyLock;
use std::time::Duration;

use exponential_backoff::Backoff;
use hg_gamebiz::{GachaLogEndpoint, GachaLogEndpointProvider, GameServer};
use hg_url_parser::parser::{AsParamsOptions, ParsedGachaUrl};
use reqwest::Client as ReqwestClient;
use snafu::{OptionExt, ResultExt, Snafu};

use crate::{GachaLogs, GachaLogsResponse};

#[derive(Debug, Snafu)]
#[snafu(context(suffix(false)))]
pub enum GachaUrlRequestError {
  #[snafu(display("Gamebiz '{gamebiz:?}' does not support endpoint: {endpoint:?}"))]
  UnsupportedEndpoint {
    gamebiz: GameServer,
    endpoint: GachaLogEndpoint,
  },

  #[snafu(display("Reqwest error"))]
  Reqwest { source: reqwest::Error },

  #[snafu(display("Authkey timeout"))]
  AuthkeyTimeout,

  #[snafu(display("Visit too frequently"))]
  VisitTooFrequently,

  #[snafu(display("Unexpected response: retcode={}, message={:?}", retcode, message))]
  UnexpectedResponse { retcode: i32, message: String },

  #[snafu(display("Request reached max attempts"))]
  ReachedMaxAttempts,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct RetryOptions {
  pub max_attempts: u32,
  pub min: Duration,
  pub max: Duration,
}

impl RetryOptions {
  /// Default retry options: 5 attempts, minimum 0.2s, maximum 5.0s
  pub const DEFAULT: Self = Self {
    max_attempts: 5,                  // 5 attempts
    min: Duration::from_millis(200),  // Min: 0.2s
    max: Duration::from_millis(5000), // Max: 5.0s
  };
}

impl Default for RetryOptions {
  #[inline]
  fn default() -> Self {
    Self::DEFAULT
  }
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct GachaUrlResponse<'a> {
  pub url: &'a str,
  pub params: Vec<(&'static str, Cow<'a, str>)>,
  // If it is non-zero, it will response in an error.
  // pub retcode: i32,
  // pub message: String,
  pub data: Option<GachaLogs>,
}

impl GachaUrlResponse<'_> {
  /// Returns `true` if the response contains no gacha logs data.
  #[inline]
  pub fn is_empty(&self) -> bool {
    self
      .data
      .as_ref()
      .and_then(|data| data.list.first())
      .is_none()
  }
}

pub trait GachaUrlRequester {
  fn request<'a>(
    &'a self,
    endpoint: GachaLogEndpoint,
    options: AsParamsOptions<'a>,
    timeout: Option<Duration>,
  ) -> impl Future<Output = Result<GachaUrlResponse<'a>, GachaUrlRequestError>>;

  fn request_with_retry<'a, S>(
    &'a self,
    endpoint: GachaLogEndpoint,
    options: AsParamsOptions<'a>,
    retry: RetryOptions,
    sleeper: fn(Duration) -> S,
  ) -> Pin<Box<dyn Future<Output = Result<GachaUrlResponse<'a>, GachaUrlRequestError>> + Send + 'a>>
  where
    S: Future<Output = ()> + Send + 'static;
}

impl GachaUrlRequester for ParsedGachaUrl<'_> {
  async fn request<'a>(
    &'a self,
    endpoint: GachaLogEndpoint,
    options: AsParamsOptions<'a>,
    timeout: Option<Duration>,
  ) -> Result<GachaUrlResponse<'a>, GachaUrlRequestError> {
    const DEFAULT_TIMEOUT: Duration = Duration::from_secs(15);
    static REQWEST: LazyLock<ReqwestClient> = LazyLock::new(|| {
      ReqwestClient::builder()
        // The target is the miHoYo API endpoint; do not use any proxies.
        // To avoid sending the Gacha URL to the proxy server without the user's knowledge,
        // no proxy is used here. (Include system proxy)
        .no_proxy()
        .timeout(DEFAULT_TIMEOUT)
        .user_agent(concat!(
          env!("CARGO_PKG_NAME"),
          "/",
          env!("CARGO_PKG_VERSION"),
        ))
        .build()
        .expect("Failed to build reqwest client")
    });

    // Check if the gamebiz supports this endpoint
    let url = self
      .gamebiz
      .gacha_log_endpoint(endpoint)
      .with_context(|| UnsupportedEndpoint {
        gamebiz: self.gamebiz,
        endpoint,
      })?;

    // Send request
    let params = self.as_params(options);
    let response: GachaLogsResponse = REQWEST
      .get(url)
      .query(&params)
      .timeout(timeout.unwrap_or(DEFAULT_TIMEOUT))
      .send()
      .await
      .context(Reqwest)?
      .json()
      .await
      .context(Reqwest)?;

    // Okay
    if response.retcode == 0 {
      Ok(GachaUrlResponse {
        url,
        params,
        data: response.data,
      })
    } else {
      // Error
      let retcode = response.retcode;
      let message = &response.message;

      if retcode == -101 || message.contains("authkey") || message.contains("auth key") {
        Err(GachaUrlRequestError::AuthkeyTimeout)
      } else if retcode == -110 || message.contains("frequently") {
        Err(GachaUrlRequestError::VisitTooFrequently)
      } else {
        Err(GachaUrlRequestError::UnexpectedResponse {
          retcode,
          message: response.message,
        })
      }
    }
  }

  fn request_with_retry<'a, S>(
    &'a self,
    endpoint: GachaLogEndpoint,
    options: AsParamsOptions<'a>,
    retry: RetryOptions,
    sleeper: fn(Duration) -> S,
  ) -> Pin<Box<dyn Future<Output = Result<GachaUrlResponse<'a>, GachaUrlRequestError>> + Send + 'a>>
  where
    S: Future<Output = ()> + Send + 'static,
  {
    let backoff = Backoff::new(retry.max_attempts, retry.min, retry.max);
    let f = async move {
      for duration in backoff {
        match self.request(endpoint, options.clone(), None).await {
          Ok(response) => return Ok(response),
          Err(error) => {
            // Wait and retry only if the error is VisitTooFrequently or Timeout
            let should_retry = matches!(error, GachaUrlRequestError::VisitTooFrequently)
              || matches!(&error, GachaUrlRequestError::Reqwest { source } if source.is_timeout());

            if should_retry {
              if let Some(dur) = duration {
                // Sleep and retry
                sleeper(dur).await;
                continue;
              } else {
                // Reached max retries
                break;
              }
            } else {
              // Other errors are returned
              return Err(error);
            }
          }
        }
      }

      // Reached max retries
      Err(GachaUrlRequestError::ReachedMaxAttempts)
    };

    Box::pin(f)
  }
}
