use super::entity_account::{
  AccountFacet, AccountProperties, ActiveModel as AccountActiveModel, Column as AccountColumn,
  Entity as AccountEntity, Model as AccountModel,
};
use super::entity_genshin_gacha_record::{
  ActiveModel as GenshinGachaRecordActiveModel, Column as GenshinGachaRecordColumn,
  Entity as GenshinGachaRecordEntity,
};
use super::entity_starrail_gacha_record::{
  ActiveModel as StarRailGachaRecordActiveModel, Column as StarRailGachaRecordColumn,
  Entity as StarRailGachaRecordEntity,
};
use super::entity_zzz_gacha_record::{
  ActiveModel as ZenlessZoneZeroGachaRecordActiveModel, Column as ZenlessZoneZeroGachaRecordColumn,
  Entity as ZenlessZoneZeroGachaRecordEntity,
};
use super::utilities::{
  create_index_statements, create_table_statement, execute_statements, is_constraint_unique_err,
};
use crate::constants::DATABASE;
use crate::error::{Error, Result};
use crate::gacha::{GenshinGachaRecord, StarRailGachaRecord, ZenlessZoneZeroGachaRecord};
use futures::TryStreamExt;
use paste::paste;
use sea_orm::sea_query::{Condition, Index, OnConflict};
use sea_orm::{
  ActiveModelTrait, ActiveValue, ColumnTrait, ConnectOptions, Database, DatabaseConnection,
  EntityName, EntityTrait, Iden, QueryFilter, QueryOrder, QuerySelect, QueryTrait,
  TransactionTrait,
};
use std::path::{Path, PathBuf};
use tauri::async_runtime::block_on;
use tauri::plugin::{Builder as TauriPluginBuilder, TauriPlugin};
use tauri::Runtime;
use tracing::debug;

/// Storage
#[allow(dead_code)]
pub struct Storage {
  pub database_file: PathBuf,
  pub database: DatabaseConnection,
}

impl Storage {
  pub async fn new() -> Result<Self> {
    // HACK: See -> https://github.com/lgou2w/HoYo.Gacha/issues/8
    //  - In debug mode  : the database file is in the src-tauri directory
    //  - In release mode: the database file is in the same directory as the executable
    let database_file = if cfg!(debug_assertions) {
      // Avoid clearing the database file with the 'cargo clean' command in debug mode
      PathBuf::from(DATABASE)
    } else {
      std::env::current_exe()?.parent().unwrap().join(DATABASE)
    };

    Self::new_with_database_file(database_file).await
  }

  pub async fn new_with_database_file<P: AsRef<Path>>(database_file: P) -> Result<Self> {
    let database_file = database_file.as_ref();
    let url = format!("sqlite://{}?mode=rwc", database_file.display());

    debug!("Create storage with database: {url}");
    debug!("Connecting to storage...");
    let mut options = ConnectOptions::new(url);
    options.sqlx_logging_level(tracing::log::LevelFilter::Trace);

    let database = Database::connect(options).await?;
    debug!("Storage connected");

    Ok(Self {
      database_file: database_file.to_path_buf(),
      database,
    })
  }

  pub async fn initialize(&self) -> Result<()> {
    debug!("Initializing storage...");

    {
      debug!("Creating tables...");
      let statement1 = create_table_statement(GenshinGachaRecordEntity);
      let statement2 = create_table_statement(StarRailGachaRecordEntity);
      let statement3 = create_table_statement(ZenlessZoneZeroGachaRecordEntity);
      let statement4 = create_table_statement(AccountEntity);
      execute_statements(
        &self.database,
        &[statement1, statement2, statement3, statement4],
      )
      .await?;
    }

    {
      debug!("Creating indexes...");
      let statement1 = create_index_statements(GenshinGachaRecordEntity);
      let statement2 = create_index_statements(StarRailGachaRecordEntity);
      let statement3 = create_index_statements(ZenlessZoneZeroGachaRecordEntity);
      let statement4 = create_index_statements(AccountEntity);

      // Account: facet + uid constraint
      let statement5 = Index::create()
        .name(format!(
          "idx-{}-{}-{}",
          EntityName::table_name(&AccountEntity),
          Iden::to_string(&AccountColumn::Facet),
          Iden::to_string(&AccountColumn::Uid)
        ))
        .table(AccountEntity)
        .col(AccountColumn::Facet)
        .col(AccountColumn::Uid)
        .unique()
        .if_not_exists()
        .to_owned();

      let mut statements = statement1;
      statements.extend(statement2);
      statements.extend(statement3);
      statements.extend(statement4);
      statements.push(statement5);
      execute_statements(&self.database, &statements).await?;
    }

    debug!("Storage initialized");
    Ok(())
  }

