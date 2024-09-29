use std::error::Error as StdError;
use std::fmt::{self, Display};

use serde::ser::SerializeStruct;
use serde::{Serialize, Serializer};

pub const SERIALIZATION_MARKER: &str = "__HG_ERROR__";

pub trait ErrorDetails: StdError {
  fn name(&self) -> &'static str;
  fn details(&self) -> serde_json::Value;
}

#[derive(Debug)]
pub struct Error<T>(T);

impl<T> Error<T> {
  #[inline]
  pub fn into_inner(self) -> T {
    self.0
  }
}

impl<T> AsRef<T> for Error<T> {
  fn as_ref(&self) -> &T {
    &self.0
  }
}

impl<T: ErrorDetails> From<T> for Error<T> {
  fn from(value: T) -> Self {
    Self(value)
  }
}

impl<T: ErrorDetails> Display for Error<T> {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self.0)
  }
}

impl<T: ErrorDetails + 'static> StdError for Error<T> {
  fn source(&self) -> Option<&(dyn StdError + 'static)> {
    Some(&self.0)
  }
}

impl<T: ErrorDetails + 'static> Serialize for Error<T> {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    (&self.0 as &dyn ErrorDetails).serialize(serializer)
  }
}

impl Serialize for dyn ErrorDetails + 'static {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    let mut state = serializer.serialize_struct("Error", 4)?;
    state.serialize_field("name", &self.name())?;
    state.serialize_field("message", &self.to_string())?;
    state.serialize_field("details", &self.details())?;
    state.serialize_field(SERIALIZATION_MARKER, &true)?;
    state.end()
  }
}

macro_rules! declare_error_kinds {
  (@field_detail $field:ident) => { $field };
  (@field_detail $field:ident => $field_expr:expr) => { $field_expr };

  ($name:ident, kinds {
    $(
      #[$error:meta]
      $kind:ident$({ $($field:ident:$field_ty:ty$(=> $field_expr:expr)?),* })?,
    )*
  }) => {
    paste::paste! {
      #[derive(Debug, thiserror::Error)]
      pub enum [<$name Kind>] {
        $(
          #[$error]
          $kind$({ $($field:$field_ty),* })?,
        )*
      }

      impl crate::error::ErrorDetails for [<$name Kind>] {
        fn name(&self) -> &'static str {
          stringify!($name)
        }

        fn details(&self) -> serde_json::Value {
          match self {
            $(
              Self::$kind$({ $($field),* })? => serde_json::json!({
                "kind": stringify!($kind),
                $(
                  $(
                    stringify!($field): declare_error_kinds!(
                      @field_detail $field$(=> $field_expr)?
                    ),
                  )*
                ),*
              }),
            )*
          }
        }
      }

      pub type $name = crate::error::Error<[<$name Kind>]>;
    }
  };
}

pub(super) use declare_error_kinds;

// Tests

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_serialize() {
    #[derive(Debug)]
    struct Foo;

    impl Display for Foo {
      fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("Foo")
      }
    }

    impl StdError for Foo {}
    impl ErrorDetails for Foo {
      fn name(&self) -> &'static str {
        "Foo"
      }

      fn details(&self) -> serde_json::Value {
        serde_json::Value::Null
      }
    }

    let error = Error(Foo);
    assert_eq!(format!("{error:?}"), "Error(Foo)");
    assert_eq!(format!("{error}"), "Foo");

    let name = error.as_ref().name();
    assert_eq!(
      serde_json::to_string(&error).unwrap(),
      format!(
        r#"{{"name":"{name}","message":"Foo","details":null,"{SERIALIZATION_MARKER}":true}}"#
      )
    );
  }
}
