use std::error::Error as StdError;
use std::sync::Arc;

use tauri::ipc::Invoke;
use tauri::webview::WebviewWindowBuilder;
use tauri::{App, Builder as TauriBuilder, Manager, Theme, WebviewUrl, Window, WindowEvent, Wry};
use tauri::{generate_context, generate_handler};
use tracing::{debug, error, info};

use crate::bootstrap::context::Context;
use crate::bootstrap::environment::Environment;
use crate::bootstrap::state::{AppState, WindowState};
use crate::business::metadata::Metadata;
use crate::constants;
use crate::database::Database;

// Main window configuration
const MAIN_WINDOW_LABEL: &str = "main";
const MAIN_WINDOW_ENTRYPOINT: &str = "index.html"; // See: Vite
const MAIN_WINDOW_CLASSNAME: &str = constants::ID;
const MAIN_WINDOW_TITLE: &str = constants::APP_NAME;
const MAIN_WINDOW_WIDTH: f64 = 1280.;
const MAIN_WINDOW_HEIGHT: f64 = 720.;
const MAIN_WINDOW_FULLSCREEN: bool = false;
const MAIN_WINDOW_RESIZABLE: bool = true;
const MAIN_WINDOW_DECORATIONS: bool = false;

// KeyPairs
const KEY_THEME_DATA: &str = "HG_THEME_DATA";

// Events
const EVENT_THEME_CHANGED: &str = "HG_THEME_CHANGED";

// Tauri application lifecycle
pub async fn run(context: Context) -> ! {
  info!("Running Tauri application...");

  // Wrap the context in an Arc for shared ownership
  let context = Arc::new(context);

  // Set the async runtime handle for Tauri
  tauri::async_runtime::set(tokio::runtime::Handle::current());

  // Load and evaluate the theme data
  let color_scheme = load_and_evaluate_theme(&context).await;

  // Load and evaluate the window state
  let window_state = context.state.load_and_evaluate_window_state();

  // Build and run the Tauri application
  let exit_code = {
    debug!("Creating Tauri application...");

    let context_cloned = Arc::clone(&context);
    let app = TauriBuilder::default()
      .plugin(tauri_plugin_clipboard_manager::init())
      .plugin(tauri_plugin_shell::init())
      .setup(move |app| setup(app, context_cloned, color_scheme, window_state))
      .on_window_event(on_window_event)
      .invoke_handler(command_handlers())
      .build(generate_context!())
      .expect("error while building Tauri application");

    // Initialize AppsUseThemeMonitor
    #[cfg(windows)]
    let monitor = {
      info!("Initializing AppsUseThemeMonitor...");

      let app_handle_cloned = app.handle().clone(); // Internal arc
      let app_state_cloned = Arc::clone(&context.state);
      hg_ffi::AppsUseThemeMonitor::new(move |result| match result {
        Err(err) => error!(message = "Error in monitoring AppsUseTheme", ?err),
        Ok(theme) => {
          // Apply the new theme to the main window
          // Only if the app state is set to follow system theme
          // Also emit an event to notify the frontend
          if let Some(window) = app_handle_cloned.get_webview_window(MAIN_WINDOW_LABEL)
            && app_state_cloned.is_follow_system_theme()
          {
            use tauri::Emitter;
            info!(message = "Detected system theme change", ?theme);
            let _ = hg_ffi::apply_window_color_scheme(&window, theme);
            let _ = window.emit(EVENT_THEME_CHANGED, theme);
          }
        }
      })
      .expect("Failed to initialize AppsUseThemeMonitor")
    };

    // Wait for it to exit
    debug!("Starting Tauri application...");
    let exit_code = app.run_return(|_, _| {});

    // Stop the monitor when the app exits
    #[cfg(windows)]
    monitor.stop();

    // Return the exit code
    exit_code
  };

  // Close the context and exit the process
  info!(message = "Tauri application exited", exit_code);
  Arc::into_inner(context)
    .expect("Unable to get context ownership")
    .close(exit_code)
    .await
}

