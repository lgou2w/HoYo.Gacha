use std::fs::File;
use std::io::{Error, ErrorKind, Read, Result, Seek, SeekFrom};
use std::path::Path;

use crate::Addr;
use crate::reader::DiskCacheRead;

pub const INDEX_MAGIC: u32 = 0xC103CAC3;
pub const INDEX_VERSION2_0: u32 = 0x20000;
pub const INDEX_VERSION2_1: u32 = 0x20001;
pub const INDEX_VERSION3_0: u32 = 0x30000;
pub const INDEX_TABLE_SIZE: u32 = 0x10000;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct IndexFileHeader {
  pub magic: u32,
  pub version: u32,
  pub num_entries: i32,
  pub num_bytes: i32,
  pub last_file: i32,
  pub this_id: i32,
  pub stats: Addr,
  pub table_len: i32,
  pub crash: i32,
  pub experiment: i32,
  pub create_time: u64,
  // HACK: Useless. See below
  // pub pad: [u32; 52],
  // pub lru: Lru,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct IndexFile {
  pub header: IndexFileHeader,
  pub table: Vec<Addr>,
}

impl IndexFile {
  pub fn from_reader<R: Read + Seek>(mut reader: R) -> Result<Self> {
    let magic = reader.read_u32()?;
    if magic != INDEX_MAGIC {
      return Err(Error::new(
        ErrorKind::InvalidData,
        format!("Invalid index file magic number: 0x{magic:X} (Expected: 0x{INDEX_MAGIC:X})"),
      ));
    }

    let version = reader.read_u32()?;
    match version {
      INDEX_VERSION2_0 | INDEX_VERSION2_1 => {} // Ok
      INDEX_VERSION3_0 => {
        return Err(Error::new(
          ErrorKind::InvalidData,
          format!(
            "Unimplemented index file version: 0x{INDEX_VERSION3_0:X} (Current implementation is version 2.x only)"
          ),
        ));
      }
      _ => {
        return Err(Error::new(
          ErrorKind::InvalidData,
          format!(
            "Unsupported index file version: 0x{version:X} (Valid: 0x{INDEX_VERSION2_0:X}, 0x{INDEX_VERSION2_1:X})"
          ),
        ));
      }
    }

    let num_entries = reader.read_i32()?;
    let num_bytes = reader.read_i32()?;
    let last_file = reader.read_i32()?;
    let this_id = reader.read_i32()?;
    let stats = reader.read_addr()?;

    let mut table_len = reader.read_i32()?;
    if table_len > INDEX_TABLE_SIZE as i32 {
      table_len = INDEX_TABLE_SIZE as _;
    }

    let crash = reader.read_i32()?;
    let experiment = reader.read_i32()?;
    let create_time = reader.read_u64()?;

    // HACK: Useless
    // Pad: [u32; 52] -> 4 * 52 = 208 Bytes
    // LRU            -> 112 Bytes
    reader.seek(SeekFrom::Current(4 * 52 + 112))?;

    // Index table of Cache addresses
    let mut table = Vec::with_capacity(table_len as usize);
    for _ in 0..table_len {
      let addr = reader.read_addr()?;
      if addr.is_initialized() {
        table.push(addr);
      }
    }

    Ok(Self {
      header: IndexFileHeader {
        magic,
        version,
        num_entries,
        num_bytes,
        last_file,
        this_id,
        stats,
        table_len,
        crash,
        experiment,
        create_time,
      },
      table,
    })
  }

  pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
    let file = File::open(path)?;
    Self::from_reader(file)
  }
}
