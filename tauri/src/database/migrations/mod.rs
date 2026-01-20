use sqlx::{Executor, Row};
use tracing::{debug, info};

use crate::database::{Database, DatabaseError};

macro_rules! define_migrations {
  ($($name:ident: $sql:literal,)*) => {
    struct Migration {
      name: &'static str,
      sql: &'static str,
    }

    impl Migration {
      $(const $name: Self = Self { name: stringify!($name), sql: include_str!($sql) };)*

      const fn values() -> &'static [Self] {
        &[$(Self::$name,)*]
      }
    }
  };
}

define_migrations! {
  INITIALIZE              : "20240725_initialize.sql",
  GACHA_RECORDS_PK        : "20250719_gacha_records_pk.sql",
  GACHA_RECORDS_PROPERTIES: "20251102_gacha_records_properties.sql",
}

#[tracing::instrument(skip(database))]
pub async fn apply_migrations(database: &Database) -> Result<(), DatabaseError> {
  info!("Applying database migrations...");

  let migrations = Migration::values();
  let expected_version = migrations.len();

  let version: u32 = database
    .inner
    .fetch_one("PRAGMA USER_VERSION;")
    .await?
    .get(0);

  info!(
    "Current version: {}, expected version: {}",
    version, expected_version
  );

  for migration in migrations.iter().skip(version as _) {
    debug!(message = "Applying migration...", ?migration.name);
    database.execute(migration.sql).await?;
  }

  Ok(())
}
