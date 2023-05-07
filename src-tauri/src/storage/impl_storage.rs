extern crate futures;
extern crate paste;
extern crate sea_orm;
extern crate tauri;
extern crate tracing;

use std::path::{Path, PathBuf};
use futures::TryStreamExt;
use paste::paste;
use sea_orm::{
  ActiveModelTrait,
  ActiveValue,
  ColumnTrait,
  ConnectOptions,
  Database,
  DatabaseConnection,
  DeriveIden,
  EntityTrait,
  QueryFilter,
  QueryOrder,
  QuerySelect,
  QueryTrait,
  TransactionTrait,
  TryIntoModel
};
use sea_orm::sea_query::{Condition, OnConflict, Index};
use tauri::Runtime;
use tauri::async_runtime::block_on;
use tauri::plugin::{Builder as TauriPluginBuilder, TauriPlugin};
use tracing::debug;
use crate::constants::DATABASE;
use crate::error::{Error, Result};
use crate::gacha::{GenshinGachaRecord, StarRailGachaRecord};
use super::entity_genshin_gacha_record::{
  ActiveModel as GenshinGachaRecordActiveModel,
  Column as GenshinGachaRecordColumn,
  Entity as GenshinGachaRecordEntity
};
use super::entity_starrail_gacha_record::{
  ActiveModel as StarRailGachaRecordActiveModel,
  Column as StarRailGachaRecordColumn,
  Entity as StarRailGachaRecordEntity
};
use super::entity_account::{
  AccountFacet,
  ActiveModel as AccountActiveModel,
  Column as AccountColumn,
  Entity as AccountEntity,
  Model as AccountModel
};
use super::utilities::{
  create_table_statement,
  create_index_statements,
  execute_statements,
  is_constraint_unique_err
};

/// Storage

pub struct Storage {
  pub database_file: PathBuf,
  pub database: DatabaseConnection
}

impl Storage {
  pub async fn new() -> Result<Self> {
    let database_file = PathBuf::from(DATABASE);
    Self::new_with_database_file(database_file).await
  }

  pub async fn new_with_database_file<P: AsRef<Path>>(database_file: P) -> Result<Self> {
    let database_file = database_file.as_ref();
    let url = format!("sqlite://{}?mode=rwc", database_file.display());

    debug!("Create storage with database: {url}");
    debug!("Connecting to storage...");
    let options = ConnectOptions::new(url);
    let database = Database::connect(options).await?;
    debug!("Storage connected");

    Ok(Self {
      database_file: database_file.to_path_buf(),
      database
    })
  }

  pub async fn initialize(&self) -> Result<()> {
    debug!("Initializing storage...");

    {
      debug!("Creating tables...");
      let statement1 = create_table_statement(GenshinGachaRecordEntity);
      let statement2 = create_table_statement(StarRailGachaRecordEntity);
      let statement3 = create_table_statement(AccountEntity);
      execute_statements(&self.database, &[
        statement1,
        statement2,
        statement3
      ]).await?;
    }

    {
      debug!("Creating indexes...");
      let statement1 = create_index_statements(GenshinGachaRecordEntity);
      let statement2 = create_index_statements(StarRailGachaRecordEntity);
      let statement3 = create_index_statements(AccountEntity);

      // Account: facet + uid constraint
      let statement4 = Index::create()
        .name(&format!(
          "idx-{}-{}-{}",
          AccountEntity.to_string(),
          AccountColumn::Facet.to_string(),
          AccountColumn::Uid.to_string()
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
      statements.push(statement4);
      execute_statements(&self.database, &statements).await?;
    }

    debug!("Storage initialized");
    Ok(())
  }

  pub async fn upsert_account(&self, active: AccountActiveModel) -> Result<AccountModel> {
    debug!("Upsert account...: {active:?}");
    let model = active.save(&self.database)
      .await
      .map_err(|err| {
        if is_constraint_unique_err(&err) {
          Error::AccountAlreadyExists
        } else {
          Error::from(err)
        }
      })?;

    Ok(model.try_into_model()?)
  }

  pub async fn find_accounts(&self,
    facet: Option<&AccountFacet>
  ) -> Result<Vec<AccountModel>> {
    debug!("Find accounts...");

    let result = if let Some(facet) = facet {
      AccountEntity::find()
        .filter(AccountColumn::Facet.eq(facet.clone()))
    } else {
      AccountEntity::find()
    }
      .all(&self.database)
      .await?;

    Ok(result)
  }

  pub async fn try_find_account(&self,
    facet: &AccountFacet,
    uid: &str
  ) -> Result<Option<AccountModel>> {
    debug!("Find account...: facet={facet:?}, uid={uid:?}");
    Ok(AccountEntity::find()
      .filter(AccountColumn::Facet.eq(facet.clone()))
      .filter(AccountColumn::Uid.eq(uid))
      .one(&self.database)
      .await?)
  }

  pub async fn find_account(&self,
    facet: &AccountFacet,
    uid: &str
  ) -> Result<AccountModel> {
    self.try_find_account(facet, uid)
      .await?
      .ok_or(Error::AccountNotFound)
  }

  pub async fn remove_account(&self,
    facet: &AccountFacet,
    uid: &str
  ) -> Result<u64> {
    debug!("Remove account...: facet={facet:?}, uid={uid:?}");

    let result = AccountEntity::delete(AccountActiveModel {
      facet: ActiveValue::Set(facet.clone()),
      uid: ActiveValue::Set(uid.to_owned()),
      ..Default::default()
    })
      .exec(&self.database)
      .await?;

    Ok(result.rows_affected)
  }
}

macro_rules! impl_gacha_records_curd {
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
      }
    }
  }
}

