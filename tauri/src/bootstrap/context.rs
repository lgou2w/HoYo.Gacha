use std::process;
use std::sync::Arc;

use tracing::info;

use crate::bootstrap::environment::Environment;
use crate::bootstrap::state::AppState;
use crate::bootstrap::tracing::Tracing;
use crate::business::metadata::Metadata;
use crate::database::Database;

pub struct Context {
  // logger
  tracing: Tracing,
  // Shared to Tauri state
  pub environment: Arc<Environment>,
  pub metadata: Arc<Metadata>,
  pub database: Arc<Database>,
  pub state: Arc<AppState>,
}

impl Context {
  #[tracing::instrument]
  pub async fn new() -> Self {
    let tracing = Tracing::new();

    info!("Initializing application context...");
    let environment = Environment::default();
    let metadata = Metadata::new()
      .expect("Failed to initialize gacha metadata")
      .load()
      .await;

    let database = Database::new().await.expect("Failed to connect database");
    database
      .apply_migrations()
      .await
      .expect("Failed to apply database migrations");

    Self {
      tracing,
      environment: Arc::new(environment),
      metadata: Arc::new(metadata),
      database: Arc::new(database),
      state: Arc::new(AppState::default()),
    }
  }
}

impl Context {
  pub async fn close(self, exit_code: i32) -> ! {
    info!("Closing application context...");

    // Other cleanup tasks can be added here
    self.database.close().await;
    //

    info!("bye!");
    self.tracing.close();

    // Exit the process with the given code
    process::exit(exit_code)
  }
}
