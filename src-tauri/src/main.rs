#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

extern crate tauri;

mod disk_cache;
mod genshin;
mod commands;

fn main() {
  tauri::Builder::default()
    .invoke_handler(commands::get_handlers())
    .run(tauri::generate_context!())
    .expect("error while runing tauri application")
}
