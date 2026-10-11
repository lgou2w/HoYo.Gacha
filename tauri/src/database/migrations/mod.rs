use std::time::Instant;

use tracing::{debug, info, warn};

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
  V1_INITIALIZE              : "20240725_initialize.sql",
  V2_GACHA_RECORDS_PK        : "20250719_gacha_records_pk.sql",
  V3_GACHA_RECORDS_PROPERTIES: "20251102_gacha_records_properties.sql",
  V4_DROP_REDUNDANT_INDEXES  : "20260923_drop_redundant_indexes.sql",
}

#[tracing::instrument(skip_all)]
pub async fn apply_migrations(database: &Database) -> Result<(), DatabaseError> {
  let expected_version = Migration::values().len();
  let current_version = database
    .interact(|conn| conn.query_row("PRAGMA USER_VERSION;", [], |row| row.get::<_, u32>(0)))
    .await? as usize;

  if current_version >= expected_version {
    debug!(
      message = "Database schema is up to date",
      current_version, expected_version,
    );
    return Ok(());
  }

  let start = Instant::now();
  info!(
    message = "Applying database migrations...",
    current_version, expected_version,
  );

  for migration in Migration::values().iter().skip(current_version) {
    info!(message = "Applying migration...", ?migration.name);
    database
      .interact(|conn| conn.execute_batch(migration.sql))
      .await?;
  }

  // When new migrations are applied, we should vacuum the database to reclaim space and optimize performance.
  info!("Vacuuming database to reclaim space");
  if let Err(err) = database
    .interact(|conn| conn.execute_batch("PRAGMA auto_vacuum = INCREMENTAL; VACUUM;"))
    .await
  {
    warn!(
      message =
        "VACUUM failed, but this is not critical. The database will still function correctly.",
      ?err,
    );
  }

  info!(
    message = "Database migrations completed",
    from = current_version,
    to = expected_version,
    elapsed = ?start.elapsed(),
  );
  Ok(())
}