// Setup function for Tauri application
#[tracing::instrument(skip_all)]
fn setup(
  app: &mut App,
  context: Arc<Context>,
  color_scheme: Theme,
  window_state: Option<WindowState>,
) -> Result<(), Box<dyn StdError + 'static>> {
  debug!("Setting up Tauri application...");

  // Shared to Tauri state
  let has_window_state = window_state.is_some();
  let window_state = window_state.unwrap_or_default();
  app.manage(Arc::clone(&context.environment));
  app.manage(Arc::clone(&context.metadata));
  app.manage(Arc::clone(&context.database));
  app.manage(Arc::clone(&context.state));
  app.manage(window_state.clone());

  let window = WebviewWindowBuilder::new(
    app,
    MAIN_WINDOW_LABEL,
    WebviewUrl::App(MAIN_WINDOW_ENTRYPOINT.into()),
  )
  .window_classname(MAIN_WINDOW_CLASSNAME)
  .title(MAIN_WINDOW_TITLE)
  .inner_size(MAIN_WINDOW_WIDTH, MAIN_WINDOW_HEIGHT)
  .fullscreen(MAIN_WINDOW_FULLSCREEN)
  .resizable(MAIN_WINDOW_RESIZABLE)
  .decorations(MAIN_WINDOW_DECORATIONS)
  .transparent(!MAIN_WINDOW_DECORATIONS)
  .theme(Some(color_scheme))
  .visible(false) // Later shown when ready
  .center()
  .build()?;

  // Store the window handle in the context
  #[cfg(windows)]
  {
    let hwnd = window.hwnd()?;
    info!(message = "Main window created", ?hwnd);
    hg_ffi::set_current_window_hwnd(hwnd.0 as _);
    context.environment.hwnd.set(hwnd.0 as _).unwrap();
  }

  // Store the Webview2 version in the context
  #[cfg(windows)]
  {
    let context_cloned = Arc::clone(&context);
    window.with_webview(move |webview| {
      if let Ok(Ok(value)) = hg_ffi::webview_version(&webview) {
        info!("Webview2 version: {value:?}");
        context_cloned
          .environment
          .webview_version
          .set(value)
          .unwrap();
      }
    })?;
  }

  // Apply window color scheme
  hg_ffi::apply_window_color_scheme(&window, color_scheme)?;

  // Open devtools in debug mode
  let devtools = cfg!(debug_assertions);
  if devtools {
    debug!("Opening devtools for main window");
    window.open_devtools();
  }

  // Set Webview2 accelerator keys
  #[cfg(windows)]
  window.with_webview(move |webview| {
    if let Err(err) = hg_ffi::set_webview_accelerator_keys_enabled(&webview, devtools) {
      error!(message = "Failed to set webview accelerator keys", ?err);
    }
  })?;

  //
  if has_window_state {
    window_state.intersects(&window)?;
  } else {
    window_state.update(&window)?;
  }

  // Show and focus the window when it's ready
  window.show()?;
  window.set_focus()?;

  debug!("Tauri application setup complete");
  Ok(())
}

// Window event for Tauri application
fn on_window_event(window: &Window, event: &WindowEvent) {
  if window.label() != MAIN_WINDOW_LABEL {
    return;
  }

  use tauri::WindowEvent;
  match event {
    WindowEvent::CloseRequested { .. } => {
      let main_window = window.get_webview_window(MAIN_WINDOW_LABEL).unwrap();
      let window_state = window.state::<WindowState>();
      match window_state.update(&main_window) {
        Err(err) => error!(message = "Failed to update window state on close", ?err),
        Ok(()) => window_state.save(),
      }
    }
    WindowEvent::Moved(position) => {
      window.state::<WindowState>().r#move(position);
    }
    WindowEvent::Resized(size) => {
      window.state::<WindowState>().resized(window, size);
    }
    _ => {}
  }
}

