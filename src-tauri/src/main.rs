#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

extern crate env_logger;
extern crate tauri;
extern crate tauri_plugin_store;

mod disk_cache;
mod core;
mod genshin;
mod third_party;
mod errors;
mod hooks;
mod commands;
mod utils;

fn main() {
  env_logger::init();
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())
    .setup(hooks::get_setup())
    .invoke_handler(commands::get_handlers())
    .run(tauri::generate_context!())
    .expect("error while running tauri application")
}
