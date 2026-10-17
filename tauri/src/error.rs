use std::error::Error as StdError;
use std::io::Error as IoError;

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

/// JSON key for the discriminant field inside `DetailedError::details`.
///
/// Every `details()` implementation should produce an object whose `kind`
/// field names the specific error variant — e.g.
///
/// ```json
/// { "kind": "Invalid", "foo": "bar" }
/// ```
///
/// Kept as a constant so call sites never hand-write `"kind"` and drift
/// apart. Mirrors [`SERIALIZATION_MARKER`], which marks the same payload
/// from the outer `Error<T>` wrapper.
pub const KIND: &str = "kind";
pub const CAUSE: &str = "cause";

/// Build a `details` object for a variant that wraps a `std::io::Error`.
///
/// ```json
/// {
///   "kind": "OpenFile",
///   "cause": { "kind": "NotFound", "message": "…" }
/// }
/// ```
///
/// `io::Error` doesn't implement `Serialize`, so `ErrorKind` and `Display`
/// are extracted explicitly. Prefer this over [`debug_detail`] — the
/// structured `cause` is easier to consume programmatically than an opaque
/// Debug string.
pub fn io_detail(kind: &str, err: &IoError) -> serde_json::Value {
  serde_json::json!({
    KIND: kind,
    CAUSE: {
      KIND: format_args!("{:?}", err.kind()),
      "message": err.to_string(),
    }
  })
}

/// Build a `details` object for a variant that wraps any error, serialized
/// via its `Debug` representation.
///
/// ```json
/// {
///   "kind": "Reqwest",
///   "cause": "reqwest::Error { kind: Request, url: …, source: … }"
/// }
/// ```
///
/// Used when the wrapped error has no `Serialize` impl and no meaningful
/// structured fields — the `Debug` string is enough for diagnostics.
/// Prefer [`io_detail`] for `std::io::Error` (it produces `{ kind, message }`
/// which is easier to parse)
///
/// Note: `Debug` output is **not** a stable contract — internal details may
/// change across dependency versions. Consumers should not parse `cause`
/// structurally.
pub fn debug_detail(kind: &str, err: &dyn StdError) -> serde_json::Value {
  serde_json::json!({
    KIND: kind,
    CAUSE: format_args!("{err:?}"),
  })
}

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

// Test
#[cfg(test)]
mod tests {
  use std::fmt;
  use std::io::ErrorKind;

  use super::*;

  #[test]
  fn io_detail_shape() {
    let err = IoError::new(ErrorKind::NotFound, "test msg");
    let v = io_detail("Read", &err);
    assert_eq!(v[KIND], "Read");
    assert_eq!(v[CAUSE][KIND], "NotFound");
    assert_eq!(v[CAUSE]["message"], "test msg");
  }

  #[test]
  fn debug_detail_shape() {
    #[derive(Debug)]
    struct Dummy;

    impl fmt::Display for Dummy {
      fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("d")
      }
    }

    impl StdError for Dummy {}

    let v = debug_detail("Reqwest", &Dummy);
    assert_eq!(v[KIND], "Reqwest");
    assert_eq!(v[CAUSE], "Dummy");
  }
}
