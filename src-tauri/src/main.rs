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
      use tauri::Manager;
      let main_window = app.get_window("main").unwrap();

      #[cfg(windows)]
      fixed_hdpi_problem(&main_window);

      if cfg!(debug_assertions) || std::env::var("DEVTOOLS").is_ok() {
        main_window.open_devtools();
      }
      Ok(())
    })
    .invoke_handler(commands::get_handlers())
    .run(tauri::generate_context!())
    .expect("error while running tauri application")
}

// See: https://github.com/lgou2w/HoYo.Gacha/issues/40
// It's not a perfect fix.
#[cfg(windows)]
fn fixed_hdpi_problem(window: &tauri::Window) {
  use windows::Win32::UI::WindowsAndMessaging::GetSystemMetrics;
  use windows::Win32::UI::WindowsAndMessaging::{SM_CXSCREEN, SM_CYSCREEN};

  let (_screen_width, screen_height) =
    unsafe { (GetSystemMetrics(SM_CXSCREEN), GetSystemMetrics(SM_CYSCREEN)) };

  // If under 1080P, maximize the window
  //   and allow resize width and height.
  if screen_height < 1080 {
    window.maximize().unwrap();
    return;
  }

  let scale_factor = window.scale_factor().unwrap();

  const WIDTH: f64 = 1152.;
  const HEIGHT: f64 = 864.;

  // If the scaling factor is greater than 1.0,
  //   then adjust the window height.
  if scale_factor > 1. {
    let new_height = HEIGHT / scale_factor;
    window
      .set_size(tauri::LogicalSize::new(WIDTH, new_height))
      .unwrap();
  }

  // Only the minimum height adjustment is allowed
  window
    .set_min_size(Some(tauri::LogicalSize::new(WIDTH, 0.)))
    .unwrap();
}