  pub async fn create_account(
    &self,
    facet: &AccountFacet,
    uid: &str,
    game_data_dir: &str,
    gacha_url: Option<&str>,
    properties: Option<&AccountProperties>,
  ) -> Result<AccountModel> {
    debug!("Create account...: facet={facet:?}, uid={uid:?}, game_data_dir={game_data_dir:?}, gacha_url={gacha_url:?}, properties={properties:?}");

    let model = AccountActiveModel {
      id: ActiveValue::NotSet,
      facet: ActiveValue::Set(facet.clone()),
      uid: ActiveValue::Set(uid.to_owned()),
      game_data_dir: ActiveValue::Set(game_data_dir.to_owned()),
      gacha_url: ActiveValue::Set(gacha_url.map(|s| s.to_owned())),
      properties: ActiveValue::Set(properties.cloned()),
    };

    AccountEntity::insert(model)
      .exec_with_returning(&self.database)
      .await
      .map_err(|err| {
        if is_constraint_unique_err(&err) {
          Error::AccountAlreadyExists
        } else {
          Error::from(err)
        }
      })
  }

  pub async fn find_accounts(&self, facet: Option<&AccountFacet>) -> Result<Vec<AccountModel>> {
    debug!("Find accounts...");

    let result = if let Some(facet) = facet {
      AccountEntity::find().filter(AccountColumn::Facet.eq(facet.clone()))
    } else {
      AccountEntity::find()
    }
    .all(&self.database)
    .await?;

    Ok(result)
  }

  pub async fn try_find_account(
    &self,
    facet: &AccountFacet,
    uid: &str,
  ) -> Result<Option<AccountModel>> {
    debug!("Find account...: facet={facet:?}, uid={uid:?}");
    Ok(
      AccountEntity::find()
        .filter(AccountColumn::Facet.eq(facet.clone()))
        .filter(AccountColumn::Uid.eq(uid))
        .one(&self.database)
        .await?,
    )
  }

  pub async fn find_account(&self, facet: &AccountFacet, uid: &str) -> Result<AccountModel> {
    self
      .try_find_account(facet, uid)
      .await?
      .ok_or(Error::AccountNotFound)
  }

  pub async fn try_update_account(
    &self,
    facet: &AccountFacet,
    uid: &str,
    game_data_dir: ActiveValue<String>,
    gacha_url: ActiveValue<Option<String>>,
    properties: ActiveValue<Option<AccountProperties>>,
  ) -> Result<Option<AccountModel>> {
    debug!("Update account...: game_data_dir={game_data_dir:?}, gacha_url={gacha_url:?}, properties={properties:?}");

    if let Some(account) = self.try_find_account(facet, uid).await? {
      let mut model: AccountActiveModel = account.into();
      model.game_data_dir = game_data_dir;
      model.gacha_url = gacha_url;
      model.properties = properties;
      Ok(Some(model.update(&self.database).await?))
    } else {
      Ok(None)
    }
  }

  pub async fn update_account(
    &self,
    facet: &AccountFacet,
    uid: &str,
    game_data_dir: ActiveValue<String>,
    gacha_url: ActiveValue<Option<String>>,
    properties: ActiveValue<Option<AccountProperties>>,
  ) -> Result<AccountModel> {
    let result = self
      .try_update_account(facet, uid, game_data_dir, gacha_url, properties)
      .await?;
    if let Some(account) = result {
      Ok(account)
    } else {
      Err(Error::AccountNotFound)
    }
  }

  pub async fn update_account_game_data_dir(
    &self,
    facet: &AccountFacet,
    uid: &str,
    game_data_dir: &str,
  ) -> Result<AccountModel> {
    self
      .update_account(
        facet,
        uid,
        ActiveValue::Set(game_data_dir.to_owned()),
        ActiveValue::NotSet,
        ActiveValue::NotSet,
      )
      .await
  }

  pub async fn update_account_gacha_url(
    &self,
    facet: &AccountFacet,
    uid: &str,
    gacha_url: Option<&str>,
  ) -> Result<AccountModel> {
    self
      .update_account(
        facet,
        uid,
        ActiveValue::NotSet,
        ActiveValue::Set(gacha_url.map(|s| s.to_owned())),
        ActiveValue::NotSet,
      )
      .await
  }

