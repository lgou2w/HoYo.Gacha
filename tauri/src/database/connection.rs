use std::borrow::Cow;
use std::path::PathBuf;

use deadpool::Runtime;
use deadpool::managed::{
  Metrics, Object, Pool, PoolConfig, QueueMode, RecycleError, RecycleResult, Timeouts,
};
use deadpool_sync::SyncWrapper;
use rusqlite::{Connection, Error as RusqliteError, OpenFlags};

#[derive(Debug)]
pub(crate) struct Manager {
  pub path: PathBuf,
  pub runtime: Runtime,
}

impl deadpool::managed::Manager for Manager {
  type Type = SyncWrapper<Connection>;
  type Error = RusqliteError;

  async fn create(&self) -> Result<Self::Type, Self::Error> {
    let path = self.path.clone();

    SyncWrapper::new(self.runtime, move || {
      let conn = Connection::open_with_flags(
        path,
        OpenFlags::SQLITE_OPEN_READ_WRITE
          | OpenFlags::SQLITE_OPEN_CREATE
          | OpenFlags::SQLITE_OPEN_NO_MUTEX
          | OpenFlags::SQLITE_OPEN_PRIVATE_CACHE
          | OpenFlags::SQLITE_OPEN_EXRESCODE,
      )?;

      conn.execute_batch("PRAGMA busy_timeout = 5000;PRAGMA foreign_keys = ON;")?;

      Ok(conn)
    })
    .await
  }

  async fn recycle(&self, obj: &mut Self::Type, _: &Metrics) -> RecycleResult<Self::Error> {
    if obj.is_mutex_poisoned() {
      return Err(RecycleError::Message(Cow::Borrowed(
        "Mutex is poisoned. Connection is considered unusable.",
      )));
    }

    Ok(())
  }
}

pub async fn create_pool(path: PathBuf) -> ConnectionPool {
  const RUNTIME: Runtime = Runtime::Tokio1;
  const POOL_CONFIG: PoolConfig = PoolConfig {
    max_size: 10,
    timeouts: Timeouts::wait_millis(30 * 1000),
    queue_mode: QueueMode::Lifo,
  };

  Pool::builder(Manager {
    path,
    runtime: RUNTIME,
  })
  .config(POOL_CONFIG)
  .runtime(RUNTIME)
  .build()
  .unwrap() // POOL_CONFIG, unwrap is SAFETY
}

pub type ConnectionPool = Pool<Manager, Object<Manager>>;
