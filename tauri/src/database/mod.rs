use std::ops::Deref;
use std::path::{Path, PathBuf};
use std::time::Instant;
use std::{env, fmt};

use snafu::{ResultExt, Snafu};
use sqlx::sqlite::{SqliteConnectOptions, SqliteQueryResult};
use sqlx::{Executor, SqlitePool};
use tracing::{debug, info};

use crate::constants;
use crate::error::ErrorDetails;

pub mod legacy;
pub mod migrations;
pub mod schemas;

#[derive(Debug, Snafu)]
#[snafu(visibility, display("{source}"))] // Display -> source
pub struct DatabaseError {
  pub(crate) source: sqlx::Error,
}

impl From<sqlx::Error> for DatabaseError {
  fn from(value: sqlx::Error) -> Self {
    Self { source: value }
  }
}

impl ErrorDetails for DatabaseError {
  fn name(&self) -> &'static str {
    stringify!(DatabaseError)
  }

  fn details(&self) -> Option<serde_json::Value> {
    let sqlx_database = self.source.as_database_error()?;
    Some(serde_json::json!({
      "code": sqlx_database.code(),
      "kind": format_args!("{:?}", sqlx_database.kind()),
    }))
  }
}

pub struct Database {
  pub(crate) inner: SqlitePool,
  pub filename: PathBuf,
}

impl Deref for Database {
  type Target = SqlitePool;

  fn deref(&self) -> &Self::Target {
    &self.inner
  }
}

impl Database {
  pub async fn new() -> Result<Self, DatabaseError> {
    // Database storage folder
    //   In debug mode  : is in the tauri folder
    //   In release mode: Current executable folder
    let filename = if cfg!(debug_assertions) {
      PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(constants::DATABASE)
    } else {
      constants::EXE_WORKING_DIR.join(constants::DATABASE)
    };

    Self::new_with(filename).await
  }

  #[tracing::instrument]
  pub async fn new_with<P: AsRef<Path> + fmt::Debug>(filename: P) -> Result<Self, DatabaseError> {
    info!("Connecting to database...");

    let sqlite = SqlitePool::connect_with(
      SqliteConnectOptions::new()
        .filename(&filename)
        .create_if_missing(true)
        .read_only(false)
        .immutable(false)
        .shared_cache(false),
    )
    .await
    .context(DatabaseSnafu)?;

    Ok(Self {
      inner: sqlite,
      filename: filename.as_ref().to_path_buf(),
    })
  }

  /// Initialize database and apply migrations
  #[inline]
  #[tracing::instrument(skip(self))]
  pub async fn apply_migrations(&self) -> Result<(), DatabaseError> {
    migrations::apply_migrations(self).await
  }

  #[tracing::instrument(skip(self))]
  pub async fn close(&self) {
    debug!("Closing database...");
    self.inner.close().await
  }
}

impl Database {
  #[tracing::instrument(skip(self))]
  pub async fn execute<Q: AsRef<str> + fmt::Debug>(
    &self,
    query: Q,
  ) -> Result<SqliteQueryResult, DatabaseError> {
    let start = Instant::now();
    let ret = self
      .inner
      .execute(query.as_ref())
      .await
      .context(DatabaseSnafu);

    debug!(
      message = "Executed database query",
      elapsed = ?start.elapsed(),
      ?ret
    );

    ret
  }
}
