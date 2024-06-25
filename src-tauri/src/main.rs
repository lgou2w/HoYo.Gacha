// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::error::Error;
use std::fs::{create_dir, create_dir_all};
use std::path::PathBuf;
use std::sync::Arc;

use human_panic::setup_panic;
use tauri::{Builder as TauriBuilder, WindowBuilder, WindowUrl};
use time::format_description::FormatItem;
use time::macros::format_description;
use tracing::info;
use tracing_appender::non_blocking as non_blocking_appender;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_appender::rolling::RollingFileAppender;
use tracing_subscriber::fmt::time::LocalTime;
use tracing_subscriber::fmt::writer::MakeWriterExt;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::EnvFilter;

mod constants;
mod database;
mod diskcache;
mod error;
mod gacha;
mod models;
mod utilities;

use crate::database::{Database, DatabasePluginBuilder};
use crate::gacha::business::GachaBusinessPluginBuilder;
use crate::gacha::convert::GachaConvertPluginBuilder;
use crate::utilities::paths::appdata_roaming;

fn welcome() {
  println!(
    r"
   _   _    __   __     ____            _
  | | | | __\ \ / /__  / ___| __ _  ___| |__   __ _
  | |_| |/ _ \ V / _ \| |  _ / _` |/ __| '_ \ / _` |
  |  _  | (_) | | (_) | |_| | (_| | (__| | | | (_| |
  |_| |_|\___/|_|\___(_)____|\__,_|\___|_| |_|\__,_|  v{version}

  by {authors}
  {git}
  ",
    version = constants::VERSION,
    authors = constants::AUTHORS,
    git = constants::REPOSITORY
  )
}

fn initialize_tracing() -> Option<WorkerGuard> {
  const TRACING_TIME_FORMAT: &[FormatItem<'_>] =
    format_description!("[year]-[month]-[day] [hour]:[minute]:[second].[subsecond digits:9]");

  let filter = EnvFilter::builder()
    .from_env_lossy()
    .add_directive("hyper=error".parse().unwrap())
    .add_directive("reqwest=error".parse().unwrap())
    .add_directive("tao::platform_impl=error".parse().unwrap())
    .add_directive("wry::webview=error".parse().unwrap());

  // Use stdout in debug, otherwise use a rolling file appender
  if cfg!(debug_assertions) {
    tracing_subscriber::registry()
      .with(
        tracing_subscriber::fmt::layer()
          .with_ansi(true)
          .with_line_number(true)
          .with_file(true)
          .with_thread_ids(true)
          .with_thread_names(true)
          .with_timer(LocalTime::new(TRACING_TIME_FORMAT))
          .log_internal_errors(true)
          .pretty(),
      )
      .with(filter);

    None
  } else {
    // In release mode, flush logs to app local directory
    let appdata_local = utilities::paths::appdata_local();
    let logs_dir = appdata_local
      .join(constants::ID)
      .join(constants::LOGS_DIRECTORY);

    if !logs_dir.exists() {
      create_dir_all(&logs_dir).expect("Failed to create logs directory");
    }

    let file_appender = RollingFileAppender::builder()
      .rotation(constants::LOGS_ROTATION)
      .max_log_files(constants::LOGS_MAX_FILES)
      .filename_prefix(constants::LOGS_FILE_NAME_PREFIX)
      .filename_suffix(constants::LOGS_FILE_NAME_SUFFIX)
      .build(logs_dir)
      .expect("failed to initialize rolling file appender");

    let (non_blocking, appender_guard) = non_blocking_appender(file_appender);

    tracing_subscriber::registry()
      .with(
        tracing_subscriber::fmt::layer()
          .with_thread_ids(false)
          .with_thread_names(true)
          .with_timer(LocalTime::new(TRACING_TIME_FORMAT))
          .with_writer(std::io::stdout.and(non_blocking)),
      )
      .with(filter);

    Some(appender_guard)
  }
}

async fn initialize_database() -> Result<Database, Box<dyn Error>> {
  // Database storage directory
  //   In debug mode  : is in the src-tauri directory
  //   In release mode: is in the appdata_roaming/{ID}
  //     Windows -> %APPDATA%\\Roaming\\{ID}
  //     MacOS   -> %HOME%/Library/Application Support/{ID}
  let db_file = if cfg!(debug_assertions) {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(constants::DATABASE)
  } else {
    let app_dir = appdata_roaming().join(constants::ID);
    if !app_dir.exists() {
      create_dir(&app_dir).expect("Failed to create app directory");
    }

    app_dir.join(constants::DATABASE)
  };

  info!("Connect to the database: {db_file:?}");
  let database = Database::from_file(db_file).await?;

  // Wait to initialize database
  database.initialize().await?;

  Ok(database)
}

async fn start(database: Arc<Database>) {
  info!("Setting Tauri asynchronous runtime as Tokio...");
  tauri::async_runtime::set(tokio::runtime::Handle::current());

  info!("Starting Tauri application...");
  let mut app = TauriBuilder::default()
    .plugin(DatabasePluginBuilder::new(database).build())
    .plugin(GachaBusinessPluginBuilder::new().build())
    .plugin(GachaConvertPluginBuilder::new().build())
    .setup(|app| {
      let window = WindowBuilder::new(app, "main", WindowUrl::App("index.html".into()))
        .center()
        .fullscreen(false)
        .resizable(true)
        .decorations(false)
        .transparent(false)
        .min_inner_size(1152.0, 864.0)
        .title(constants::NAME)
        .build()?;

      #[cfg(windows)]
      utilities::windows::set_window_shadow(&window, true);

      // FIXME: https://github.com/tauri-apps/tauri/issues/8180
      // // Apply window vibrancy
      // // See: https://github.com/tauri-apps/window-vibrancy
      // #[cfg(windows)]
      // {
      //   let vibrancy = window_vibrancy::apply_mica(&window, Some(true)).is_ok()
      //     || window_vibrancy::apply_acrylic(&window, Some((18, 18, 18, 125))).is_ok();

      //     // Set WebView2 Theme
      //     utilities::windows::set_webview_theme(&window, vibrancy);

      //     match window.eval(&format!(
      //       "window.localStorage.setItem('WINDOW_VIBRANCY', {vibrancy});"
      //     )) {
      //       Ok(_) => info!("Mica or Acrylic window effects applied successfully!"),
      //       Err(error) => {
      //         error!("Failed to execute window vibrancy js script: {error}");
      //         if vibrancy {
      //           info!("Clear window effects...");
      //           let _ = window_vibrancy::clear_mica(&window);
      //           let _ = window_vibrancy::clear_acrylic(&window);
      //         }
      //       }
      //     }
      // }

      // Open devtools in debug mode or when specifying environment variable
      if cfg!(debug_assertions) || std::env::var(constants::ENV_DEVTOOLS).is_ok() {
        window.open_devtools();
      }

      Ok(())
    })
    .build(tauri::generate_context!())
    .expect("error while running Tauri application");

  info!("Waiting for the Tauri event loop...");
  loop {
    let iteration = app.run_iteration();
    if iteration.window_count == 0 {
      break;
    }
  }
  info!("Tauri exited");
}

#[tokio::main(flavor = "multi_thread")]
async fn main() {
  setup_panic!();
  welcome();

  // Initialize Tracing and appender
  let appender_guard = initialize_tracing();
  info!("Tracing initialized");

  // App env
  // TODO: More app info
  info!(
    "Current env: {}",
    if cfg!(debug_assertions) {
      "DEBUG"
    } else {
      "RELEASE"
    }
  );
  #[cfg(windows)]
  info!(
    "Windows version: {:?}",
    windows_version::OsVersion::current()
  );

  // Connect database
  let database = initialize_database()
    .await
    .expect("Failed to initialize database");

  info!("Database initialized");

  let database = Arc::new(database);

  // Start tauri and wait exit
  start(Arc::clone(&database)).await;

  // Wait for database to close
  if let Some(inner) = Arc::into_inner(database) {
    inner.close().await;
  }

  info!("bye!");

  // Wait for the appender to flush
  if let Some(guard) = appender_guard {
    drop(guard);
  }
}
