use std::env;
use std::error::Error as StdError;
use std::sync::Arc;

use tauri::webview::WebviewWindowBuilder;
use tauri::{
  App, Builder as TauriBuilder, Manager, Theme, WebviewUrl, Window, WindowEvent, generate_context,
  generate_handler,
};
use tracing::{debug, error, info};

use crate::bootstrap::context::Context;
use crate::bootstrap::window_state::WindowState;
use crate::constants;

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

/// Tauri application lifecycle
pub async fn run(context: Context) -> ! {
  info!("Running Tauri application...");
  tauri::async_runtime::set(tokio::runtime::Handle::current());

  // Wrap the context in an Arc for shared ownership
  let context = Arc::new(context);

  // Load color scheme
  let color_scheme = context.load_color_scheme().await;

  // Build and run the Tauri application
  let exit_code = {
    debug!("Creating Tauri application...");

    let context_cloned = Arc::clone(&context);
    let app = TauriBuilder::default()
      .plugin(tauri_plugin_clipboard_manager::init())
      .plugin(tauri_plugin_shell::init())
      .setup(move|app| setup(app, context_cloned, color_scheme))
      .on_window_event(on_window_event)
      .invoke_handler(generate_handler![
        // App
        crate::bootstrap::handlers::locale,
        crate::bootstrap::handlers::environment,
        crate::bootstrap::handlers::system_fonts,
        crate::bootstrap::handlers::create_app_lnk,
        crate::bootstrap::handlers::open_database_folder,
        // KValue
        crate::database::schemas::kvalue_handlers::database_find_kvalue,
        crate::database::schemas::kvalue_handlers::database_create_kvalue,
        crate::database::schemas::kvalue_handlers::database_update_kvalue,
        crate::database::schemas::kvalue_handlers::database_upsert_kvalue,
        crate::database::schemas::kvalue_handlers::database_delete_kvalue,
        // Account
        crate::database::schemas::account_handlers::database_find_accounts,
        crate::database::schemas::account_handlers::database_find_account,
        crate::database::schemas::account_handlers::database_create_account,
        crate::database::schemas::account_handlers::database_update_account_data_folder,
        crate::database::schemas::account_handlers::database_update_account_properties,
        crate::database::schemas::account_handlers::database_update_account_data_folder_and_properties,
        crate::database::schemas::account_handlers::database_delete_account,
        // GachaRecord
        crate::database::schemas::gacha_record_handlers::database_find_gacha_records,
        crate::database::schemas::gacha_record_handlers::database_find_gacha_records_with_limit,
        crate::database::schemas::gacha_record_handlers::database_delete_gacha_records,
        crate::database::schemas::gacha_record_handlers::database_delete_gacha_records_with_newer_than_end_id,
        // Business
        crate::business::handlers::business_from_webcaches_gacha_url,
        crate::business::handlers::business_from_dirty_gacha_url,
        crate::business::handlers::business_resolve_image,
        crate::business::handlers::business_analyze_records,
        crate::business::handlers::business_fetch_records,
      ])
      .build(generate_context!())
      .expect("error while building Tauri application");

    // Wait for it to exit
    debug!("Starting Tauri application...");
    app.run_return(|_, _| ())
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
  color_scheme: Option<Theme>,
) -> Result<(), Box<dyn StdError + 'static>> {
  debug!("Setting up Tauri application...");

  // Load window state
  let (has_window_state, window_state) = context.load_window_state();

  // Shared context states
  app.manage(Arc::clone(&context.env));
  app.manage(Arc::clone(&context.metadata));
  app.manage(Arc::clone(&context.database));
  app.manage(window_state.clone()); // Because it's Arc

  // Create main window
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
  .theme(color_scheme)
  .visible(false) // Later shown when ready
  .center()
  .build()?;

  hg_ffi::on_tauri_setup(app, &window)?;

  // ---------------------------------------------------------------------------
  // Windows: force a frame recalculation BEFORE applying the saved geometry.
  // ---------------------------------------------------------------------------
  //
  // ## Symptom
  //
  // On Windows, with `decorations(false)` + `transparent(true)` + `effects(Mica)`
  // (or any similar combination that keeps a `WS_THICKFRAME`-like style), the
  // main window's client area grows by roughly one title-bar height (~30px at
  // 100% DPI, ~56px at 200% DPI) on EVERY launch when the window state is
  // restored by `WindowState::intersects` / `update`.
  //
  // The saved value in `WindowState.json` is incremented by that delta each
  // session, so the window drifts larger and larger:
  //
  //     Loaded:  height = 1067
  //     update:  inner  = 1097 (already +30)
  //     next:    height = 1097 → inner = 1127 (+30 again)
  //
  // ## Root cause
  //
  // `tao` (Tauri's winit fork) caches the "window rect → client rect" offset
  // derived from the frame styles at creation time. When the window is
  // created with `visible(false)`, `WM_NCCALCSIZE` is not (re)emitted with
  // the final style, so the cached offset reflects the *initial* frame
  // instead of the decorated/undecorated one. Later, `tao`'s `set_inner_size`
  // compensates using that stale offset, and the error is written back into
  // our persisted state via the `Resized` event handler.
  //
  // Verified against:
  //   * Tauri 2.12.x  — the regression was introduced here.
  //   * Tauri 2.11.6  — last known-good release.
  //   * Tauri 2.12.4  — regression still present; this workaround is
  //                     retained on top of it (see `Cargo.toml`).
  //
  // ## Fix
  //
  // Send `SetWindowPos` with `SWP_FRAMECHANGED` while the window is still
  // hidden. Windows re-emits `WM_NCCALCSIZE`, `tao` updates its cached
  // offset, and subsequent `set_size` calls land on the correct client area.
  // The flags `SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE` keep
  // the window untouched apart from the frame recalculation.
  //
  // This must run BEFORE the first `intersects()` / `update()` call, i.e.
  // before any `set_size`, so that the corrected offset is in place by the
  // time the saved geometry is applied.
  //
  // ## When to remove this
  //
  // Fixed upstream in tao 0.37.2:
  //
  //   * https://github.com/tauri-apps/tao/pull/1361
  //     "fix(windows): keep hidden window client sizes consistent (fix #1359)"
  //     Released as part of tao 0.37.2 (PR #1357):
  //     https://github.com/tauri-apps/tao/pull/1357
  //
  // Once Tauri depends on tao >= 0.37.2, this workaround becomes a no-op and
  // can be deleted together with `force_frame_recalculation`. Track:
  //
  //   * https://github.com/tauri-apps/tao/issues       — WM_NCCALCSIZE
  //   * https://github.com/tauri-apps/tauri/issues     — "window grows on launch"
  //   * https://github.com/tauri-apps/plugins-workspace/issues/2717
  //     ("window-state plugin records bogus width/height values")
  //
  // Downstream fixes documenting the same root cause:
  //
  //   * https://github.com/readest/readest/pull/6546
  //     "fix(windows): stop the main window from growing on every launch"
  //
  // SAFETY: `force_frame_recalculation` only touches the HWND of the current
  // window, and only with flags that tell the OS to recompute the frame.
  // It does not move, resize, reorder, or activate the window.
  // ---------------------------------------------------------------------------
  hg_ffi::force_frame_recalculation(&window);
  //

  // Open devtools in debug or when specifying environment variable
  let devtools = cfg!(debug_assertions) || env::var(constants::ENV_DEVTOOLS).is_ok();
  if devtools {
    debug!("Opening devtools for main window");
    window.open_devtools();
  }

  #[cfg(windows)]
  {
    let context_cloned = Arc::clone(&context);
    window.with_webview(move |webview| {
      // Store the WebView2 version in the context
      if let Ok(Ok(value)) = hg_ffi::webview::version(&webview) {
        info!("Webview2 version: {value:?}");
        let _ = context_cloned.env.webview_version.set(value);
      }

      // Set WebView2 accelerator keys
      if let Err(err) = hg_ffi::webview::set_accelerator_keys_enabled(&webview, devtools) {
        error!(message = "Failed to set webview accelerator keys", ?err);
      }

      // Set WebView2 default context menus
      if let Err(err) = hg_ffi::webview::set_default_context_menus_enabled(&webview, devtools) {
        error!(
          message = "Failed to set webview default context menus",
          ?err
        );
      }
    })?;
  }

  #[cfg(windows)]
  window.set_effects(
    tauri::window::EffectsBuilder::new()
      .effect(tauri::window::Effect::Mica)
      .build(),
  )?;

  // Intersect the window state if it success,
  // otherwise update it with the current window state
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
      window.state::<WindowState>().moving(position);
    }
    WindowEvent::Resized(size) => {
      window.state::<WindowState>().resizing(window, size);
    }
    _ => {}
  }
}
