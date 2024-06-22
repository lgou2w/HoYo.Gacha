macro_rules! declare_entity {
  (
    $entity:ident,
    $sql_initialize:literal,
    $(
      $sql:literal = $name:ident {
        $($arg_n:ident: $arg_t:ty),*
      } and $operation:ident -> $result:ty,
    )*
  ) => {
    paste::paste! {
      pub struct [<$entity Questioner>];

      impl crate::database::Questioner for [<$entity Questioner>] {
        type Entity = $entity;

        const ENTITY_NAME: &'static str = stringify!($entity);

        fn sql_initialize() -> crate::database::Query {
          sqlx::query($sql_initialize)
        }
      }

      impl [<$entity Questioner>] {
        $(
          pub fn [<sql_ $name>](
            $($arg_n: $arg_t),*
          ) -> crate::database::QueryAs<<Self as crate::database::Questioner>::Entity> {
            sqlx::query_as($sql)
              $(.bind($arg_n))*
          }

          pub async fn $name(
            executor: impl AsRef<sqlx::SqlitePool>,
            $($arg_n: $arg_t),*
          ) -> Result<$result, crate::database::DatabaseError> {
            Self::[<sql_ $name>]($($arg_n),*)
              .$operation(executor.as_ref())
              .await
              .map_err(Into::into)
          }
        )*
      }
    }
  };
}

macro_rules! declare_entity_with_handlers {
  (
    $entity:ident,
    $sql_initialize:literal,
    $(
      $sql:literal = $name:ident {
        $($arg_n:ident: $arg_t:ty),*
      } and $operation:ident -> $result:ty,
    )*
  ) => {
    crate::database::macros::declare_entity! {
      $entity,
      $sql_initialize,
      $(
        $sql = $name {
          $($arg_n: $arg_t),*
        } and $operation -> $result,
      )*
    }

    paste::paste! {
      pub mod handlers {
        use super::*;

        $(
          #[tauri::command]
          pub async fn $name(
            database: crate::database::DatabasePluginState<'_>,
            $($arg_n: $arg_t),*
          ) -> Result<$result, crate::database::DatabaseError> {
            super::[<$entity Questioner>]::$name(AsRef::as_ref(&*database), $($arg_n),*).await
          }
        )*
      }
    }
  }
}

pub(super) use declare_entity;
pub(super) use declare_entity_with_handlers;
