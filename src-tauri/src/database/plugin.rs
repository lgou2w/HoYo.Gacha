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
        handler::find_accounts,
        handler::find_accounts_by_facet,
        handler::find_account_by_id,
        handler::find_account_by_facet_and_uid,
        handler::create_account,
        handler::delete_account,
        handler::update_account_game_data_dir,
        handler::update_account_gacha_url,
        handler::update_account_properties,
        handler::find_gacha_records_by_facet_and_uid
      ])
      .build()
  }
}

// Handlers

macro_rules! generate_handlers {
  ($questioner:ident, {
    $(
      $name:ident {
        $($arg_n:ident: $arg_t:ty),*
      } $query:ident and $operation:ident => $result:ty,
    )*
  }) => {
    $(
      #[tauri::command]
      pub async fn $name(
        database: DatabasePluginState<'_>,
        $($arg_n: $arg_t),*
      ) -> Result<$result, String> {
        $questioner
          .$query($($arg_n),*)
          .$operation(database.executor())
          .await
          .map_err(|e| format!("{e}")) // TODO: error
      }
    )*
  };
}

mod handler {
  use time::OffsetDateTime;

  use super::DatabasePluginState;
  use crate::database::{
    Account, AccountFacet, AccountProperties, AccountQuestioner, GachaRecord, GachaRecordQuestioner,
  };

  generate_handlers!(AccountQuestioner, {
    find_accounts {} find_many and fetch_all => Vec<Account>,

    find_accounts_by_facet {
      facet: AccountFacet
    } find_many_by_facet and fetch_all => Vec<Account>,

    find_account_by_id {
      id: u32
    } find_one_by_id and fetch_optional => Option<Account>,

    find_account_by_facet_and_uid {
      facet: AccountFacet,
      uid: u32
    } find_one_by_facet_and_uid and fetch_optional => Option<Account>,

    create_account {
      facet: AccountFacet,
      uid: u32,
      game_data_dir: String
    } create_one and fetch_one => Account,

    delete_account {
      id: u32
    } delete_by_id and fetch_optional => Option<Account>,

    update_account_game_data_dir {
      game_data_dir: String,
      id: u32
    } update_game_data_dir_by_id and fetch_optional => Option<Account>,

    update_account_gacha_url {
      gacha_url: Option<String>,
      gacha_url_updated_at: Option<OffsetDateTime>,
      id: u32
    } update_gacha_url_by_id and fetch_optional => Option<Account>,

    update_account_properties {
      properties: Option<AccountProperties>,
      id: u32
    } update_properties_by_id and fetch_optional => Option<Account>,
  });

  generate_handlers!(GachaRecordQuestioner, {
    find_gacha_records_by_facet_and_uid {
      facet: AccountFacet,
      uid: u32,
      gacha_type: Option<u32>
    } find_many_by_facet_and_uid and fetch_all => Vec<GachaRecord>,
  });
}
