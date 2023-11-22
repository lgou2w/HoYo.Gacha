use std::borrow::Cow;
use std::path::Path;

use serde::de::DeserializeOwned;
use serde::ser::SerializeStruct;
use serde::{Serialize, Serializer};
use sqlx::query::{Query as SqlxQuery, QueryAs as SqlxQueryAs};
use sqlx::sqlite::{Sqlite, SqliteArguments, SqliteConnectOptions, SqlitePool};
use tracing::info;

// Error

#[derive(Debug, thiserror::Error)]
#[error(transparent)]
pub struct DatabaseError(#[from] pub sqlx::Error);

impl DatabaseError {
  pub fn code(&self) -> Cow<'_, str> {
    match &self.0 {
      sqlx::Error::Database(inner) => inner.code().unwrap(), // FIXME: SAFETY?
      _ => Cow::Borrowed("-1"),
    }
  }
}

impl Serialize for DatabaseError {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    let mut state = serializer.serialize_struct("Error", 3)?;
    state.serialize_field("identifier", stringify!(DatabaseError))?;
    state.serialize_field("code", &self.code())?;
    state.serialize_field("message", &self.to_string())?;
    state.end()
  }
}

// pub struct

/// Database

pub struct Database(SqlitePool);

impl Database {
  pub async fn from_file(filename: impl AsRef<Path>) -> Result<Database, DatabaseError> {
    let options = SqliteConnectOptions::new()
      .filename(filename)
      .create_if_missing(true)
      .read_only(false)
      .immutable(false)
      .shared_cache(false);
    // TODO: Sqlite Journal Mode
    // .journal_mode(SqliteJournalMode::Off);

    let pool = SqlitePool::connect_with(options).await?;
    Ok(Self(pool))
  }
}

impl Database {
  #[inline]
  pub fn executor(&self) -> &SqlitePool {
    &self.0
  }

  pub async fn close(&self) {
    info!("Closing database...");
    self.0.close().await;
  }

  pub async fn initialize(&self) -> Result<(), DatabaseError> {
    info!("Initializing database...");

    {
      info!("Starting initialize entities...");
      self.initialize_entity(super::AccountQuestioner).await?;
      self.initialize_entity(super::GachaRecordQuestioner).await?;
    }

    Ok(())
  }

  async fn initialize_entity(&self, questioner: impl Questioner) -> Result<(), DatabaseError> {
    info!("Initializing entity: {}", questioner.entity_name());
    questioner.sql_initialize().execute(&self.0).await?;
    Ok(())
  }
}

// Questioner and Entity generate

pub type Query = SqlxQuery<'static, Sqlite, SqliteArguments<'static>>;
pub type QueryAs<T> = SqlxQueryAs<'static, Sqlite, T, SqliteArguments<'static>>;

pub trait Questioner {
  type Entity: Clone + DeserializeOwned + Serialize + Sized;

  const ENTITY_NAME: &'static str;

  #[inline]
  fn entity_name(&self) -> &'static str {
    Self::ENTITY_NAME
  }

  fn sql_initialize(&self) -> Query;
}

#[macro_export]
macro_rules! generate_entity {
  ({
    $(#[$attr:meta])*
    $vis:vis struct $entity:ident {
      $(
        $(#[$field_attr:meta])*
        $field_vis:vis $field:ident: $type:ty,
      )*
    },
    questioner {
      initialize => $sql_initialize:literal,
      $($name:ident {
        $($arg_n:ident: $arg_t:ty),*
      } => $sql:literal,)*
    }
  }) => {
    paste::paste! {
      use sqlx::{query, query_as, FromRow, Result, Row};
      use sqlx::sqlite::SqliteRow;

      use super::bootstrap::{Query, QueryAs, Questioner};

      $(#[$attr])*
      $vis struct $entity {
        $(
          $(#[$field_attr])*
          $field_vis $field: $type,
        )*
      }

      impl<'r> FromRow<'r, SqliteRow> for $entity {
        fn from_row(row: &'r SqliteRow) -> Result<Self> {
          Ok(Self {
            $(
              $field: row.try_get::<$type, &str>(stringify!($field))?,
            )*
          })
        }
      }

      $vis struct [<$entity Questioner>];

      impl Questioner for [<$entity Questioner>] {
        type Entity = $entity;

        const ENTITY_NAME: &'static str = stringify!($entity);

        fn sql_initialize(&self) -> Query {
          query($sql_initialize)
        }
      }

      impl [<$entity Questioner>] {
        $(
          pub fn $name(&self, $($arg_n: $arg_t),*) -> QueryAs<<Self as Questioner>::Entity> {
            query_as($sql)
              $(.bind($arg_n))*
          }
        )*
      }
    }
  };
}
