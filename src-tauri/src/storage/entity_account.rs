use sea_orm::entity::prelude::*;
use sea_orm::sea_query::{ArrayType, ColumnType, Nullable, Value, ValueType, ValueTypeErr};
use sea_orm::{TryGetError, TryGetable};
use serde::{Deserialize, Serialize};
use serde_json::{Map as Json, Value as JsonValue};

#[derive(
  Clone, Debug, PartialEq, Eq, Deserialize, Serialize, EnumIter, DeriveActiveEnum, DeriveDisplay,
)]
#[sea_orm(rs_type = "String", db_type = "Text")]
pub enum AccountFacet {
  #[sea_orm(string_value = "genshin")]
  #[serde(rename = "genshin")]
  Genshin,
  #[sea_orm(string_value = "starrail")]
  #[serde(rename = "starrail")]
  StarRail,
}

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize)]
pub struct AccountProperties(pub Json<String, JsonValue>);

#[derive(Clone, Debug, PartialEq, Eq, Deserialize, Serialize, DeriveEntityModel)]
#[sea_orm(table_name = "accounts")]
#[serde(rename_all = "camelCase")]
pub struct Model {
  #[sea_orm(primary_key, auto_increment = true)]
  pub id: u32,
  #[sea_orm(indexed)]
  pub facet: AccountFacet,
  #[sea_orm(indexed)]
  pub uid: String,

  pub game_data_dir: String,
  pub gacha_url: Option<String>,
  pub properties: Option<AccountProperties>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}

/// Account Properties converts

impl std::ops::Deref for AccountProperties {
  type Target = Json<String, JsonValue>;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}

impl From<AccountProperties> for Value {
  fn from(value: AccountProperties) -> Self {
    let result = serde_json::to_string(&*value).ok().map(Box::new);
    Value::String(result)
  }
}

impl TryGetable for AccountProperties {
  fn try_get_by<I: sea_orm::ColIdx>(res: &QueryResult, index: I) -> Result<Self, TryGetError> {
    let json_str: String =
      res
        .try_get_by(index)
        .map_err(TryGetError::DbErr)
        .and_then(|opt: Option<String>| {
          let str = index
            .as_str()
            .map(str::to_string)
            .or(index.as_usize().map(ToString::to_string))
            .unwrap();
          opt.ok_or(TryGetError::Null(str))
        })?;
    serde_json::from_str(&json_str).map_err(|e| TryGetError::DbErr(DbErr::Json(e.to_string())))
  }
}

impl ValueType for AccountProperties {
  fn try_from(v: Value) -> Result<Self, ValueTypeErr> {
    match v {
      Value::String(Some(x)) => Ok(AccountProperties(
        serde_json::from_str(&x).map_err(|_| ValueTypeErr)?,
      )),
      _ => Err(ValueTypeErr),
    }
  }

  fn type_name() -> String {
    stringify!(AccountProperties).to_owned()
  }

  fn array_type() -> ArrayType {
    ArrayType::String
  }

  fn column_type() -> ColumnType {
    ColumnType::String(None)
  }
}

impl Nullable for AccountProperties {
  fn null() -> Value {
    Value::String(None)
  }
}