// Expose Tauri command handlers
fn command_handlers() -> Box<dyn Fn(Invoke<Wry>) -> bool + Send + Sync + 'static> {
  Box::new(generate_handler![
    // App
    #[cfg(debug_assertions)]
    crate::bootstrap::handlers::panic,
    crate::bootstrap::handlers::environment,
    crate::bootstrap::handlers::change_color_scheme,
    crate::bootstrap::handlers::create_app_lnk,
    crate::bootstrap::handlers::system_fonts,
    crate::bootstrap::handlers::pick_file,
    crate::bootstrap::handlers::pick_folder,
    crate::bootstrap::handlers::metadata_hash,
    crate::bootstrap::handlers::metadata_is_updating,
    crate::bootstrap::handlers::metadata_update,
    // KeyValuePair
    crate::database::schemas::key_value_pair_handlers::database_find_kv_pair,
    crate::database::schemas::key_value_pair_handlers::database_create_kv_pair,
    crate::database::schemas::key_value_pair_handlers::database_update_kv_pair,
    crate::database::schemas::key_value_pair_handlers::database_upsert_kv_pair,
    crate::database::schemas::key_value_pair_handlers::database_delete_kv_pair,
    // Account
    crate::database::schemas::account_handlers::database_find_accounts,
    crate::database::schemas::account_handlers::database_find_account,
    crate::database::schemas::account_handlers::database_create_account,
    crate::database::schemas::account_handlers::database_update_account_data_folder,
    crate::database::schemas::account_handlers::database_update_account_properties,
    crate::database::schemas::account_handlers::database_update_account_data_folder_and_properties,
    crate::database::schemas::account_handlers::database_delete_account,
    // GachaRecord
    crate::database::schemas::gacha_record_handlers::database_find_gacha_records_with_limit,
    crate::database::schemas::gacha_record_handlers::database_delete_gacha_records,
    // Business
    crate::business::handlers::business_validate_uid,
    crate::business::handlers::business_locate_data_folder,
    crate::business::handlers::business_from_webcaches_gacha_url,
    crate::business::handlers::business_from_dirty_gacha_url,
    crate::business::handlers::business_resolve_image_mime,
    crate::business::handlers::business_resolve_image,
    crate::business::handlers::business_pretty_records,
    crate::business::handlers::business_fetch_records,
    crate::business::handlers::business_legacy_migration,
  ])
}

// Load and evaluate the theme from the database
#[tracing::instrument(skip(context))]
async fn load_and_evaluate_theme(context: &Arc<Context>) -> Theme {
  use crate::database::schemas::{KeyValuePair, KeyValuePairQuestioner};
  use serde::Deserialize;

  #[derive(Debug, Deserialize)]
  #[serde(rename_all = "camelCase")]
  #[allow(unused)]
  struct ThemeData {
    namespace: String,
    color_scheme: Option<Theme>,
    scale: Option<u32>,
    font: Option<String>,
  }

  let mut theme: Option<Theme> = None;
  if let Some(KeyValuePair { val, .. }) = context
    .database
    .find_kv_pair(KEY_THEME_DATA)
    .await
    .inspect_err(|err| error!(message = "Failed to load theme data from database", ?err))
    .ok()
    .flatten()
  {
    match serde_json::from_str::<ThemeData>(&val) {
      Err(err) => {
        error!(message = "Failed to deserialize theme data", ?err);
        let _ = context.database.delete_kv_pair(KEY_THEME_DATA).await; // Delete corrupted data
      }
      Ok(data) => {
        info!(message = "Loaded theme data from database", ?data);
        theme = data.color_scheme;
      }
    }
  }

  prelude::resolve_theme_or_system(&context.state, theme)
}

// prelude
pub mod prelude {
  use tauri::State;

  use super::*;

  pub(crate) type TauriEnvironmentState<'r> = State<'r, Arc<Environment>>;
  pub(crate) type TauriMetadataState<'r> = State<'r, Arc<Metadata>>;
  pub(crate) type TauriDatabaseState<'r> = State<'r, Arc<Database>>;
  pub(crate) type TauriAppState<'r> = State<'r, Arc<AppState>>;
  // pub(crate) type TauriWindowState<'r> = State<'r, WindowState>;

  #[tracing::instrument(skip(state))]
  pub(crate) fn resolve_theme_or_system(state: &AppState, theme: Option<Theme>) -> Theme {
    // If no theme is set, follow the system theme
    state.set_follow_system_theme(theme.is_none());
    theme.unwrap_or_else(|| {
      if cfg!(windows) {
        // Get current system theme
        hg_ffi::apps_use_theme()
          .inspect_err(|err| error!(message = "Failed to get current Windows theme", ?err))
          .unwrap_or(Theme::Light)
      } else {
        Theme::Light
      }
    })
  }
}
