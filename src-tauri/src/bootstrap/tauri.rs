use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::{env, process};

use os_info::Info as OsInfo;
use tauri::webview::{WebviewWindow, WebviewWindowBuilder};
use tauri::{
  Builder as TauriBuilder, Emitter, Error as TauriError, Manager, Monitor, PhysicalPosition,
  PhysicalSize, Runtime, Theme, WebviewUrl, WindowEvent, generate_context, generate_handler,
};
use tracing::{debug, error, info};

use super::ffi;
use super::internals;
use super::singleton::Singleton;
use super::tracing::Tracing;
use super::updater::Updater;
use crate::business::GachaMetadata;
use crate::database::{self, Database, KvMut};
use crate::models::{ThemeData, WindowState};
use crate::utilities::file_dialog;
use crate::{business, consts};

struct WindowStateCache(Arc<Mutex<WindowState>>);

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
    .expect("Error deserializing theme data from database") // FIXME: Remove invalid data
    .and_then(|theme_data| theme_data.color_scheme)
    .unwrap_or_else(|| {
      if cfg!(windows) {
        ffi::apps_use_theme()
      } else {
        Theme::Light
      }
    });

  info!("Loading window state...");
  let window_state = KvMut::from(&database, consts::KV_WINDOW_STATE)
    .try_read_val_json::<WindowState>()
    .await
    .expect("Error reading window state from database")
    .transpose()
    .expect("Error deserializing window state from database");

  let is_some_window_state = window_state.is_some();

  fn update_window_state(state: &mut WindowState, window: &WebviewWindow) -> tauri::Result<()> {
    state.maximized = window.is_maximized()?;

    if !state.maximized {
      let size = window.inner_size()?;
      if size.width > 0 && size.height > 0 {
        state.width = size.width;
        state.height = size.height;
      }

      let position = window.outer_position()?;
      state.x = position.x;
      state.y = position.y;
    }

    Ok(())
  }

  info!("Creating Tauri application...");
  let database_state = Arc::clone(&database);
  let app = TauriBuilder::default()
    .plugin(tauri_plugin_clipboard_manager::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_shell::init())
    .setup(move |app| {
      // Database state
      // See: src/database/mod.rs
      app.manage(database_state);
      app.manage(WindowStateCache(Arc::new(Mutex::new(window_state.unwrap_or_default()))));

      info!("Creating the Main window...");
      let main_window = create_main_window(app, color_scheme)?;

      info!("Restoring window state...");
      let window_state_cache = app.state::<WindowStateCache>();
      let mut window_state = window_state_cache.inner().0.lock().unwrap();

      if is_some_window_state {
        fn intersects(monitor: &Monitor, position: PhysicalPosition<i32>, size: PhysicalSize<u32>) -> bool {
          let PhysicalPosition { x, y } = *monitor.position();
          let PhysicalSize { width, height } = *monitor.size();

          let left = x;
          let right = x + width as i32;
          let top = y;
          let bottom = y + height as i32;

          [
            (position.x, position.y),
            (position.x + size.width as i32, position.y),
            (position.x, position.y + size.height as i32),
            (
              position.x + size.width as i32,
              position.y + size.height as i32,
            )
          ]
          .into_iter()
          .any(|(x, y)| x >= left && x < right && y >= top && y < bottom)
        }

        let position = PhysicalPosition {
          x: window_state.x,
          y: window_state.y,
        };

        let size = PhysicalSize {
          width: window_state.width,
          height: window_state.height,
        };

        for monitor in main_window.available_monitors()? {
          if intersects(&monitor, position, size) {
            main_window.set_position(PhysicalPosition {
              x: if window_state.maximized { window_state.prev_x } else { window_state.x },
              y: if window_state.maximized { window_state.prev_y } else { window_state.y },
            })?;
          }
        }

        main_window.set_size(size)?;

        if window_state.maximized {
          main_window.maximize()?;
        }
      } else {
        let _ = update_window_state(&mut window_state, &main_window);
      }

      // HACK: Delay window show to avoid moving animation
      main_window.show()?;

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
        info!("Setting the vibrancy and theme to main window...");
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
      let devtools = cfg!(debug_assertions) || env::var(consts::ENV_DEVTOOLS).is_ok();
      if devtools {
        debug!("Opens the developer tools window...");
        main_window.open_devtools();
      }

      // Set webview accelerator keys
      ffi::set_webview_accelerator_keys_enabled(&main_window, devtools)?;

      // Force load metadata and create a thread to check if it needs to be updated
      {
        let _ = GachaMetadata::current();

        // Update Gacha metadata if needed
        tokio::spawn(async move {
          if let Err(error) = GachaMetadata::update().await {
            tracing::error!(message = "Failed to update Gacha metadata", ?error);
          }
        });
      }

      info!("Application setup completed");
      Ok(())
    })
    .on_window_event(|window, event| {
      if window.label() != consts::TAURI_MAIN_WINDOW_LABEL {
        return;
      }

      match event {
        WindowEvent::CloseRequested { .. } => {
          let main_window = window.get_webview_window(consts::TAURI_MAIN_WINDOW_LABEL).unwrap();
          let window_state_cache = window.state::<WindowStateCache>();
          let mut window_state = window_state_cache.inner().0.lock().unwrap();

          match update_window_state(&mut window_state, &main_window) {
            Err(error) => error!("Failed to update window state: {error}"),
            Ok(_) => {
              let database = window.state::<Arc<Database>>();
              let ret = tokio::task::block_in_place(move || {
                tauri::async_runtime::block_on(async move {
                  KvMut::from(&database, consts::KV_WINDOW_STATE)
                    .try_write_json(&*window_state)
                    .await
                })
              });

              debug!("Saving window state to database: {ret:?}");
            }
          }
        },
        WindowEvent::Moved(position) => {
          let window_state_cache = window.state::<WindowStateCache>();
          let mut window_state = window_state_cache.inner().0.lock().unwrap();
          window_state.prev_x = window_state.x;
          window_state.prev_y = window_state.y;
          window_state.x = position.x;
          window_state.y = position.y;
        },
        WindowEvent::Resized(size) => {
          let is_maximized = window.is_maximized().unwrap_or_default();
          let is_minimized = window.is_minimized().unwrap_or_default();
          if !is_maximized && !is_minimized {
            let window_state_cache = window.state::<WindowStateCache>();
            let mut window_state = window_state_cache.inner().0.lock().unwrap();
            window_state.width = size.width;
            window_state.height = size.height;
          }
        },
        _ => {},
      }
    })
    .invoke_handler(generate_handler![
      core_os_info,
      core_locale,
      core_webview2_version,
      core_tauri_version,
      core_git_commit,
      core_is_supported_window_vibrancy,
      core_change_theme,
      core_create_app_lnk,
      core_pick_file,
      core_pick_folder,
      core_updater_is_updating,
      core_updater_update,
      database::database_execute,
      database::kv_questioner::database_find_kv,
      database::kv_questioner::database_create_kv,
      database::kv_questioner::database_update_kv,
      database::kv_questioner::database_upsert_kv,
      database::kv_questioner::database_delete_kv,
      database::account_questioner::database_find_accounts_by_business,
      database::account_questioner::database_find_account_by_business_and_uid,
      database::account_questioner::database_create_account,
      database::account_questioner::database_update_account_data_folder_by_business_and_uid,
      database::account_questioner::database_update_account_properties_by_business_and_uid,
      database::account_questioner::database_delete_account_by_business_and_uid,
      database::gacha_record_questioner::database_find_gacha_records_by_uid,
      database::gacha_record_questioner::database_find_gacha_records_by_business_and_uid,
      database::gacha_record_questioner::database_find_gacha_records_by_business_and_uid_with_limit,
      database::gacha_record_questioner::database_find_gacha_records_by_business_and_uid_with_gacha_type,
      database::gacha_record_questioner_additions::database_create_gacha_records,
      database::gacha_record_questioner_additions::database_delete_gacha_records_by_business_and_uid,
      database::gacha_record_questioner_additions::database_find_gacha_records_by_businesses_and_uid,
      database::gacha_record_questioner_additions::database_find_gacha_records_by_businesses_or_uid,
      database::database_legacy_migration,
      business::business_locate_data_folder,
      business::business_from_webcaches_gacha_url,
      business::business_from_dirty_gacha_url,
      business::business_create_gacha_records_fetcher,
      business::business_import_gacha_records,
      business::business_export_gacha_records,
      business::business_find_and_pretty_gacha_records,
      business::business_gacha_metadata_is_updating,
      business::business_gacha_metadata_update,
    ])
    .build(generate_context!())
    .expect("Error while building Tauri application");

  let exit_code = app.run_return(|_app_handle, _event| {});

  info!("Tauri exiting...");
  database.close().await;
  tracing.close();
  drop(singleton);

  process::exit(exit_code)
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
  .visible(false) // HACK: Restore and show
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
fn core_git_commit() -> serde_json::Value {
  serde_json::json!({
    "hash": consts::GIT_COMMIT_HASH,
    "date": consts::GIT_COMMIT_DATE,
  })
}

