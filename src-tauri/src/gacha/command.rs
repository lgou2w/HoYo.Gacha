extern crate tauri;
extern crate tokio;

use tauri::Window;
use tokio::sync::mpsc;
use super::official::GachaLogFetcherChannel;

// TODO: test code

#[tauri::command]
pub async fn cmd_crate_gacha_log_fetcher_channel(
  window: Window
) -> Result<(), String> {
  let gacha_url = "your gacha url";
  let (tx, mut rx) = mpsc::channel(1);
  let channel = GachaLogFetcherChannel::new(gacha_url, tx).map_err(|err| err.to_string())?;
  let result = tauri::async_runtime::spawn(async move {
    channel
      .start()
      .await
      .map_err(|err| err.to_string())
  });

  while let Some(message) = rx.recv().await {
    window
      .emit("gacha-log-fetcher-channel", message)
      .map_err(|err| err.to_string())?;
  }

  result
    .await
    .map_err(|err| err.to_string())?
}
