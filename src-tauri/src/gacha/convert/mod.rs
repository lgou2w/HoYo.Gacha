use std::fmt::Debug;
use std::io::{Read, Write};

use futures_util::future::BoxFuture;

use crate::models::GachaRecord;

mod plugin;
pub mod srgf;
pub mod uigf;

pub use plugin::*;

pub trait GachaConverter {
  type Error: Debug + Send + Sync;
  type Provided: Sized;
  type Context;

  fn convert(
    &self,
    records: Vec<GachaRecord>,
    context: &Self::Context,
  ) -> Result<Self::Provided, Self::Error>;

  fn deconvert(
    &self,
    provided: Self::Provided,
    context: &Self::Context,
  ) -> Result<Vec<GachaRecord>, Self::Error>;
}

pub trait GachaRecordsWriter {
  type Error: Debug + Send + Sync;

  fn write<'a>(
    &'a mut self,
    records: Vec<GachaRecord>,
    output: impl Write + Send + Sync + 'a,
  ) -> BoxFuture<'a, Result<(), Self::Error>>;
}

pub trait GachaRecordsReader {
  type Error: Debug + Send + Sync;

  #[allow(dead_code)]
  fn read<'a>(
    &'a mut self,
    input: impl Read + Send + Sync + 'a,
  ) -> BoxFuture<'a, Result<Vec<GachaRecord>, Self::Error>> {
    self.read_with_validation(input, None)
  }

  fn read_with_validation<'a>(
    &'a mut self,
    input: impl Read + Send + Sync + 'a,
    expected_uid: Option<String>,
  ) -> BoxFuture<'a, Result<Vec<GachaRecord>, Self::Error>>;
}
