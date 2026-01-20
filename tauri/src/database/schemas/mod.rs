macro_rules! impl_questioner {
  (@bind_param $query:ident, $arg:ident => $transform:expr) => {
    {
      let transformed_value = { $transform };
      $query.bind(transformed_value)
    }
  };

  (@bind_param $query:ident, $arg:ident) => {
    $query.bind(&$arg)
  };

  (@inner, execute, $sql:expr, $($arg_n:ident $(=> $transform:expr)?),* ; $result:ty, $db:expr) => {{
    let mut query = sqlx::query($sql);
    $(
      query = impl_questioner!(@bind_param query, $arg_n $(=> $transform)?);
    )*
    query
      .execute($db)
      .await
      .context(crate::database::DatabaseSnafu)
      .map(|result| result.rows_affected()) // Return number of affected rows
  }};

  (@inner, $operation:ident, $sql:expr, $($arg_n:ident $(=> $transform:expr)?),* ; $result:ty, $db:expr) => {{
    let mut query = sqlx::query_as($sql);
    $(
      query = impl_questioner!(@bind_param query, $arg_n $(=> $transform)?);
    )*
    query
      .$operation($db)
      .await
      .context(crate::database::DatabaseSnafu)
  }};

  (
    $entity:ident of $questioner:ident,
    $(
      $sql:literal = $name:ident {
        $($arg_n:ident: $arg_t:ty $(=> $transform:expr)?),*
      }: $operation:ident -> $result:ty,
    )*
  ) => {
    pub trait $questioner<'c>: sqlx::Executor<'c, Database = sqlx::Sqlite> {
      $(
        #[tracing::instrument(
          skip(self),
          fields(
            r#fn = stringify!($name),
            operation = stringify!($operation),
          )
        )]
        async fn $name(
          self,
          $($arg_n: $arg_t),*
        ) -> Result<$result, crate::database::DatabaseError> {
          use snafu::ResultExt;

          let start = std::time::Instant::now();
          let ret = impl_questioner!(
            @inner,
            $operation,
            $sql,
            $($arg_n $(=> $transform)?),*
            ;
            $result,
            self
          );

          tracing::debug!(
            message = "Executed database operation",
            elapsed = ?start.elapsed(),
          );

          ret
        }
      )*
    }

    // Compat for sqlx
    impl<'c> $questioner<'c> for &'c mut sqlx::SqliteConnection {}
    impl<'c> $questioner<'c> for &'c sqlx::SqlitePool {}
  };
}

use impl_questioner;

macro_rules! impl_questioner_with_handlers {
  (
    #[$handlers:ident]
    $entity:ident of $questioner:ident,
    $(
      $(#[$handler:ident])?
      $sql:literal = $name:ident {
        $($arg_n:ident: $arg_t:ty $(=> $transform:expr)?),*
      }: $operation:ident -> $result:ty,
    )*
  ) => {
    crate::database::schemas::impl_questioner! {
      $entity of $questioner,
      $(
        $sql = $name {
          $($arg_n: $arg_t $(=> $transform)?),*
        }: $operation -> $result,
      )*
    }

    pub mod $handlers {
      use super::*;

      $(
        impl_questioner_with_handlers!(@generate_handler
          $(#[$handler])?
          $questioner -> $name {
            $($arg_n: $arg_t),*
          } -> $result
        );
      )*
    }
  };

  (@generate_handler
    #[$handler:ident]
    $questioner:ident -> $name:ident {
      $($arg_n:ident: $arg_t:ty),*
    } -> $result:ty
  ) => {
    #[tauri::command]
    pub async fn $handler(
      database: crate::bootstrap::TauriDatabaseState<'_>,
      $($arg_n: $arg_t),*
    ) -> Result<$result, crate::error::AppError<crate::database::DatabaseError>> {
      // HACK: DatabaseError -> AppError
      Ok(
        super::$questioner::$name(&database.inner, $($arg_n),*)
          .await?
      )
    }
  };

  (@generate_handler
    $questioner:ident -> $name:ident {
      $($arg_n:ident: $arg_t:ty),*
    } -> $result:ty
  ) => {};
}

mod account;
mod gacha_record;
mod key_value_pair;
mod shared;

pub use account::*;
pub use gacha_record::*;
pub use key_value_pair::*;
pub use shared::*;
