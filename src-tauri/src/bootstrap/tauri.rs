use std::env;
use std::sync::atomic::Ordering;
use std::sync::{mpsc, Arc};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use tauri::webview::{WebviewWindow, WebviewWindowBuilder};
use tauri::{
  generate_context, generate_handler, Builder as TauriBuilder, Manager, RunEvent, Runtime,
  WebviewUrl,
};
use tauri::{Error as TauriError, Theme};
use tracing::{debug, info};

use super::ffi;
use super::internals::TAURI_MAIN_WINDOW_HWND;
use super::tracing::Tracing;
use crate::database::{self, Database, KvMut};
use crate::{business, consts};

pub struct Tauri;

impl Tauri {
  #[tracing::instrument(skip_all)]
  pub async fn start(tracing: Tracing, database: Database) {
    info!("Setting Tauri asynchronous runtime as Tokio...");
    tauri::async_runtime::set(tokio::runtime::Handle::current());

    let database = Arc::new(database);

    info!("Loading theme data...");
    let dark = KvMut::from(&database, consts::KV_THEME_DATA)
      .read_val_into_json::<ThemeData>()
      .await
      .expect("Error reading theme data from database")
      .transpose()
      .unwrap() // FIXME: serde_json::Error - Unless it's been tampered with.
      .is_some_and(|theme_data| matches!(theme_data.color_scheme, Theme::Dark));

    info!("Creating Tauri application...");
    let database_state = Arc::clone(&database);
    let app = TauriBuilder::default()
      .plugin(tauri_plugin_os::init())
      .setup(move |app| {
        // Database state
        // See: src/database/mod.rs
        app.manage(database_state);

        info!("Creating the Main window...");
        let main_window = Self::create_main_window(app, dark)?;

        #[cfg(windows)]
        if let Ok(hwnd) = main_window.hwnd() {
          info!("Tauri main window hwnd: {hwnd:?}");
          TAURI_MAIN_WINDOW_HWND.store(hwnd.0, Ordering::Relaxed);
        }

        // Setting window vibrancy and theme if without decorators
        if !consts::TAURI_MAIN_WINDOW_DECORATIONS {
          info!("Setting the vibrancy and theme of the main window...");
          ffi::set_window_vibrancy(&main_window);
          ffi::set_window_theme(&main_window, dark);

          // FIXME: Setting margins in Windows 10 results
          // in a 1px white border at the top of the window.
          #[cfg(windows)]
          if consts::PLATFORM.windows.is_21h2_and_higher {
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
        core_set_window_theme,
        database::kv_questioner::database_find_kv,
        database::kv_questioner::database_create_kv,
        database::kv_questioner::database_update_kv,
        database::kv_questioner::database_upsert_kv,
        database::kv_questioner::database_delete_kv,
        database::account_questioner::database_find_accounts_by_business,
        database::account_questioner::database_find_account_by_business_and_uid,
        database::account_questioner::database_create_account,
        database::account_questioner::database_update_account_data_dir_by_business_and_uid,
        database::account_questioner::database_update_account_gacha_url_by_business_and_uid,
        database::account_questioner::database_update_account_properties_by_business_and_uid,
        database::account_questioner::database_delete_account_by_business_and_uid,
        database::gacha_record_questioner::database_find_gacha_records_by_business_and_uid,
        database::gacha_record_questioner::database_find_gacha_records_by_business_and_uid_with_gacha_type,
        database::gacha_record_questioner_additions::database_create_gacha_records,
        database::gacha_record_questioner_additions::database_delete_gacha_records_by_business_and_uid,
        business::business_locate_data_folder,
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

      if let Some(inner) = Arc::into_inner(database) {
        inner.close().await;
      }

      tracing.close();
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
          .inspect_err(|e| eprintln!("Error while waiting for cleanup: {e}"));
      }
    });
  }

  fn create_main_window<M, R>(manager: &mut M, dark: bool) -> Result<WebviewWindow<R>, TauriError>
  where
    R: Runtime,
    M: Manager<R>,
  {
    WebviewWindowBuilder::new(
      manager,
      consts::TAURI_MAIN_WINDOW_LABEL,
      WebviewUrl::App(consts::TAURI_MAIN_WINDOW_ENTRYPOINT.into()),
    )
    .title(consts::TAURI_MAIN_WINDOW_TITLE)
    .min_inner_size(
      consts::TAURI_MAIN_WINDOW_WIDTH,
      consts::TAURI_MAIN_WINDOW_HEIGHT,
    )
    .fullscreen(consts::TAURI_MAIN_WINDOW_FULLSCREEN)
    .resizable(consts::TAURI_MAIN_WINDOW_RESIZABLE)
    .decorations(consts::TAURI_MAIN_WINDOW_DECORATIONS)
    .transparent(!consts::TAURI_MAIN_WINDOW_DECORATIONS)
    .theme(if dark {
      Some(Theme::Dark)
    } else {
      Some(Theme::Light)
    })
    .center()
    .build()
  }
}

// Theme

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ThemeData {
  pub namespace: String,
  pub color_scheme: Theme,
  pub scale: u32,
}

// Core commands

#[tauri::command]
fn core_set_window_theme(window: WebviewWindow, dark: bool) -> Result<(), tauri::Error> {
  ffi::set_window_theme(&window, dark);
  ffi::set_webview_theme(&window, dark)?;
  Ok(())
}