extern crate tauri;
extern crate tokio;

use tauri::Window;
use tokio::sync::mpsc;
use super::official::{GachaLogFetcherChannel, GachaType};

#[tauri::command]
pub async fn cmd_crate_gacha_log_fetcher_channel(
  window: Window,
  channel_name: String,
  gacha_url: String,
  gacha_types: Option<Vec<GachaType>>
) -> Result<(), String> {
  let (tx, mut rx) = mpsc::channel(1);
  let channel = GachaLogFetcherChannel::new(&gacha_url, tx).map_err(|err| err.to_string())?;
  let result = tauri::async_runtime::spawn(async move {
    channel
      .start(gacha_types.as_ref())
      .await
      .map_err(|err| err.to_string())
  });

  while let Some(message) = rx.recv().await {
    window
      .emit(&channel_name, message)
      .map_err(|err| err.to_string())?;
  }

  result
    .await
    .map_err(|err| err.to_string())?
}
