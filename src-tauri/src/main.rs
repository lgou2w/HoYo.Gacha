#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

extern crate tauri;

fn main() {
  tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error while runing tauri application")
}
