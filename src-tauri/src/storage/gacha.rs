extern crate futures;
extern crate paste;
extern crate sea_orm;
extern crate tauri;
extern crate tracing;

use std::path::{Path, PathBuf};
use futures::TryStreamExt;
use paste::paste;
use sea_orm::{
  ActiveValue,
  ColumnTrait,
  ConnectOptions,
  Database,
  DatabaseConnection,
  EntityTrait,
  QueryFilter,
  QueryOrder,
  QuerySelect,
  QueryTrait,
  TransactionTrait,
};
use sea_orm::sea_query::{Condition, OnConflict};
use tauri::Runtime;
use tauri::async_runtime::block_on;
use tauri::plugin::{Builder as TauriPluginBuilder, TauriPlugin};
use tracing::debug;
use crate::constants::DATABASE;
use crate::error::Result;
use crate::gacha::{GenshinGachaRecord, StarRailGachaRecord};
use super::entity_genshin_gacha_record::{
  ActiveModel as GenshinGachaRecordActiveModel,
  Column as GenshinGachaRecordColumn,
  Entity as GenshinGachaRecordEntity,
  Model as GenshinGachaRecordModel
};
use super::entity_starrail_gacha_record::{
  ActiveModel as StarRailGachaRecordActiveModel,
  Column as StarRailGachaRecordColumn,
  Entity as StarRailGachaRecordEntity,
  Model as StarRailGachaRecordModel
};
use super::utilities::{
  create_table_statement,
  create_index_statements,
  execute_statements
};

/// Gacha Storage

pub struct GachaStorage {
  pub database_file: PathBuf,
  pub database: DatabaseConnection
}

impl GachaStorage {
  pub async fn new() -> Result<Self> {
    let database_file = PathBuf::from(DATABASE);
    Self::new_with_database_file(database_file).await
  }

  pub async fn new_with_database_file<P: AsRef<Path>>(database_file: P) -> Result<Self> {
    let database_file = database_file.as_ref();
    let url = format!("sqlite://{}?mode=rwc", database_file.display());

    debug!("Create gacha storage with database: {url}");
    debug!("Connecting to gacha storage...");
    let options = ConnectOptions::new(url);
    let database = Database::connect(options).await?;
    debug!("Gacha storage connected");

    Ok(Self {
      database_file: database_file.to_path_buf(),
      database
    })
  }

  pub async fn initialize(&self) -> Result<()> {
    debug!("Initializing gacha storage...");

    {
      debug!("Creating tables...");
      let statement1 = create_table_statement(GenshinGachaRecordEntity);
      let statement2 = create_table_statement(StarRailGachaRecordEntity);
      execute_statements(&self.database, &[statement1, statement2]).await?;
    }

    {
      debug!("Creating indexes...");
      let statement1 = create_index_statements(GenshinGachaRecordEntity);
      let statement2 = create_index_statements(StarRailGachaRecordEntity);
      let mut statements = statement1;
      statements.extend(statement2);
      execute_statements(&self.database, &statements).await?;
    }

    debug!("Gacha storage initialized");
    Ok(())
  }
}

macro_rules! impl_curd {
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

impl_curd!(GachaStorage, genshin, GenshinGachaRecord,
  GenshinGachaRecordActiveModel,
  GenshinGachaRecordEntity,
  GenshinGachaRecordColumn
);

impl_curd!(GachaStorage, star_rail, StarRailGachaRecord,
  StarRailGachaRecordActiveModel,
  StarRailGachaRecordEntity,
  StarRailGachaRecordColumn
);

/// Gacha ext

impl From<GenshinGachaRecord> for GenshinGachaRecordActiveModel {
  fn from(value: GenshinGachaRecord) -> Self {
    Self {
      id: ActiveValue::set(value.id),
      uid: ActiveValue::set(value.uid),
      gacha_type: ActiveValue::set(value.gacha_type),
      item_id: ActiveValue::set(value.item_id),
      count: ActiveValue::set(value.count),
      time: ActiveValue::set(value.time),
      name: ActiveValue::set(value.name),
      lang: ActiveValue::set(value.lang),
      item_type: ActiveValue::set(value.item_type),
      rank_type: ActiveValue::set(value.rank_type)
    }
  }
}

impl From<GenshinGachaRecordModel> for GenshinGachaRecord {
  fn from(value: GenshinGachaRecordModel) -> Self {
    Self {
      id: value.id,
      uid: value.uid,
      gacha_type: value.gacha_type,
      item_id: value.item_id,
      count: value.count,
      time: value.time,
      name: value.name,
      lang: value.lang,
      item_type: value.item_type,
      rank_type: value.rank_type
    }
  }
}

impl From<StarRailGachaRecord> for StarRailGachaRecordActiveModel {
  fn from(value: StarRailGachaRecord) -> Self {
    Self {
      id: ActiveValue::set(value.id),
      uid: ActiveValue::set(value.uid),
      gacha_id: ActiveValue::set(value.gacha_id),
      gacha_type: ActiveValue::set(value.gacha_type),
      item_id: ActiveValue::set(value.item_id),
      count: ActiveValue::set(value.count),
      time: ActiveValue::set(value.time),
      name: ActiveValue::set(value.name),
      lang: ActiveValue::set(value.lang),
      item_type: ActiveValue::set(value.item_type),
      rank_type: ActiveValue::set(value.rank_type)
    }
  }
}

impl From<StarRailGachaRecordModel> for StarRailGachaRecord {
  fn from(value: StarRailGachaRecordModel) -> Self {
    Self {
      id: value.id,
      uid: value.uid,
      gacha_id: value.gacha_id,
      gacha_type: value.gacha_type,
      item_id: value.item_id,
      count: value.count,
      time: value.time,
      name: value.name,
      lang: value.lang,
      item_type: value.item_type,
      rank_type: value.rank_type
    }
  }
}

/// Tauri commands

macro_rules! impl_tauri_command {
  ($name: tt, $record: ident) => {
    paste! {
      #[tauri::command]
      async fn [<find_ $name _gacha_records>](
        storage: tauri::State<'_, GachaStorage>,
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
        storage: tauri::State<'_, GachaStorage>,
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

impl_tauri_command!(genshin, GenshinGachaRecord);
impl_tauri_command!(star_rail, StarRailGachaRecord);

/// Tauri plugin

#[derive(Default)]
pub struct GachaStoragePluginBuilder {
  database_file: Option<PathBuf>
}

impl GachaStoragePluginBuilder {
  const PLUGIN_NAME: &str = "storage-gacha";

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
        debug!("Setup gacha storage plugin...");
        let storage: Result<GachaStorage> = block_on(async move {
          let storage = if let Some(database_file) = self.database_file {
            GachaStorage::new_with_database_file(database_file).await?
          } else {
            GachaStorage::new().await?
          };
          storage.initialize().await?;
          Ok(storage)
        });

        use tauri::Manager;
        app_handle.manage(storage?);

        Ok(())
      })
      .invoke_handler(tauri::generate_handler![
        find_genshin_gacha_records,
        save_genshin_gacha_records,
        find_star_rail_gacha_records,
        save_star_rail_gacha_records
      ])
      .build()
  }
}
