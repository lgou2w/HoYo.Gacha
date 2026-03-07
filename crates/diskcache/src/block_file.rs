use std::fmt;
use std::fs::File;
use std::io::{Error, ErrorKind, Read, Result, Seek, SeekFrom};
use std::path::Path;

use crate::Addr;
use crate::reader::DiskCacheRead;

pub const BLOCK_MAGIC: u32 = 0xC104CAC3;
pub const BLOCK_VERSION2_0: u32 = 0x20000;
pub const BLOCK_VERSION3_0: u32 = 0x30000;
pub const BLOCK_HEADER_SIZE: u32 = 8192;
pub const BLOCK_MAX_BLOCKS: u32 = (BLOCK_HEADER_SIZE - 80) * 8;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct BlockFileHeader {
  pub magic: u32,
  pub version: u32,
  pub this_file: i16,
  pub next_file: i16,
  pub entry_size: i32,
  pub num_entries: i32,
  pub max_entries: i32,
  pub empty: [i32; 4],
  pub hints: [i32; 4],
  pub updating: i32,
  pub user: [i32; 5],
  // HACK: Useless. See below
  // pub allocation_map: [u32; BLOCK_MAX_BLOCKS as usize / 32],
}

#[derive(Clone, PartialEq, Eq)]
pub struct BlockFile {
  pub header: BlockFileHeader,
  pub data: Vec<u8>,
}

impl fmt::Debug for BlockFile {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.debug_struct("BlockFile")
      .field("header", &self.header)
      .field("data", &format_args!("[..{} Bytes]", self.data.len())) // Too big
      .finish()
  }
}

impl BlockFile {
  pub fn from_reader<R: Read + Seek>(mut reader: R) -> Result<Self> {
    let magic = reader.read_u32()?;
    if magic != BLOCK_MAGIC {
      return Err(Error::new(
        ErrorKind::InvalidData,
        format!("Invalid block file magic number: 0x{magic:X} (Expected: 0x{BLOCK_MAGIC:X})"),
      ));
    }

    let version = reader.read_u32()?;
    match version {
      BLOCK_VERSION2_0 => {} // Ok
      BLOCK_VERSION3_0 => {
        return Err(Error::new(
          ErrorKind::InvalidData,
          format!(
            "Unimplemented block file version: 0x{BLOCK_VERSION3_0:X} (Current implementation is version 2.0 only)"
          ),
        ));
      }
      _ => {
        return Err(Error::new(
          ErrorKind::InvalidData,
          format!("Unsupported block file version: 0x{version:X} (Valid: 0x{BLOCK_VERSION2_0:X})"),
        ));
      }
    }

    let this_file = reader.read_i16()?;
    let next_file = reader.read_i16()?;
    let entry_size = reader.read_i32()?;
    let num_entries = reader.read_i32()?;
    let max_entries = reader.read_i32()?;
    let empty = reader.read_i32_into::<4>()?;
    let hints = reader.read_i32_into::<4>()?;
    let updating = reader.read_i32()?;
    let user = reader.read_i32_into::<5>()?;

    // HACK: Useless
    // allocation_map: [u32; BLOCK_MAX_BLOCKS / 32] -> = 4 * 2028 = 8112 Bytes
    reader.seek(SeekFrom::Current(4 * (BLOCK_MAX_BLOCKS / 32) as i64))?;

    // Block data
    let mut data = Vec::new();
    reader.read_to_end(&mut data)?;

    Ok(Self {
      header: BlockFileHeader {
        magic,
        version,
        this_file,
        next_file,
        entry_size,
        num_entries,
        max_entries,
        empty,
        hints,
        updating,
        user,
      },
      data,
    })
  }

  pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
    let file = File::open(path)?;
    Self::from_reader(file)
  }
}

impl BlockFile {
  pub fn read_data(&self, addr: Addr) -> Result<&[u8]> {
    if !addr.is_initialized() {
      return Err(Error::new(ErrorKind::InvalidInput, "Invalid address"));
    }

    if !addr.is_block_file() {
      return Err(Error::new(
        ErrorKind::InvalidInput,
        "Address is not block file",
      ));
    }

    if addr.file_number() != self.header.this_file as u32 {
      return Err(Error::new(
        ErrorKind::InvalidInput,
        format!(
          "File number of the address does not match the current block file. (Expected: {}, Actual: {})",
          self.header.this_file,
          addr.file_number()
        ),
      ));
    }

    let block_size = addr.block_size();
    let num_blocks = addr.num_blocks();
    let offset = (addr.start_block() * block_size) as usize;
    let length = (block_size * num_blocks) as usize;

    // HACK: Avoid index out-of-bounds caused by illegal address
    self.data.get(offset..offset + length).ok_or(Error::new(
      ErrorKind::InvalidInput,
      format!(
        "Illegal address: {addr:?}, Incorrect data offset and length: {}..{}",
        offset,
        offset + length
      ),
    ))
  }
}
