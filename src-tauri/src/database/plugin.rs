use std::sync::Arc;

use tauri::plugin::{Builder as TauriPluginBuilder, TauriPlugin};
use tauri::{generate_handler, Manager, Runtime, State as TauriState};

use super::Database;

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
        handlers::find_accounts,
        handlers::find_accounts_by_facet,
        handlers::find_account_by_id,
        handlers::find_account_by_facet_and_uid,
        handlers::create_account,
        handlers::delete_account,
        handlers::update_account_game_data_dir,
        handlers::update_account_gacha_url,
        handlers::update_account_properties
      ])
      .build()
  }
}

// Handlers
//   TODO: macro_rules

mod handlers {
  use time::OffsetDateTime;

  use super::DatabasePluginState;
  use crate::database::{Account, AccountFacet, AccountProperties, AccountQuestioner};

  #[tauri::command]
  pub async fn find_accounts(database: DatabasePluginState<'_>) -> Result<Vec<Account>, String> {
    AccountQuestioner
      .find_many()
      .fetch_all(database.executor())
      .await
      .map_err(|e| format!("{e}")) // TODO: error
  }

  #[tauri::command]
  pub async fn find_accounts_by_facet(
    database: DatabasePluginState<'_>,
    facet: AccountFacet,
  ) -> Result<Vec<Account>, String> {
    AccountQuestioner
      .find_many_by_facet(facet)
      .fetch_all(database.executor())
      .await
      .map_err(|e| format!("{e}")) // TODO: error
  }

  #[tauri::command]
  pub async fn find_account_by_id(
    database: DatabasePluginState<'_>,
    id: u32,
  ) -> Result<Option<Account>, String> {
    AccountQuestioner
      .find_one_by_id(id)
      .fetch_optional(database.executor())
      .await
      .map_err(|e| format!("{e}")) // TODO: error
  }

  #[tauri::command]
  pub async fn find_account_by_facet_and_uid(
    database: DatabasePluginState<'_>,
    facet: AccountFacet,
    uid: u32,
  ) -> Result<Option<Account>, String> {
    AccountQuestioner
      .find_one_by_facet_and_uid(facet, uid)
      .fetch_optional(database.executor())
      .await
      .map_err(|e| format!("{e}")) // TODO: error
  }

  #[tauri::command]
  pub async fn create_account(
    database: DatabasePluginState<'_>,
    facet: AccountFacet,
    uid: u32,
    game_data_dir: String,
  ) -> Result<Account, String> {
    AccountQuestioner
      .create_one(facet, uid, game_data_dir)
      .fetch_one(database.executor())
      .await
      .map_err(|e| format!("{e}")) // TODO: error
  }

  #[tauri::command]
  pub async fn delete_account(
    database: DatabasePluginState<'_>,
    id: u32,
  ) -> Result<Option<Account>, String> {
    AccountQuestioner
      .delete_by_id(id)
      .fetch_optional(database.executor())
      .await
      .map_err(|e| format!("{e}")) // TODO: error
  }

  #[tauri::command]
  pub async fn update_account_game_data_dir(
    database: DatabasePluginState<'_>,
    game_data_dir: String,
    id: u32,
  ) -> Result<Option<Account>, String> {
    AccountQuestioner
      .update_game_data_dir_by_id(game_data_dir, id)
      .fetch_optional(database.executor())
      .await
      .map_err(|e| format!("{e}")) // TODO: error
  }

  #[tauri::command]
  pub async fn update_account_gacha_url(
    database: DatabasePluginState<'_>,
    gacha_url: Option<String>,
    gacha_url_updated_at: Option<OffsetDateTime>,
    id: u32,
  ) -> Result<Option<Account>, String> {
    AccountQuestioner
      .update_gacha_url_by_id(gacha_url, gacha_url_updated_at, id)
      .fetch_optional(database.executor())
      .await
      .map_err(|e| format!("{e}")) // TODO: error
  }

  #[tauri::command]
  pub async fn update_account_properties(
    database: DatabasePluginState<'_>,
    properties: Option<AccountProperties>,
    id: u32,
  ) -> Result<Option<Account>, String> {
    AccountQuestioner
      .update_properties_by_id(properties, id)
      .fetch_optional(database.executor())
      .await
      .map_err(|e| format!("{e}")) // TODO: error
  }
}
