extern crate anyhow;
extern crate reqwest;
extern crate sea_orm;
extern crate serde;
extern crate tauri;
extern crate time;
extern crate thiserror;

#[derive(Debug, thiserror::Error)]
pub enum Error {
  // Crate

  #[error(transparent)]
  Io(#[from] std::io::Error),

  #[error(transparent)]
  Anyhow(#[from] anyhow::Error),

  #[error(transparent)]
  Reqwest(#[from] reqwest::Error),

  #[error(transparent)]
  Db(#[from] sea_orm::error::DbErr),

  #[error(transparent)]
  Tauri(#[from] tauri::Error),

  #[error(transparent)]
  Time(#[from] time::Error),

  // Gacha

  #[error("Illegal Gacha Url")]
  IllegalGachaUrl,

  #[error("Vacant Gacha Url")]
  VacantGachaUrl,

  #[error("Gacha record response: {retcode:?} {message:?}")]
  GachaRecordRetcode {
    retcode: i32,
    message: String
  },

  #[allow(unused)]
  #[error("Gacha record fetcher channel send error")]
  GachaRecordFetcherChannelSend,

  #[allow(unused)]
  #[error("Gacha record fetcher channel join error")]
  GachaRecordFetcherChannelJoin,

  // Account

  #[error("Account already exists")]
  AccountAlreadyExists,

  #[error("Account not found")]
  AccountNotFound,
}

pub type Result<T> = std::result::Result<T, Error>;

/// Native error to JavaScript error

macro_rules! impl_error_identifiers {
  ($( $variant: ident => $ident: ident ),*) => {
    impl Error {
      pub fn identifier(&self) -> &'static str {
        match self {
          $(Error::$variant { .. } => stringify!($ident),)*
          _ => "INTERNAL_CRATE",
        }
      }
    }
  };
}

impl_error_identifiers! {
  IllegalGachaUrl               => ILLEGAL_GACHA_URL,
  VacantGachaUrl                => VACANT_GACHA_URL,
  GachaRecordRetcode            => GACHA_RECORD_RETCODE,
  GachaRecordFetcherChannelSend => GACHA_RECORD_FETCHER_CHANNEL_SEND,
  GachaRecordFetcherChannelJoin => GACHA_RECORD_FETCHER_CHANNEL_JOIN,
  AccountAlreadyExists          => ACCOUNT_ALREADY_EXISTS,
  AccountNotFound               => ACCOUNT_NOT_FOUND
}

impl serde::Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
  where S: serde::Serializer {
    use serde::ser::SerializeStruct;
    let mut state = serializer.serialize_struct("Error", 2)?;
    state.serialize_field("identifier", &self.identifier())?;
    state.serialize_field("message", &self.to_string())?;
    state.end()
  }
}
