#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

extern crate env_logger;
extern crate tauri;

mod disk_cache;
mod genshin;
mod account;
mod errors;
mod hooks;
mod commands;

fn main() {
  env_logger::init();
  tauri::Builder::default()
    .setup(hooks::get_setup())
    .invoke_handler(commands::get_handlers())
    .run(tauri::generate_context!())
    .expect("error while running tauri application")
}