#[tauri::command]
fn core_create_app_lnk() {
  let _ = ffi::create_app_lnk();
}

#[tauri::command]
fn core_is_supported_window_vibrancy() -> bool {
  ffi::is_supported_window_vibrancy()
}

#[tauri::command]
fn core_change_theme(window: WebviewWindow, color_scheme: Theme) -> Result<(), tauri::Error> {
  if !consts::TAURI_MAIN_WINDOW_DECORATIONS {
    ffi::set_window_theme(&window, color_scheme);
    ffi::set_webview_theme(&window, color_scheme)?;
  }
  Ok(())
}

#[tauri::command]
async fn core_pick_file(
  title: Option<String>,
  directory: Option<PathBuf>,
  filters: Option<Vec<(String, Vec<String>)>>,
) -> Option<PathBuf> {
  let mut rfd = file_dialog::create()
    .set_title(title.unwrap_or_default())
    .set_directory(directory.as_ref().unwrap_or(&PathBuf::default()));

  if let Some(filters) = filters {
    for (name, extensions) in filters {
      rfd = rfd.add_filter(name, &extensions);
    }
  }

  rfd.pick_file().await.map(Into::into)
}

#[tauri::command]
async fn core_pick_folder(title: Option<String>, directory: Option<PathBuf>) -> Option<PathBuf> {
  file_dialog::create()
    .set_title(title.unwrap_or_default())
    .set_directory(directory.as_ref().unwrap_or(&PathBuf::default()))
    .pick_folder()
    .await
    .map(Into::into)
}

#[tauri::command]
async fn core_updater_is_updating() -> bool {
  Updater::is_updating()
}

#[tauri::command]
async fn core_updater_update(
  window: WebviewWindow,
  progress_channel: String,
) -> Result<(), String> {
  Updater::update(Box::new(move |progress| {
    window.emit(&progress_channel, progress)?;
    Ok(())
  }))
  .await
  .map_err(|e| e.to_string())
}
