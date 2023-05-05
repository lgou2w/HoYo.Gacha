#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

extern crate tauri;
extern crate tracing;
extern crate tracing_subscriber;

mod disk_cache;
mod constants;
mod error;
mod gacha;
mod storage;

fn main() {
  tracing_subscriber::fmt()
    .with_max_level(tracing::Level::TRACE)
    .init();

  tauri::Builder::default()
    .plugin(storage::GachaStoragePluginBuilder::new().build())
    .run(tauri::generate_context!())
    .expect("error while running tauri application")
}
