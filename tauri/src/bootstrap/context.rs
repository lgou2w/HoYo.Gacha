use std::path::Path;
use std::process;
use std::sync::{Arc, OnceLock};

use tauri::Theme;
use tracing::{error, info};

use crate::bootstrap::tracing::Tracing;
use crate::bootstrap::window_state::WindowState;
use crate::business::metadata::MetadataService;
use crate::constants;
use crate::database::Database;

pub struct Context {
  tracing: Tracing,
  pub cwd: &'static Path,
  pub webview_version: OnceLock<String>,

  // Shared to Tauri state
  pub metadata: Arc<MetadataService>,
  pub database: Arc<Database>,
  window_state: WindowState, // Because it's Arc
}

impl Context {
  #[tracing::instrument]
  pub async fn new() -> Self {
    let cwd = &*constants::EXE_WORKING_DIR;
    let tracing = Tracing::new();

    info!("Initializing application context");
    let metadata = MetadataService::load()
      .await
      .expect("Failed to initialize gacha metadata");

    let database = Database::new().await.expect("Failed to connect database");
    database
      .apply_migrations()
      .await
      .expect("Failed to apply database migrations");

    Self {
      tracing,
      cwd,
      webview_version: OnceLock::new(),
      metadata: Arc::new(metadata),
      database: Arc::new(database),
      window_state: WindowState::default(),
    }
  }

  pub async fn close(self, exit_code: i32) -> ! {
    info!("Closing application context");

    // Other cleanup tasks can be added here
    self.database.close();
    //

    info!("bye!");
    self.tracing.close();

    // Exit the process with the given code
    process::exit(exit_code)
  }

  /// Loads the color scheme from the database and returns an `Option<Theme>`. If the color scheme is not set, it returns `None`.
  #[tracing::instrument(skip_all)]
  pub async fn load_color_scheme(&self) -> Option<Theme> {
    use crate::database::schemas::{KValue, KValueQuestioner};
    use serde::Deserialize;

    // See: app/contexts/store.ts
    const KEY_THEME_DATA: &str = "HG_THEME_DATA";

    #[derive(Debug, Deserialize)]
    #[serde(rename_all = "camelCase")]
    #[allow(unused)]
    struct ThemeData {
      namespace: String,
      color_scheme: Option<Theme>,
      scale: Option<u32>,
      font: Option<String>,
    }

    let mut color_scheme: Option<Theme> = None;
    if let Some(KValue { val, .. }) = self
      .database
      .interact(|conn| conn.find_kvalue(KEY_THEME_DATA.into()))
      .await
      .inspect_err(|err| error!(message = "Failed to load theme data from database", ?err))
      .ok()
      .flatten()
    {
      match serde_json::from_str::<ThemeData>(&val) {
        Ok(theme_data) => {
          info!(message = "Loaded theme data from database", ?theme_data);
          color_scheme = theme_data.color_scheme;
        }
        Err(err) => {
          // Delete corrupted data
          error!(message = "Failed to deserialize theme data", ?err);
          let _ = self
            .database
            .interact(|conn| conn.delete_kvalue(KEY_THEME_DATA.into()))
            .await;
        }
      }
    }

    color_scheme
  }

  /// Loads the window state from the file and returns a tuple containing a boolean indicating whether the state was loaded successfully and the `WindowState` instance.
  pub fn load_window_state(&self) -> (bool, WindowState) {
    if self.window_state.load() {
      // You can clone it freely because its internal is Arc.
      (true, self.window_state.clone())
    } else {
      (false, WindowState::default())
    }
  }
}
