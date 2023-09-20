#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod commands;
mod constants;
mod disk_cache;
mod error;
mod gacha;
mod storage;

fn main() {
  tracing_subscriber::fmt()
    .with_max_level(tracing::Level::DEBUG)
    .with_env_filter("hoyo_gacha=debug,hyper=warn") // TODO: production
    .init();

  tauri::Builder::default()
    .plugin(storage::StoragePluginBuilder::new().build())
    .plugin(gacha::GachaPluginBuilder::new().build())
    .setup(|app| {
      let open_devtools = cfg!(debug_assertions) || std::env::var("DEVTOOLS").is_ok();
      if open_devtools {
        use tauri::Manager;
        app.get_window("main").unwrap().open_devtools();
      }
      Ok(())
    })
    .invoke_handler(commands::get_handlers())
    .run(tauri::generate_context!())
    .expect("error while running tauri application")
}
