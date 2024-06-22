use std::borrow::Cow;
use std::path::Path;
use std::sync::Arc;

use serde::de::DeserializeOwned;
use serde::ser::SerializeStruct;
use serde::Serialize;
use sqlx::query::{Query as SqlxQuery, QueryAs as SqlxQueryAs};
use sqlx::sqlite::{SqliteArguments, SqliteConnectOptions, SqliteQueryResult, SqliteRow};
use sqlx::{FromRow, Sqlite, SqlitePool};
use tauri::plugin::{Builder as TauriPluginBuilder, TauriPlugin};
use tauri::{generate_handler, Manager, Runtime, State as TauriState};
use tracing::info;

mod account_questioner;
mod gacha_record_questioner;
mod macros;

pub use account_questioner::*;
pub use gacha_record_questioner::*;

/// Database

pub struct Database(SqlitePool);

impl AsRef<SqlitePool> for Database {
  fn as_ref(&self) -> &SqlitePool {
    &self.0
  }
}

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

  pub async fn initialize(&self) -> Result<(), DatabaseError> {
    info!("Starting initializing database...");

    macro_rules! initialize {
      ($db:expr, $($emodule:ident::$equestioner:ident),*) => {
        $(
          info!("Initialize entity: {}", $equestioner::entity_name());
          $emodule::$equestioner::initialize($db).await?;
        )*
      };
    }

    initialize! {
      self,
      account_questioner::AccountQuestioner,
      gacha_record_questioner::GachaRecordQuestioner
    };

    Ok(())
  }

  pub async fn close(self) {
    info!("Closing database...");
    self.0.close().await;
  }
}

#[derive(Debug, thiserror::Error)]
#[error(transparent)]
pub struct DatabaseError(#[from] pub sqlx::Error);

impl Serialize for DatabaseError {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::Serializer,
  {
    let code = match &self.0 {
      sqlx::Error::Database(inner) => inner.code().unwrap(), // FIXME: SAFETY?
      _ => Cow::Borrowed("-1"),
    };

    let mut state = serializer.serialize_struct("Error", 3)?;
    state.serialize_field("identifier", stringify!(DatabaseError))?;
    state.serialize_field("message", &self.to_string())?;
    state.serialize_field("code", &code)?;
    state.end()
  }
}

// Questioner declares

pub type Query = SqlxQuery<'static, Sqlite, SqliteArguments<'static>>;
pub type QueryAs<T> = SqlxQueryAs<'static, Sqlite, T, SqliteArguments<'static>>;

pub trait Questioner {
  type Entity: Clone + DeserializeOwned + for<'r> FromRow<'r, SqliteRow> + Serialize + Sized;

  const ENTITY_NAME: &'static str;

  #[inline]
  fn entity_name() -> &'static str {
    Self::ENTITY_NAME
  }

  fn sql_initialize() -> Query;

  async fn initialize(
    executor: impl AsRef<SqlitePool>,
  ) -> Result<SqliteQueryResult, DatabaseError> {
    Self::sql_initialize()
      .execute(executor.as_ref())
      .await
      .map_err(Into::into)
  }
}

// Tauri plugin

pub type DatabasePluginState<'r> = TauriState<'r, Arc<Database>>;

pub struct DatabasePluginBuilder {
  database: Arc<Database>,
}

impl DatabasePluginBuilder {
  const PLUGIN_NAME: &'static str = "hg_database";

  pub fn new(database: Arc<Database>) -> Self {
    Self { database }
  }

  pub fn build<R: Runtime>(self) -> TauriPlugin<R> {
    TauriPluginBuilder::new(Self::PLUGIN_NAME)
      .setup(move |app_handle| {
        app_handle.manage(self.database);
        Ok(())
      })
      .invoke_handler(generate_handler![
        account_questioner::handlers::find_accounts,
        account_questioner::handlers::find_accounts_by_business,
        account_questioner::handlers::find_account_by_id,
        account_questioner::handlers::find_account_by_business_and_uid,
        account_questioner::handlers::create_account,
        account_questioner::handlers::update_account_game_data_dir_by_id,
        account_questioner::handlers::update_account_gacha_url_by_id,
        account_questioner::handlers::update_account_properties_by_id,
        account_questioner::handlers::update_account_game_data_dir_and_properties_by_id,
        account_questioner::handlers::delete_account_by_id,
        gacha_record_questioner::handlers::find_gacha_records_by_business_and_uid,
        gacha_record_questioner::handlers::find_gacha_records_by_business_and_uid_with_gacha_type,
      ])
      .build()
  }
}
