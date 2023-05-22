extern crate anyhow;
extern crate reqwest;
extern crate sea_orm;
extern crate serde;
extern crate serde_json;
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
  SerdeJson(#[from] serde_json::Error),

  #[error(transparent)]
  Tauri(#[from] tauri::Error),

  #[error(transparent)]
  Time(#[from] time::Error),

  // Specific

  #[error("Unsupported Operation")]
  UnsupportedOperation,

  // Gacha

  #[error("Illegal Gacha Url")]
  IllegalGachaUrl,

  #[error("Vacant Gacha Url")]
  VacantGachaUrl,

  #[error("Timeoutd Gacha Url")]
  TimeoutdGachaUrl,

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

  // UIGF & SRGF

  #[error("UIGF or SRGF Mismatched UID: expected {expected:?}, actual {actual:?}")]
  UIGFOrSRGFMismatchedUID { expected: String, actual: String },

  #[error("UIGF or SRGF invalid field: {0:?}")]
  UIGFOrSRGFInvalidField(String),

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
  UnsupportedOperation          => UNSUPPORTED_OPERATION,
  IllegalGachaUrl               => ILLEGAL_GACHA_URL,
  VacantGachaUrl                => VACANT_GACHA_URL,
  TimeoutdGachaUrl              => TIMEOUTD_GACHA_URL,
  GachaRecordRetcode            => GACHA_RECORD_RETCODE,
  GachaRecordFetcherChannelSend => GACHA_RECORD_FETCHER_CHANNEL_SEND,
  GachaRecordFetcherChannelJoin => GACHA_RECORD_FETCHER_CHANNEL_JOIN,
  UIGFOrSRGFMismatchedUID       => UIGF_OR_SRGF_MISMATCHED_UID,
  UIGFOrSRGFInvalidField        => UIGF_OR_SRGF_INVALID_FIELD,
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
