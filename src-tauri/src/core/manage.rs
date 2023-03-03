extern crate log;
extern crate sqlx;
extern crate tokio;

use std::error::Error;
use std::fs::create_dir;
use std::path::Path;
use log::debug;
use sqlx::sqlite::{SqliteConnectOptions, SqlitePool};
use tokio::sync::Mutex;

pub struct CoreManage {
  pub(crate) database: Mutex<SqlitePool>
}

impl CoreManage {
  pub const FILENAME: &str = "database";
  pub async fn new<P: AsRef<Path>>(database_file: P) -> Result<Self, Box<dyn Error>> {
    let database = {
      SqlitePool::connect_with(
        SqliteConnectOptions::new()
          .filename(&database_file)
          .create_if_missing(true)
      )
      .await?
    };

    Ok(Self {
      database: Mutex::new(database)
    })
  }

  pub async fn from_data_dir<P: AsRef<Path>>(data_dir: P) -> Result<Self, Box<dyn Error>> {
    let data_dir = data_dir.as_ref();
    if !data_dir.exists() {
      create_dir(data_dir)?;
    };

    let file = data_dir
      .join(Self::FILENAME)
      .with_extension("db");

    debug!("Database file: {file:?}");
    Self::new(file).await
  }
}
