extern crate sea_orm;

use sea_orm::{ConnectionTrait, DatabaseConnection, DbBackend, DbErr, EntityTrait, Schema, StatementBuilder};
use sea_orm::sea_query::{IndexCreateStatement, TableCreateStatement};

pub fn create_table_statement<E>(
  entity: E
) -> TableCreateStatement
where E: EntityTrait {
  let schema = Schema::new(DbBackend::Sqlite);
  schema
    .create_table_from_entity(entity)
    .if_not_exists()
    .take()
}

pub fn create_index_statements<E>(
  entity: E
) -> Vec<IndexCreateStatement>
where E: EntityTrait {
  let schema = Schema::new(DbBackend::Sqlite);
  schema
    .create_index_from_entity(entity)
    .iter_mut()
    .map(|index| index.if_not_exists().take())
    .collect::<Vec<_>>()
}

pub async fn execute_statement<S>(
  database: &DatabaseConnection,
  statement: &S
) -> Result<(), DbErr>
where S: StatementBuilder {
  database
    .execute(DbBackend::Sqlite.build(statement))
    .await?;
  Ok(())
}

pub async fn execute_statements<S>(
  database: &DatabaseConnection,
  statements: &[S]
) -> Result<(), DbErr>
where S: StatementBuilder {
  for statement in statements {
    execute_statement(database, statement).await?;
  }
  Ok(())
}
