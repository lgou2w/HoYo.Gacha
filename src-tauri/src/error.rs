extern crate anyhow;
extern crate reqwest;
extern crate sea_orm;
extern crate serde;
extern crate thiserror;
extern crate url;

#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error(transparent)]
  Io(#[from] std::io::Error),

  #[error(transparent)]
  Anyhow(#[from] anyhow::Error),

  #[error(transparent)]
  Reqwest(#[from] reqwest::Error),

  #[error(transparent)]
  Db(#[from] sea_orm::error::DbErr),

  #[error(transparent)]
  UrlParse(#[from] url::ParseError),

  #[error("Invalid Gacha Url")]
  InvalidGachaUrl,

  #[error("Error Gacha Record response: {message:?} ({retcode:?})")]
  Retcode {
    retcode: i32,
    message: String
  },

  #[allow(unused)]
  #[error("Invalid Gacha Url")]
  GachaRecordFetcherChannelSend
}

pub type Result<T> = std::result::Result<T, Error>;
