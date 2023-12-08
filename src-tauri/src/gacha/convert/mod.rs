use std::fmt::Debug;
use std::io::{Read, Write};

use futures_util::future::BoxFuture;

use crate::database::GachaRecord;

pub mod srgf;
pub mod uigf;

pub trait GachaConverter {
  type Error: Debug + Send + Sync;
  type Provided: Sized;

  fn convert(&self, records: Vec<GachaRecord>) -> Result<Self::Provided, Self::Error>;
  fn deconvert(&self, provided: Self::Provided) -> Result<Vec<GachaRecord>, Self::Error>;
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

  fn read<'a>(
    &'a mut self,
    input: impl Read + Send + Sync + 'a,
  ) -> BoxFuture<'a, Result<Vec<GachaRecord>, Self::Error>>;
}