  pub async fn update_account_properties(
    &self,
    facet: &AccountFacet,
    uid: &str,
    properties: Option<&AccountProperties>,
  ) -> Result<AccountModel> {
    self
      .update_account(
        facet,
        uid,
        ActiveValue::NotSet,
        ActiveValue::NotSet,
        ActiveValue::Set(properties.cloned()),
      )
      .await
  }

  pub async fn try_delete_account(&self, facet: &AccountFacet, uid: &str) -> Result<bool> {
    debug!("Delete account...: facet={facet:?}, uid={uid:?}");

    let result = AccountEntity::delete_many()
      .filter(AccountColumn::Facet.eq(facet.clone()))
      .filter(AccountColumn::Uid.eq(uid))
      .exec(&self.database)
      .await?
      .rows_affected;

    Ok(result > 0)
  }

  pub async fn delete_account(&self, facet: &AccountFacet, uid: &str) -> Result<()> {
    let result = self.try_delete_account(facet, uid).await?;
    if !result {
      Err(Error::AccountNotFound)
    } else {
      Ok(())
    }
  }
}

macro_rules! impl_gacha_records_crud {
  ($struct: ident, $name: tt, $record: ident, $active_model: ident, $entity: ident, $column: ident) => {
    paste! {
      impl $struct {
        pub async fn [<find_ $name _gacha_records>](&self,
          uid: &str,
          gacha_type: Option<&str>,
          limit: Option<u64>
        ) -> Result<Vec<$record>> {
          debug!("Find {} gacha records by uid: {uid}", stringify!($name));

          let result = if let Some(gacha_type) = gacha_type {
            $entity::find()
              .filter(Condition::all()
                .add($column::Uid.eq(uid))
                .add($column::GachaType.eq(gacha_type))
              )
          } else {
            $entity::find()
              .filter($column::Uid.eq(uid))
          }
            .order_by_asc($column::Id)
            .apply_if(limit, QuerySelect::limit)
            .stream(&self.database)
            .await?
            .try_filter_map(|model| async move {
              let record = $record::from(model);
              Ok(Some(record))
            })
            .try_collect::<Vec<_>>()
            .await?;

          Ok(result)
        }

        pub async fn [<save_ $name _gacha_records>](&self,
          records: &[$record]
        ) -> Result<u64> {
          debug!("Save {} gacha records: {}", stringify!($name), records.len());
          if records.is_empty() {
            return Ok(0);
          }

          let txn = self.database.begin().await?;
          let mut changes = 0;
          for record in records {
            let model = $active_model::from(record.clone());
            changes += $entity::insert(model)
              .on_conflict(OnConflict::column($column::Id).do_nothing().to_owned())
              .exec_without_returning(&txn)
              .await?;
          }
          txn.commit().await?;
          Ok(changes)
        }

        pub async fn [<delete_ $name _gacha_records_by_newer_than_end_id>](&self,
          uid: &str,
          gacha_type: &str,
          end_id: &str,
        ) -> Result<u64> {
          debug!("Delete {} gacha records by newer than end_id: {}", stringify!($name), end_id);

          let rows_affected = $entity::delete_many()
            .filter($column::Uid.eq(uid))
            .filter($column::GachaType.eq(gacha_type))
            .filter($column::Id.gte(end_id))
            .exec(&self.database)
            .await?
            .rows_affected;

          Ok(rows_affected)
        }
      }
    }
  };
}

impl_gacha_records_crud!(
  Storage,
  genshin,
  GenshinGachaRecord,
  GenshinGachaRecordActiveModel,
  GenshinGachaRecordEntity,
  GenshinGachaRecordColumn
);

impl_gacha_records_crud!(
  Storage,
  starrail,
  StarRailGachaRecord,
  StarRailGachaRecordActiveModel,
  StarRailGachaRecordEntity,
  StarRailGachaRecordColumn
);

impl_gacha_records_crud!(
  Storage,
  zzz,
  ZenlessZoneZeroGachaRecord,
  ZenlessZoneZeroGachaRecordActiveModel,
  ZenlessZoneZeroGachaRecordEntity,
  ZenlessZoneZeroGachaRecordColumn
);

/// Tauri commands

