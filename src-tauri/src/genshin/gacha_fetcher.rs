extern crate form_urlencoded;
extern crate lazy_static;
extern crate log;
extern crate reqwest;
extern crate tokio;
extern crate url;

use std::collections::{BTreeMap, HashMap};
use std::error::Error;
use std::future::Future;
use lazy_static::lazy_static;
use log::debug;
use reqwest::{Client, ClientBuilder};
use reqwest::header::{HeaderMap, HeaderValue};
use serde::Serialize;
use tokio::time;
use tokio::sync::mpsc;
use url::Url;
use super::{GachaType, GachaLogItem, GachaLogPagination, Response};
use crate::genshin::GACHA_URL_ENDPOINT;
use crate::errors;

type Result<T> = std::result::Result<T, Box<dyn Error + Send + Sync>>;

pub struct GachaLogFetcher {
  pub client: Client,
  pub gacha_url: Url,
  pub raw_gacha_url: String
}

impl GachaLogFetcher {
  pub fn new(gacha_url: &str) -> Result<Self> {
    let endpoint_start = gacha_url.find(GACHA_URL_ENDPOINT).ok_or(errors::ERR_INVALID_GACHA_URL)?;
    let base_url = &gacha_url[0..endpoint_start + GACHA_URL_ENDPOINT.len()];
    let query_str = &gacha_url[endpoint_start + GACHA_URL_ENDPOINT.len()..];

    let mut queries: HashMap<String, String> = form_urlencoded::parse(query_str.as_bytes()).into_owned().collect();
    queries.remove("gacha_type");
    queries.remove("page");
    queries.remove("size");
    queries.remove("begin_id");
    queries.remove("end_id");

    let url = Url::parse_with_params(base_url, queries)?;
    let mut headers = HeaderMap::new();
    headers.insert("Accept", HeaderValue::from_static("application/json"));
    headers.insert("User-Agent", HeaderValue::from_str(
      &format!(
        "{} v{} by {}",
        env!("CARGO_PKG_NAME"),
        env!("CARGO_PKG_VERSION"),
        env!("CARGO_PKG_AUTHORS")
      )
    ).unwrap());

    let client = ClientBuilder::new()
      .default_headers(headers)
      .build()?;

    Ok(Self {
      client,
      gacha_url: url,
      raw_gacha_url: gacha_url.to_owned()
    })
  }

  fn combine_url(&self, gacha_type: &GachaType, end_id: &str) -> Url {
    let mut url = self.gacha_url.clone();
    url
      .query_pairs_mut()
      .append_pair("gacha_type", (*gacha_type as u32).to_string().as_str())
      .append_pair("page", "1")
      .append_pair("size", "20")
      .append_pair("end_id", end_id);
    url
  }

  fn validate_response(response: &Response<Option<GachaLogPagination>>) -> Result<()> {
    if response.retcode != 0 {
      return match response.retcode {
        -101 => Err(errors::ERR_TIMEOUTD_GACHA_URL.into()),
        other => Err(format!("{} ({})", response.message, other).into())
      }
    }
    Ok(())
  }

  pub async fn fetch(&self,
    gacha_type: &GachaType,
    end_id: &str
  ) -> Result<Response<Option<GachaLogPagination>>> {
    let url = self.combine_url(gacha_type, end_id);
    let response: Response<Option<GachaLogPagination>> = self.client
      .get(url)
      .send()
      .await?
      .json()
      .await?;

    Self::validate_response(&response)?;
    Ok(response)
  }

  pub(crate) async fn fetch_raw(&self) -> Result<Response<Option<GachaLogPagination>>> {
    let response: Response<Option<GachaLogPagination>> = self.client
      .get(&self.raw_gacha_url)
      .send()
      .await?
      .json()
      .await?;

    Self::validate_response(&response)?;
    Ok(response)
  }
}

#[derive(Debug, Clone, Serialize)]
pub enum GachaLogFetcherChannelMessage {
  #[serde(rename = "status")]
  Status(String),
  #[serde(rename = "data")]
  Data(Vec<GachaLogItem>)
}

pub struct GachaLogFetcherChannel {
  fetcher: GachaLogFetcher,
  sender: mpsc::Sender<GachaLogFetcherChannelMessage>
}

