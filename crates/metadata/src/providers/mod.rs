use crate::raw::RawMetadata;

cfg_if::cfg_if!(if #[cfg(feature = "json")] {
  mod json;
  pub use json::*;
});

cfg_if::cfg_if!(if #[cfg(feature = "binary")] {
  mod binary;
  pub use binary::*;
});

pub trait MetadataProvider {
  type Error: std::error::Error;

  fn load(self) -> Result<RawMetadata, Self::Error>;
}
