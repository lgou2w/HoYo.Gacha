// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::error::Error;
use std::fs::{create_dir, create_dir_all};
use std::path::PathBuf;
use std::sync::Arc;

use human_panic::setup_panic;
use time::format_description::FormatItem;
use time::macros::format_description;
use tracing::info;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::filter::LevelFilter;
use tracing_subscriber::fmt::time::LocalTime;
use tracing_subscriber::fmt::writer::MakeWriterExt;
use tracing_subscriber::{fmt, EnvFilter};

mod constants;
mod database;
mod diskcache;
mod error;
mod utilities;

use crate::database::{Database, DatabasePluginBuilder};
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

fn initialize_tracing() -> Result<Option<WorkerGuard>, Box<dyn Error>> {
  let filter = EnvFilter::builder()
    .from_env_lossy()
    .add_directive("hyper::proto=error".parse()?)
    .add_directive("tao::platform_impl=error".parse()?)
    .add_directive(
      if cfg!(debug_assertions) {
        LevelFilter::TRACE
      } else {
        LevelFilter::INFO
      }
      .into(),
    );

  const TRACING_TIME_FORMAT: &[FormatItem<'_>] =
    format_description!("[year]-[month]-[day] [hour]:[minute]:[second].[subsecond digits:9]");

  let subscriber = fmt()
    .with_env_filter(filter)
    .with_thread_ids(false)
    .with_thread_names(true)
    .with_timer(LocalTime::new(TRACING_TIME_FORMAT))
    .log_internal_errors(true);

  // Use stdout in debug, otherwise use a rolling file appender
  let appender_guard = if cfg!(debug_assertions) {
    subscriber
      .with_ansi(true)
      .with_line_number(true)
      .with_file(true)
      .with_thread_ids(true)
      .pretty()
      .init();

    None
  } else {
    // In release mode, flush logs to app local directory
    let appdata_local = utilities::paths::appdata_local();
    let logs_dir = appdata_local
      .join(constants::ID)
      .join(constants::LOGS_DIRECTORY);
    if !logs_dir.exists() {
      create_dir_all(&logs_dir).unwrap_or_else(|e| panic!("Failed to create logs directory: {e}"));
    }

    let file_appender =
      tracing_appender::rolling::daily(logs_dir, constants::LOGS_FILE_NAME_PREFIX);
    let (non_blocking, appender_guard) = tracing_appender::non_blocking(file_appender);
    subscriber
      .with_ansi(false)
      .with_writer(std::io::stdout.and(non_blocking))
      .init();

    Some(appender_guard)
  };

  Ok(appender_guard)
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
      create_dir(&app_dir).unwrap_or_else(|e| panic!("Failed to create app directory: {e}"));
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
  let mut app = tauri::Builder::default()
    .plugin(DatabasePluginBuilder::new(database).build())
    .setup(|app| {
      use tauri::Manager;
      let window = app.get_window("main").unwrap();

      // Apply window shadow
      // See: https://github.com/tauri-apps/window-shadows
      #[cfg(any(windows, target_os = "macos"))]
      window_shadows::set_shadow(&window, true).unwrap();

      // Open devtools in debug mode or when specifying environment variable
      if cfg!(debug_assertions) || std::env::var(constants::ENV_DEVTOOLS).is_ok() {
        window.open_devtools();
      }
      Ok(())
    })
    .build(tauri::generate_context!())
    .unwrap_or_else(|e| panic!("error while running Tauri application: {e}"));

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
  let appender_guard =
    initialize_tracing().unwrap_or_else(|e| panic!("Failed to initialize Tracing: {e}"));
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

  // Connect database
  let database = initialize_database()
    .await
    .unwrap_or_else(|e| panic!("Failed to initialize database: {e}"));
  info!("Database initialized");

  let database = Arc::new(database);

  // Start tauri and wait exit
  start(Arc::clone(&database)).await;

  // Wait for the appender to flush
  if let Some(guard) = appender_guard {
    info!("Flush Tracing logs...");
    drop(guard);
  }

  // Wait for database to close
  database.close().await;

  info!("bye!");
}
