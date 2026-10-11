use std::fmt;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use deadpool::managed::PoolError;
use deadpool_sync::InteractError;
use rusqlite::{Connection, Error as RusqliteError};
use snafu::{ResultExt, Snafu};
use tracing::info;

use crate::constants;
use crate::error::DetailedError;

mod connection;
mod extends;
mod macros;
mod migrations;
pub mod schemas;

pub use extends::*;
pub(crate) use macros::*;

#[derive(Debug, Snafu)]
#[snafu(context(suffix(false)))]
pub enum DatabaseError {
  #[snafu(display("{source}"))]
  Pool { source: PoolError<RusqliteError> },

  #[snafu(display("{source}"))]
  Interact { source: InteractError },

  #[snafu(display("{source}"))]
  Sqlite { source: RusqliteError },
}

impl DetailedError for DatabaseError {
  fn name(&self) -> &'static str {
    stringify!(DatabaseError)
  }
}

pub type TauriDatabaseState<'r> = tauri::State<'r, Arc<Database>>;

#[derive(Debug)]
pub struct Database {
  pub(crate) pool: connection::ConnectionPool,
}

impl Database {
  pub async fn new() -> Result<Self, DatabaseError> {
    // Database storage folder
    //   In debug mode  : is in the tauri folder
    //   In release mode: Current executable folder
    let path = if cfg!(debug_assertions) || cfg!(test) {
      PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(constants::DATABASE)
    } else {
      constants::EXE_WORKING_DIR.join(constants::DATABASE)
    };

    Self::new_with(path).await
  }

  #[tracing::instrument]
  pub async fn new_with<P: AsRef<Path> + fmt::Debug>(path: P) -> Result<Self, DatabaseError> {
    info!("Connecting to database...");

    Ok(Self {
      pool: connection::create_pool(path.as_ref().to_path_buf()).await,
    })
  }

  #[tracing::instrument(skip_all)]
  pub fn close(&self) {
    info!("Closing database...");
    self.pool.close();
  }

  #[tracing::instrument(skip_all)]
  pub async fn interact<F, R>(&self, f: F) -> Result<R, DatabaseError>
  where
    F: FnOnce(&mut Connection) -> Result<R, RusqliteError> + Send + 'static,
    R: Send + 'static,
  {
    let conn = self.pool.get().await.context(Pool)?;
    conn.interact(f).await.context(Interact)?.context(Sqlite)
  }

  // #[tracing::instrument(skip_all)]
  // pub async fn interact_infallible<F, R>(&self, f: F) -> Result<R, DatabaseError>
  // where
  //   F: FnOnce(&mut Connection) -> R + Send + 'static,
  //   R: Send + 'static,
  // {
  //   let conn = self.pool.get().await.context(Pool)?;
  //   conn.interact(f).await.context(Interact)
  // }

  #[inline]
  #[tracing::instrument(skip_all)]
  pub async fn apply_migrations(&self) -> Result<(), DatabaseError> {
    migrations::apply_migrations(self).await
  }
}
