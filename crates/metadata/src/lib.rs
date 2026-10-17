#![forbid(unsafe_code)]

mod bake;
pub mod providers;
pub mod raw;
mod types;

pub use bake::{LOCALE_ALIASES, MismatchedItemsAndNames};
pub use types::*;

pub fn load<T: providers::MetadataProvider>(
  provider: T,
) -> Result<Result<Box<dyn Metadata>, MismatchedItemsAndNames>, T::Error> {
  let raw = provider.load()?;
  Ok(bake::bake(raw))
}
