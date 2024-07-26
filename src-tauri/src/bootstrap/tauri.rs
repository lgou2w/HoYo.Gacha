use std::env;
use std::sync::atomic::Ordering;
use std::sync::{mpsc, Arc};
use std::time::Duration;

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
use crate::database::{self, Database};
use crate::{business, consts};

pub struct Tauri;

impl Tauri {
  #[tracing::instrument(skip_all)]
  pub fn start(tracing: Tracing, database: Database) {
    info!("Setting Tauri asynchronous runtime as Tokio...");
    tauri::async_runtime::set(tokio::runtime::Handle::current());

    let database = Arc::new(database);

    info!("Creating Tauri application...");
    let app = TauriBuilder::default()
      .plugin(tauri_plugin_os::init())
      .plugin(database::tauri_plugin(Arc::clone(&database)))
      .plugin(business::tauri_plugin())
      .setup(|app| {
        info!("Creating the Main window...");
        let main_window = Self::create_main_window(app)?;

        #[cfg(windows)]
        if let Ok(hwnd) = main_window.hwnd() {
          info!("Tauri main window hwnd: {hwnd:?}");
          TAURI_MAIN_WINDOW_HWND.store(hwnd.0, Ordering::Relaxed);
        }

        // Setting window mica and theme if without decorators
        if !consts::TAURI_MAIN_WINDOW_DECORATIONS {
          info!("Setting the mica and theme of the main window...");
          ffi::set_window_mica(&main_window);
          ffi::set_window_theme(
            &main_window,
            matches!(consts::TAURI_MAIN_WINDOW_THEME, Some(Theme::Dark)),
          );
        }

        #[cfg(windows)]
        if consts::WINDOWS_VERSION.build >= 22000 {
          ffi::set_window_shadow(&main_window, true);
        }

        // Open devtools in debug or when specifying environment variable
        if cfg!(debug_assertions) || env::var(consts::ENV_DEVTOOLS).is_ok() {
          debug!("Opens the developer tools window...");
          main_window.open_devtools();
        }

        Ok(())
      })
      .invoke_handler(generate_handler![change_theme])
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
        debug!("Sending an exiting signal...");
        exiting_sender.send(()).unwrap();

        // Maximum 5 seconds to wait for cleanup,
        // otherwise the Tauri handles the exit directly.
        let _ = exited_receiver
          .recv_timeout(Duration::from_secs(5))
          .inspect_err(|e| eprintln!("Error while waiting for cleanup: {e}"));
      }
    });
  }

  fn create_main_window<M, R>(manager: &mut M) -> Result<WebviewWindow<R>, TauriError>
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
    .transparent(consts::TAURI_MAIN_WINDOW_TRANSPARENT)
    .theme(consts::TAURI_MAIN_WINDOW_THEME)
    .center()
    .build()
  }
}

// Common commands

#[tauri::command]
fn change_theme(window: WebviewWindow, dark: bool) {
  ffi::set_window_theme(&window, dark);
  // TODO: change Webview2 Theme
}
