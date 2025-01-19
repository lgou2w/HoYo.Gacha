use std::env;
use std::sync::{mpsc, Arc};
use std::time::Duration;

use os_info::Info as OsInfo;
use tauri::webview::{WebviewWindow, WebviewWindowBuilder};
use tauri::{
  generate_context, generate_handler, Builder as TauriBuilder, Manager, RunEvent, Runtime,
  WebviewUrl,
};
use tauri::{Error as TauriError, Theme};
use tracing::{debug, info};

use super::ffi;
use super::internals;
use super::singleton::Singleton;
use super::tracing::Tracing;
use crate::database::{self, Database, KvMut};
use crate::models::ThemeData;
use crate::{business, consts};

#[tracing::instrument(skip_all)]
pub async fn start(singleton: Singleton, tracing: Tracing, database: Database) {
  info!("Setting Tauri asynchronous runtime as Tokio...");
  tauri::async_runtime::set(tokio::runtime::Handle::current());

  // Arc shared database to Tauri state
  let database = Arc::new(database);

  info!("Loading theme data...");
  let color_scheme = KvMut::from(&database, consts::KV_THEME_DATA)
    .try_read_val_json::<ThemeData>()
    .await
    .expect("Error reading theme data from database")
    .transpose()
    .unwrap() // FIXME: serde_json::Error - Unless it's been tampered with.
    .map(|theme_data| theme_data.color_scheme)
    .unwrap_or_else(|| {
      if cfg!(windows) {
        ffi::apps_use_theme()
      } else {
        Theme::Light
      }
    });

  info!("Creating Tauri application...");
  let database_state = Arc::clone(&database);
  let app = TauriBuilder::default()
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(tauri_plugin_shell::init())
    .setup(move |app| {
      // Database state
      // See: src/database/mod.rs
      app.manage(database_state);

      info!("Creating the Main window...");
      let main_window = create_main_window(app, color_scheme)?;

      #[cfg(windows)]
      ffi::webview_version(&main_window, |version| {
        info!("Webview2 Runtime version: {version}");
        #[allow(static_mut_refs)]
        unsafe { WEBVIEW2_VERSION.replace(version) };
      })?;

      #[cfg(windows)]
      if let Ok(hwnd) = main_window.hwnd() {
        info!("Tauri main window hwnd: {hwnd:?}");
        internals::set_tauri_main_window_hwnd(hwnd.0 as _);
      }

      // Setting window vibrancy and theme if without decorators
      if !consts::TAURI_MAIN_WINDOW_DECORATIONS {
        info!("Setting the vibrancy and theme of the main window...");
        ffi::set_window_vibrancy(&main_window);
        ffi::set_window_theme(&main_window, color_scheme);
        ffi::set_webview_theme(&main_window, color_scheme)?;

        // FIXME: Setting margins in Windows 10 results
        // in a 1px white border at the top of the window.
        #[cfg(windows)]
        if consts::WINDOWS.is_21h2_and_higher {
          ffi::set_window_shadow(&main_window, true);
        }
      }

      // Open devtools in debug or when specifying environment variable
      if cfg!(debug_assertions) || env::var(consts::ENV_DEVTOOLS).is_ok() {
        debug!("Opens the developer tools window...");
        main_window.open_devtools();
      }

      Ok(())
    })
    .invoke_handler(generate_handler![
      core_os_info,
      core_locale,
      core_webview2_version,
      core_tauri_version,
      core_change_theme,
      database::kv_questioner::database_find_kv,
      database::kv_questioner::database_create_kv,
      database::kv_questioner::database_update_kv,
      database::kv_questioner::database_upsert_kv,
      database::kv_questioner::database_delete_kv,
      database::account_questioner::database_find_accounts_by_business,
      database::account_questioner::database_find_account_by_business_and_uid,
      database::account_questioner::database_create_account,
      database::account_questioner::database_update_account_data_folder_by_business_and_uid,
      database::account_questioner::database_update_account_gacha_url_by_business_and_uid,
      database::account_questioner::database_update_account_properties_by_business_and_uid,
      database::account_questioner::database_delete_account_by_business_and_uid,
      database::gacha_record_questioner::database_find_gacha_records_by_uid,
      database::gacha_record_questioner::database_find_gacha_records_by_business_and_uid,
      database::gacha_record_questioner::database_find_gacha_records_by_business_and_uid_with_gacha_type,
      database::gacha_record_questioner_additions::database_create_gacha_records,
      database::gacha_record_questioner_additions::database_delete_gacha_records_by_business_and_uid,
      database::gacha_record_questioner_additions::database_find_gacha_records_by_businesses_and_uid,
      database::gacha_record_questioner_additions::database_find_gacha_records_by_businesses_or_uid,
      business::business_locate_data_folder,
      business::business_from_webcaches_gacha_url,
      business::business_from_dirty_gacha_url,
      business::business_create_gacha_records_fetcher_channel,
      business::business_import_gacha_records,
      business::business_export_gacha_records,
      business::business_find_and_pretty_gacha_records,
    ])
    .build(generate_context!())
    .expect("Error while building Tauri application");

  // FIXME: Need a better way.
  //   The `app.run_iteration` causes high cpu usage, which is a Tauri problem.
  //   And `app.run` receives the `FnMut` callback, so it can only use two `sync_channel`
  //   implementations to wait for resources to be released before exiting.
  // See:
  //   https://github.com/tauri-apps/tauri/issues/10373
  //   https://github.com/tauri-apps/tauri/issues/8631

  let release = async move {
    info!("Cleanup");

    // Arc resources can't get Ownership using `Arc::into_inner`.
    // This is because a resource managed by a Tauri State is not Dropped until it exits.
    // See:
    //  https://github.com/tauri-apps/tauri/issues/5167
    //  https://github.com/tauri-apps/tauri/issues/7358
    database.close().await;

    tracing.close();
    drop(singleton);
  };

  let (exiting_sender, exiting_receiver) = mpsc::sync_channel::<()>(0);
  let (exited_sender, exited_receiver) = mpsc::sync_channel::<()>(0);

  tauri::async_runtime::spawn(async move {
    // Receive the first signal,
    // release the resources and respond to the another signal.
    exiting_receiver.recv().unwrap();
    debug!("Exiting signal received");

    release.await;
    exited_sender.send(()).unwrap();
  });

  app.run(move |_app_handle, event| {
    if let RunEvent::Exit = event {
      // Send a signal and wait for another signal to completed
      info!("Tauri exiting...");
      exiting_sender.send(()).unwrap();

      // Maximum 5 seconds to wait for cleanup,
      // otherwise the Tauri handles the exit directly.
      let _ = exited_receiver
        .recv_timeout(Duration::from_secs(5))
        .inspect_err(|e| println!("Error while waiting for cleanup: {e}"));
    }
  });

  // HACK: Don't put any code after `app.run`.
  //   Because until the issues above are resolved,
  //   the app will always be interrupted by Tauri
  //   instead of exiting naturally!
}