impl_gacha_records_curd!(Storage, genshin, GenshinGachaRecord,
  GenshinGachaRecordActiveModel,
  GenshinGachaRecordEntity,
  GenshinGachaRecordColumn
);

impl_gacha_records_curd!(Storage, starrail, StarRailGachaRecord,
  StarRailGachaRecordActiveModel,
  StarRailGachaRecordEntity,
  StarRailGachaRecordColumn
);

/// Tauri commands

#[tauri::command]
async fn upsert_account(
  storage: tauri::State<'_, Storage>,
  active: AccountModel
) -> std::result::Result<AccountModel, String> {
  storage
    .upsert_account(AccountActiveModel::from(active))
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn find_accounts(
  storage: tauri::State<'_, Storage>,
  facet: Option<AccountFacet>
) -> std::result::Result<Vec<AccountModel>, String> {
  storage
    .find_accounts(facet.as_ref())
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn find_account(
  storage: tauri::State<'_, Storage>,
  facet: AccountFacet,
  uid: String
) -> std::result::Result<AccountModel, String> {
  storage
    .find_account(&facet, &uid)
    .await
    .map_err(|e| e.to_string())
}

#[tauri::command]
async fn remove_account(
  storage: tauri::State<'_, Storage>,
  facet: AccountFacet,
  uid: String
) -> std::result::Result<u64, String> {
  storage
    .remove_account(&facet, &uid)
    .await
    .map_err(|e| e.to_string())
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
      ) -> std::result::Result<Vec<$record>, String> {
        storage
          .[<find_ $name _gacha_records>](&uid, gacha_type.as_deref(), limit)
          .await
          .map_err(|e| e.to_string())
      }

      #[tauri::command]
      async fn [<save_ $name _gacha_records>](
        storage: tauri::State<'_, Storage>,
        records: Vec<$record>
      ) -> std::result::Result<u64, String> {
        storage
          .[<save_ $name _gacha_records>](&records)
          .await
          .map_err(|e| e.to_string())
      }
    }
  };
}

impl_gacha_records_tauri_command!(genshin, GenshinGachaRecord);
impl_gacha_records_tauri_command!(starrail, StarRailGachaRecord);

/// Tauri plugin

#[derive(Default)]
pub struct StoragePluginBuilder {
  database_file: Option<PathBuf>
}

impl StoragePluginBuilder {
  const PLUGIN_NAME: &str = "storage";

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
        upsert_account,
        find_accounts,
        find_account,
        remove_account,
        find_genshin_gacha_records,
        save_genshin_gacha_records,
        find_starrail_gacha_records,
        save_starrail_gacha_records
      ])
      .build()
  }
}
