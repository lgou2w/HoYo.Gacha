extern crate form_urlencoded;
extern crate reqwest;
extern crate tokio;
extern crate url;

use std::collections::HashMap;
use std::error::Error;
use reqwest::{Client, ClientBuilder};
use reqwest::header::{HeaderMap, HeaderValue};
use serde::Serialize;
use tokio::time;
use tokio::sync::Mutex;
use tokio::sync::mpsc;
use url::Url;
use super::{GachaType, GachaLogItem, GachaLogPagination, Response};
use crate::genshin::GACHA_URL_ENDPOINT;

pub struct GachaLogFetcher {
  pub client: Client,
  pub gacha_url: Url
}

impl GachaLogFetcher {
  pub fn new(gacha_url: &str) -> Result<Self, Box<dyn Error>> {
    let endpoint_start = gacha_url.find(GACHA_URL_ENDPOINT).ok_or("Invalid Gacha url")?;
    let base_url = &gacha_url[0..endpoint_start + GACHA_URL_ENDPOINT.len()];
    let query_str = &gacha_url[endpoint_start + GACHA_URL_ENDPOINT.len()..];

    let mut queries: HashMap<String, String> = form_urlencoded::parse(query_str.as_bytes()).into_owned().collect();
    queries.remove("gacha_type");
    queries.remove("page");
    queries.remove("size");
    queries.remove("end_id");

    let url = Url::parse_with_params(base_url, queries).map_err(|err| err.to_string())?;
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
      .build()
      .map_err(|err| err.to_string())?;

    Ok(Self {
      client,
      gacha_url: url
    })
  }

  fn combine_url(&self, gacha_type: &GachaType, end_id: u64) -> Url {
    let mut url = self.gacha_url.clone();
    url
      .query_pairs_mut()
      .append_pair("gacha_type", (*gacha_type as u32).to_string().as_str())
      .append_pair("page", "1")
      .append_pair("size", "20")
      .append_pair("end_id", end_id.to_string().as_str());
    url
  }

  pub async fn fetch(&self,
    gacha_type: &GachaType,
    end_id: u64
  ) -> Result<Response<Option<GachaLogPagination>>, reqwest::Error> {
    let url = self.combine_url(gacha_type, end_id);
    let response: Response<Option<GachaLogPagination>> = self.client
      .get(url)
      .send()
      .await?
      .json()
      .await?;
    Ok(response)
  }
}

#[derive(Debug, Clone, Serialize)]
pub enum GachaLogFetcherChannelMessage {
  Completed,
  Status(String),
  Data(GachaLogItem)
}

pub struct GachaLogFetcherChannel {
  fetcher: GachaLogFetcher,
  inner: Mutex<mpsc::Sender<GachaLogFetcherChannelMessage>>
}

impl GachaLogFetcherChannel {
  pub fn new(
    gacha_url: &str,
    sender: mpsc::Sender<GachaLogFetcherChannelMessage>
  ) -> Result<Self, Box<dyn Error>> {
    let fetcher = GachaLogFetcher::new(gacha_url)?;
    Ok(Self {
      fetcher,
      inner: Mutex::new(sender)
    })
  }

  // TODO: status msg
  async fn poll(&self, gacha_type: &GachaType) -> Result<(), Box<dyn Error>> {
    let sender = &(self.inner.lock().await);
    sender.send(GachaLogFetcherChannelMessage::Status(format!("Fetching type: {gacha_type:#?}"))).await?;

    let mut end_id: u64 = 0;
    let mut count: u32 = 0;
    loop {
      if count > 0 && count % 5 == 0 {
        sender.send(GachaLogFetcherChannelMessage::Status("Wait 3 seconds".into())).await?;
        time::sleep(time::Duration::from_secs(3)).await;
      }

      sender.send(GachaLogFetcherChannelMessage::Status(format!("Fetching page: {}", count + 1))).await?;
      let response = self.fetcher.fetch(gacha_type, end_id).await?;
      count += 1;

      if let Some(pagination) = response.data {
        if !pagination.list.is_empty() {
          let size = pagination.list.len();
          for (index, data) in pagination.list.iter().enumerate() {
            sender.send(GachaLogFetcherChannelMessage::Data(data.clone())).await?;
            if index + 1 == size {
              end_id = data.id;
            }
          }
          time::sleep(time::Duration::from_secs(1)).await;
          continue;
        }
      }

      break;
    }

    sender.send(GachaLogFetcherChannelMessage::Status("Completed".into())).await?;
    sender.send(GachaLogFetcherChannelMessage::Completed).await?;
    Ok(())
  }

  // TODO: test code
  pub async fn start(&self) -> Result<(), Box<dyn Error>> {
    for ref gacha_type in [
      // GachaType::CharacterEvent,
      // GachaType::CharacterEvent2,
      // GachaType::WeaponEvent,
      GachaType::Permanent,
      // GachaType::Newbie
    ] {
      self.poll(gacha_type).await?;
    }
    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[ignore]
  #[tokio::test(flavor = "multi_thread")]
  async fn test_fetcher_channel() {
    let gacha_url = "your gacha url";
    let (sender, mut receiver) = mpsc::channel(1);
    let fetcher_channel = GachaLogFetcherChannel::new(gacha_url, sender).unwrap();

    println!("spawn");
    tokio::spawn(async move {
      fetcher_channel.start().await.unwrap();
    });

    let mut stdout = tokio::io::stdout();
    use tokio::io::AsyncWriteExt;
    println!("receiver");
    while let Some(message) = receiver.recv().await {
      match message {
        GachaLogFetcherChannelMessage::Status(msg) => {
          stdout.write_all(format!("\n{msg}\n").as_bytes()).await.unwrap();
          stdout.flush().await.unwrap();
        },
        GachaLogFetcherChannelMessage::Data(data) => {
          stdout.write_all(format!("{:?}，", data.name).as_bytes()).await.unwrap();
          stdout.flush().await.unwrap();
        },
        GachaLogFetcherChannelMessage::Completed => {}
      }
    }
  }
}