fn create_main_window<M, R>(
  manager: &mut M,
  color_scheme: Theme,
) -> Result<WebviewWindow<R>, TauriError>
where
  R: Runtime,
  M: Manager<R>,
{
  WebviewWindowBuilder::new(
    manager,
    consts::TAURI_MAIN_WINDOW_LABEL,
    WebviewUrl::App(consts::TAURI_MAIN_WINDOW_ENTRYPOINT.into()),
  )
  .window_classname(consts::TAURI_MAIN_WINDOW_CLASSNAME)
  .title(consts::TAURI_MAIN_WINDOW_TITLE)
  .inner_size(
    consts::TAURI_MAIN_WINDOW_WIDTH,
    consts::TAURI_MAIN_WINDOW_HEIGHT,
  )
  .fullscreen(consts::TAURI_MAIN_WINDOW_FULLSCREEN)
  .resizable(consts::TAURI_MAIN_WINDOW_RESIZABLE)
  .decorations(consts::TAURI_MAIN_WINDOW_DECORATIONS)
  .transparent(!consts::TAURI_MAIN_WINDOW_DECORATIONS)
  .theme(Some(color_scheme))
  .center()
  .build()
}

// Core commands

static mut WEBVIEW2_VERSION: Option<String> = None;

#[tauri::command]
fn core_os_info() -> &'static OsInfo {
  &consts::OS_INFO
}

#[tauri::command]
fn core_locale() -> &'static Option<String> {
  &consts::LOCALE.value
}

#[tauri::command]
fn core_webview2_version() -> &'static str {
  #[allow(static_mut_refs)]
  unsafe { WEBVIEW2_VERSION.as_deref() }.unwrap_or("Unknown")
}

#[tauri::command]
fn core_tauri_version() -> &'static str {
  tauri::VERSION
}

#[tauri::command]
fn core_change_theme(window: WebviewWindow, color_scheme: Theme) -> Result<(), tauri::Error> {
  if !consts::TAURI_MAIN_WINDOW_DECORATIONS {
    ffi::set_window_theme(&window, color_scheme);
    ffi::set_webview_theme(&window, color_scheme)?;
  }
  Ok(())
}
