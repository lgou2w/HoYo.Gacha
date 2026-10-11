use std::error::Error as StdError;

use serde::ser::SerializeStruct;
use serde::{Serialize, Serializer};
use snafu::Snafu;

pub trait DetailedError: StdError {
  fn name(&self) -> &'static str;

  fn details(&self) -> Option<serde_json::Value> {
    None
  }

  #[inline]
  fn boxed(self) -> Box<dyn DetailedError + Send + 'static>
  where
    Self: Sized + Send + 'static,
  {
    Box::new(self)
  }
}

pub type BoxDynDetailedError = Box<dyn DetailedError + Send + 'static>;

// App error

#[derive(Debug, Snafu)]
#[snafu(visibility, display("{source}"))]
pub struct AppError<T: DetailedError + 'static> {
  source: T,
}

impl<T: DetailedError + 'static> AsRef<T> for AppError<T> {
  fn as_ref(&self) -> &T {
    &self.source
  }
}

impl<T: DetailedError + 'static> From<T> for AppError<T> {
  fn from(value: T) -> Self {
    Self { source: value }
  }
}

// Serde

impl<T: DetailedError + Send + 'static> Serialize for AppError<T> {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    (&self.source as &(dyn DetailedError + Send)).serialize(serializer)
  }
}

pub const SERIALIZATION_MARKER: &str = "__HG_ERROR__";

impl Serialize for dyn DetailedError + Send + 'static {
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