impl GachaLogFetcherChannel {
  pub fn new(
    gacha_url: &str,
    sender: mpsc::Sender<GachaLogFetcherChannelMessage>
  ) -> Result<Self> {
    let fetcher = GachaLogFetcher::new(gacha_url)?;
    Ok(Self {
      fetcher,
      sender
    })
  }

  // TODO: better status msg

  async fn poll(&self, gacha_type: &GachaType, last_end_id: Option<&str>) -> Result<()> {
    debug!("Polling gacha {gacha_type:?}({}) Last EndId ({last_end_id:?})...", (*gacha_type as u32));
    self.sender.send(GachaLogFetcherChannelMessage::Status(format!("开始获取祈愿数据：{gacha_type:?}"))).await?;
    time::sleep(time::Duration::from_secs(3)).await;

    let mut end_id = String::from("0");
    let mut count: u32 = 0;
    const SLEEP_SECONDS: u8 = 3;

    loop {
      if count > 0 && count % 5 == 0 {
        debug!("Waiting {SLEEP_SECONDS} seconds...");
        self.sender.send(GachaLogFetcherChannelMessage::Status(format!("等待 {SLEEP_SECONDS} 秒钟..."))).await?;
        time::sleep(time::Duration::from_secs(SLEEP_SECONDS as u64)).await;
      }

      debug!("Fetching page {} data...", count + 1);
      self.sender.send(GachaLogFetcherChannelMessage::Status(format!("获取第 {} 页数据...", count + 1))).await?;
      let response = self.fetcher.fetch(gacha_type, &end_id).await?;

      count += 1;

      if let Some(pagination) = response.data {
        if !pagination.list.is_empty() {
          end_id = pagination.list.last().unwrap().id.clone();

          let mut should_break = false;
          let data: Vec<GachaLogItem> = if let Some(last) = last_end_id {
            let mut tmp = Vec::with_capacity(20);
            for item in pagination.list {
              if last.cmp(&item.id).is_le() {
                tmp.push(item);
              } else {
                should_break = true;
              }
            }
            tmp
          } else {
            pagination.list
          };

          self.sender.send(GachaLogFetcherChannelMessage::Data(data)).await?;

          if should_break {
            break;
          } else {
            debug!("Next end id: {end_id:?}");
            time::sleep(time::Duration::from_secs(1)).await;
            continue;
          }
        }
      }

      break;
    }

    debug!("Poll done");
    self.sender.send(GachaLogFetcherChannelMessage::Status("完成".into())).await?;
    Ok(())
  }

  pub async fn start(&self, gacha_types_arguments: Option<&GachaLogFetcherTypesArguments>) -> Result<()> {
    let override_gacha_types_arguments = match gacha_types_arguments {
      Some(value) => {
        if value.is_empty() {
          &DEFAULT_TYPES_ARGUMENTS
        } else {
          value
        }
      }
      None => &DEFAULT_TYPES_ARGUMENTS,
    };

    debug!("Start fetching gacha types: {gacha_types_arguments:?}");
    for (gacha_type, end_id) in override_gacha_types_arguments {
      self.poll(gacha_type, end_id.as_deref()).await?;
    }
    debug!("Fetch done");
    Ok(())
  }
}

// GachaType to BeginId
type GachaLogFetcherTypesArguments = BTreeMap<GachaType, Option<String>>;

lazy_static! {
  static ref DEFAULT_TYPES_ARGUMENTS: GachaLogFetcherTypesArguments = {
    let mut m = GachaLogFetcherTypesArguments::new();
    m.insert(GachaType::Newbie        , None);
    m.insert(GachaType::Permanent     , None);
    m.insert(GachaType::CharacterEvent, None);
    m.insert(GachaType::WeaponEvent   , None);
    m
  };
}

pub async fn create_gacha_log_fetcher_channel<F, Fut>(
  gacha_url: String,
  gacha_types_arguments: Option<BTreeMap<GachaType, Option<String>>>,
  receiver: F
) -> Result<()>
where
  F: Fn(GachaLogFetcherChannelMessage) -> Fut,
  Fut: Future<Output = Result<()>> {
  let (tx, mut rx) = mpsc::channel(1);
  let done = tokio::spawn(async move {
    GachaLogFetcherChannel::new(&gacha_url, tx)?
      .start(gacha_types_arguments.as_ref())
      .await
  });

  while let Some(message) = rx.recv().await {
    receiver(message).await?
  }

  done.await?
}
