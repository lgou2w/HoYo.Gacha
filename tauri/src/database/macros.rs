macro_rules! impl_questioner {
  (
    $entity:ident of $questioner:ident,
    $(
      $sql:literal = $name:ident {
        $($arg_n:ident: $arg_t:ty $(=> $transform:expr)?),*
      }: $operation:ident -> $result:ty,
    )*
  ) => {
    #[doc = concat!("Queries for `", stringify!($entity), "`.")]
    pub trait $questioner: $crate::database::ConnectionExt {
      $(
        #[tracing::instrument(
          skip(self),
          fields(
            r#fn = stringify!($name),
            operation = stringify!($operation),
          )
        )]
        fn $name(
          &self,
          $($arg_n: $arg_t),*
        ) -> Result<$result, rusqlite::Error> {
          let start = std::time::Instant::now();
          let ret = self.$operation($sql, rusqlite::params![
            $(
              $crate::database::macros::impl_questioner!(@value $arg_n $(=> $transform)?)
            ),*
          ]);

          tracing::debug!(message = "Executed database operation", elapsed = ?start.elapsed());
          ret
        }
      )*
    }

    // Compat for Rusqlite
    impl $questioner for rusqlite::Connection {}
  };

  (@value $arg:ident) => { $arg };
  (@value $arg:ident => $transform:expr) => { $transform };
}

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
    $crate::database::macros::impl_questioner! {
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
    #[tracing::instrument(skip_all)]
    #[tauri::command]
    pub async fn $handler(
      database: $crate::database::TauriDatabaseState<'_>,
      $($arg_n: $arg_t),*
    ) -> Result<$result, $crate::error::AppError<$crate::database::DatabaseError>> {
      database
        .interact(move |conn| super::$questioner::$name(conn, $($arg_n),*))
        .await
        .map_err(Into::into)
    }
  };

  (@generate_handler
    $questioner:ident -> $name:ident {
      $($arg_n:ident: $arg_t:ty),*
    } -> $result:ty
  ) => {};
}

pub(crate) use impl_questioner;
pub(crate) use impl_questioner_with_handlers;
