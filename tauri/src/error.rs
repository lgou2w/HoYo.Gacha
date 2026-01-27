use std::error::Error;

use serde::ser::SerializeStruct;
use serde::{Serialize, Serializer};
use snafu::Snafu;

pub trait ErrorDetails: Error {
  fn name(&self) -> &'static str;

  fn details(&self) -> Option<serde_json::Value> {
    None
  }

  #[inline]
  fn boxed(self) -> Box<dyn ErrorDetails + Send + 'static>
  where
    Self: Sized + Send + 'static,
  {
    Box::new(self)
  }
}

pub type BoxDynErrorDetails = Box<dyn ErrorDetails + Send + 'static>;

#[derive(Debug, Snafu)]
#[snafu(visibility, display("{source}"))] // Display -> source
pub struct AppError<T: ErrorDetails + 'static> {
  source: T,
}

impl<T: ErrorDetails + 'static> AsRef<T> for AppError<T> {
  fn as_ref(&self) -> &T {
    &self.source
  }
}

impl<T: ErrorDetails + 'static> From<T> for AppError<T> {
  fn from(value: T) -> Self {
    Self { source: value }
  }
}

impl<T: ErrorDetails + Send + 'static> Serialize for AppError<T> {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    (&self.source as &(dyn ErrorDetails + Send)).serialize(serializer)
  }
}

pub const SERIALIZATION_MARKER: &str = "__HG_ERROR__";

impl Serialize for dyn ErrorDetails + Send + 'static {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    let mut state = serializer.serialize_struct("AppError", 4)?;
    state.serialize_field("name", &self.name())?;
    state.serialize_field("message", &self.to_string())?;
    state.serialize_field("details", &self.details())?;
    state.serialize_field(SERIALIZATION_MARKER, &true)?;
    state.end()
  }
}

// region: Compat

pub mod compat {
  use hg_url_finder::dirty::DirtyGachaUrlError;
  use hg_url_finder::parse::ParsedGachaUrlError;
  use hg_url_scraper::requester::GachaUrlRequestError;

  use super::*;

  impl ErrorDetails for DirtyGachaUrlError {
    fn name(&self) -> &'static str {
      stringify!(DirtyGachaUrlError)
    }

    fn details(&self) -> Option<serde_json::Value> {
      use serde_json::json;

      Some(match self {
        Self::OpenDiskCache { source }
        | Self::ReadDiskCache { source }
        | Self::OpenWebcaches { source } => json!({
          "kind": match self {
            Self::OpenDiskCache { .. } => stringify!(OpenDiskCache),
            Self::ReadDiskCache { .. } => stringify!(ReadDiskCache),
            Self::OpenWebcaches { .. } => stringify!(OpenWebcaches),
            _ => unreachable!()
          },
          "cause": json!({
            "kind": format_args!("{:?}", source.kind()),
            "message": source.to_string(),
          })
        }),
        Self::EmptyWebCaches => json!({
          "kind": stringify!(EmptyWebCaches),
        }),
      })
    }
  }

  impl ErrorDetails for ParsedGachaUrlError {
    fn name(&self) -> &'static str {
      stringify!(ParsedGachaUrlError)
    }

    fn details(&self) -> Option<serde_json::Value> {
      use serde_json::json;

      Some(match self {
        Self::InvalidUrl => json!({
          "kind": stringify!(InvalidUrl),
        }),
        Self::RequiredParam { name } => json!({
          "kind": stringify!(RequiredParam),
          "name": name,
        }),
        Self::UnsupportedGameBiz { game_biz, region } => json!({
          "kind": stringify!(UnsupportedGameBiz),
          "gameBiz": game_biz,
          "region": region,
        }),
      })
    }
  }

  impl ErrorDetails for GachaUrlRequestError {
    fn name(&self) -> &'static str {
      stringify!(GachaUrlRequestError)
    }

    fn details(&self) -> Option<serde_json::Value> {
      use serde_json::json;

      Some(match self {
        Self::UnsupportedEndpoint { game_biz, endpoint } => json!({
          "kind": stringify!(UnsupportedEndpoint),
          "gameBiz": format_args!("{game_biz:?}"),
          "endpoint": format_args!("{endpoint:?}"),
        }),
        Self::Reqwest { source } => json!({
          "kind": stringify!(Reqwest),
          "cause": format_args!("{source:?}"),
        }),
        Self::AuthkeyTimeout => json!({
          "kind": stringify!(AuthkeyTimeout),
        }),
        Self::VisitTooFrequently => json!({
          "kind": stringify!(VisitTooFrequently),
        }),
        Self::UnexpectedResponse { retcode, message } => json!({
          "kind": stringify!(UnexpectedResponse),
          "retcode": retcode,
          "message": message,
        }),
        Self::ReachedMaxAttempts => json!({
          "kind": stringify!(ReachedMaxAttempts),
        }),
      })
    }
  }
}

// endregion

#[cfg(test)]
mod tests {
  use super::*;

  #[derive(Debug, Snafu)]
  #[snafu(display("Foo"))]
  struct Foo {
    details: bool,
  }

  impl ErrorDetails for Foo {
    fn name(&self) -> &'static str {
      "Foo"
    }

    fn details(&self) -> Option<serde_json::Value> {
      match self.details {
        false => None,
        true => Some(serde_json::Value::Bool(true)),
      }
    }
  }

  const FOO: AppError<Foo> = AppError {
    source: Foo { details: false },
  };

  const FOO_WITH_DETAILS: AppError<Foo> = AppError {
    source: Foo { details: true },
  };

  #[test]
  fn test_snafu() {
    assert_eq!(FOO.source.name(), "Foo");
    assert_eq!(format!("{FOO}"), "Foo"); // Display
    assert_eq!(
      format!("{FOO:?}"),
      "AppError { source: Foo { details: false } }"
    );

    assert_eq!(
      format!("{FOO_WITH_DETAILS:?}"),
      "AppError { source: Foo { details: true } }"
    );
  }

  #[test]
  fn test_serialize() {
    assert_eq!(
      serde_json::to_string(&FOO).unwrap(),
      format!(
        r#"{{"name":"{name}","message":"Foo","details":null,"{marker}":true}}"#,
        name = FOO.source.name(),
        marker = SERIALIZATION_MARKER
      )
    );

    assert_eq!(
      serde_json::to_string(&FOO_WITH_DETAILS).unwrap(),
      format!(
        r#"{{"name":"{name}","message":"Foo","details":true,"{marker}":true}}"#,
        name = FOO_WITH_DETAILS.source.name(),
        marker = SERIALIZATION_MARKER
      )
    );
  }
}