#[tauri::command]
async fn create_account(
  storage: tauri::State<'_, Storage>,
  facet: AccountFacet,
  uid: String,
  game_data_dir: String,
  gacha_url: Option<String>,
  properties: Option<AccountProperties>,
) -> Result<AccountModel> {
  storage
    .create_account(
      &facet,
      &uid,
      &game_data_dir,
      gacha_url.as_deref(),
      properties.as_ref(),
    )
    .await
}

#[tauri::command]
async fn update_account_game_data_dir(
  storage: tauri::State<'_, Storage>,
  facet: AccountFacet,
  uid: String,
  game_data_dir: String,
) -> Result<AccountModel> {
  storage
    .update_account_game_data_dir(&facet, &uid, &game_data_dir)
    .await
}

#[tauri::command]
async fn update_account_gacha_url(
  storage: tauri::State<'_, Storage>,
  facet: AccountFacet,
  uid: String,
  gacha_url: Option<String>,
) -> Result<AccountModel> {
  storage
    .update_account_gacha_url(&facet, &uid, gacha_url.as_deref())
    .await
}

#[tauri::command]
async fn update_account_properties(
  storage: tauri::State<'_, Storage>,
  facet: AccountFacet,
  uid: String,
  properties: Option<AccountProperties>,
) -> Result<AccountModel> {
  storage
    .update_account_properties(&facet, &uid, properties.as_ref())
    .await
}

#[tauri::command]
async fn find_accounts(
  storage: tauri::State<'_, Storage>,
  facet: Option<AccountFacet>,
) -> Result<Vec<AccountModel>> {
  storage.find_accounts(facet.as_ref()).await
}

#[tauri::command]
async fn find_account(
  storage: tauri::State<'_, Storage>,
  facet: AccountFacet,
  uid: String,
) -> Result<AccountModel> {
  storage.find_account(&facet, &uid).await
}

#[tauri::command]
async fn delete_account(
  storage: tauri::State<'_, Storage>,
  facet: AccountFacet,
  uid: String,
) -> Result<()> {
  storage.delete_account(&facet, &uid).await
}

macro_rules! impl_gacha_records_tauri_command {
  ($name: tt, $record: ident) => {
    paste! {
      #[tauri::command]
      async fn [<find_ $name _gacha_records>](
        storage: tauri::State<'_, Storage>,
        uid: String,
        gacha_type: Option<String>,
        limit: Option<u64>
      ) -> Result<Vec<$record>> {
        storage
          .[<find_ $name _gacha_records>](&uid, gacha_type.as_deref(), limit)
          .await
      }

      #[tauri::command]
      async fn [<save_ $name _gacha_records>](
        storage: tauri::State<'_, Storage>,
        records: Vec<$record>
      ) -> Result<u64> {
        storage
          .[<save_ $name _gacha_records>](&records)
          .await
      }
    }
  };
}

impl_gacha_records_tauri_command!(genshin, GenshinGachaRecord);
impl_gacha_records_tauri_command!(starrail, StarRailGachaRecord);
impl_gacha_records_tauri_command!(zzz, ZenlessZoneZeroGachaRecord);

/// Tauri plugin

#[derive(Default)]
pub struct StoragePluginBuilder {
  database_file: Option<PathBuf>,
}

impl StoragePluginBuilder {
  const PLUGIN_NAME: &'static str = "storage";

  pub fn new() -> Self {
    Self::default()
  }

  #[allow(unused)]
  pub fn database_file<P: AsRef<Path>>(mut self, database_file: P) -> Self {
    self.database_file = Some(database_file.as_ref().to_path_buf());
    self
  }

  pub fn build<R: Runtime>(self) -> TauriPlugin<R> {
    TauriPluginBuilder::new(Self::PLUGIN_NAME)
      .setup(move |app_handle| {
        debug!("Setup storage plugin...");
        let storage: Result<Storage> = block_on(async move {
          let storage = if let Some(database_file) = self.database_file {
            Storage::new_with_database_file(database_file).await?
          } else {
            Storage::new().await?
          };
          storage.initialize().await?;
          Ok(storage)
        });

        use tauri::Manager;
        app_handle.manage(storage?);

        Ok(())
      })
      .invoke_handler(tauri::generate_handler![
        create_account,
        find_accounts,
        find_account,
        update_account_game_data_dir,
        update_account_gacha_url,
        update_account_properties,
        delete_account,
        find_genshin_gacha_records,
        save_genshin_gacha_records,
        find_starrail_gacha_records,
        save_starrail_gacha_records,
        find_zzz_gacha_records,
        save_zzz_gacha_records,
      ])
      .build()
  }
}
