use hg_url_parser::GachaUrlParseError;
use hg_url_parser::finder::GachaUrlFindError;
use hg_url_scraper::request::GachaUrlRequestError;
use hg_url_scraper::validate::GachaUrlValidationError;
use serde_json::json;

use crate::error::{DetailedError, KIND, debug_detail, io_detail};

// Error compats

impl DetailedError for GachaUrlFindError {
  fn name(&self) -> &'static str {
    stringify!(GachaUrlFindError)
  }

  fn details(&self) -> Option<serde_json::Value> {
    Some(match self {
      Self::OpenDiskCache { source } => io_detail(stringify!(OpenDiskCache), source),
      Self::ReadDiskCache { source } => io_detail(stringify!(ReadDiskCache), source),
      Self::OpenWebcaches { source } => io_detail(stringify!(OpenWebcaches), source),
      Self::EmptyWebcaches => json!({
        KIND: stringify!(EmptyWebcaches)
      }),
    })
  }
}

impl DetailedError for GachaUrlParseError {
  fn name(&self) -> &'static str {
    stringify!(GachaUrlParseError)
  }

  fn details(&self) -> Option<serde_json::Value> {
    Some(match self {
      Self::Invalid => json!({
        KIND: stringify!(Invalid),
      }),
      Self::MissingParam { name } => json!({
        KIND: stringify!(MissingParam),
        "name": name,
      }),
      Self::UnsupportedGamebiz { value } => json!({
        KIND: stringify!(UnsupportedGamebiz),
        "value": value,
      }),
    })
  }
}

impl DetailedError for GachaUrlRequestError {
  fn name(&self) -> &'static str {
    stringify!(GachaUrlRequestError)
  }

  fn details(&self) -> Option<serde_json::Value> {
    Some(match self {
      Self::UnsupportedEndpoint { gamebiz, endpoint } => json!({
        KIND: stringify!(UnsupportedEndpoint),
        "gamebiz": gamebiz.codename(),
        "endpoint": format_args!("{endpoint:?}"),
      }),
      Self::Reqwest { source } => debug_detail(stringify!(Reqwest), source),
      Self::AuthkeyTimeout => json!({
        KIND: stringify!(AuthkeyTimeout),
      }),
      Self::VisitTooFrequently => json!({
        KIND: stringify!(VisitTooFrequently),
      }),
      Self::UnexpectedResponse { retcode, message } => json!({
        KIND: stringify!(UnexpectedResponse),
        "retcode": retcode,
        "message": message,
      }),
      Self::ReachedMaxAttempts => json!({
        KIND: stringify!(ReachedMaxAttempts),
      }),
    })
  }
}

impl DetailedError for GachaUrlValidationError {
  fn name(&self) -> &'static str {
    match self {
      // Source-bearing variants: delegate to the inner error, if it has
      // details of its own.
      Self::Parse { source } => source.name(),
      Self::Request { source } => source.name(),

      _ => stringify!(GachaUrlValidationError),
    }
  }

  fn details(&self) -> Option<serde_json::Value> {
    match self {
      // Source-bearing variants: delegate to the inner error, if it has
      // details of its own.
      Self::Parse { source } => source.details(),
      Self::Request { source } => source.details(),

      Self::InconsistentGamebiz {
        expected,
        actual,
        region,
      } => Some(json!({
        KIND: stringify!(InconsistentGamebiz),
        "expected": expected.to_string(),
        "actual": actual.codename(),
        "region": region,
      })),
      Self::EmptyData => Some(json!({
        KIND: stringify!(EmptyData),
      })),
      Self::NotFound => Some(json!({
        KIND: stringify!(NotFound),
      })),
      Self::InconsistentUid { expected, actuals } => Some(json!({
        KIND: stringify!(InconsistentUid),
        "expected": expected,
        "actuals": actuals,
      })),
    }
  }
}
