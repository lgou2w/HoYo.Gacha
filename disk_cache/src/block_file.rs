extern crate byteorder;

use byteorder::{ReadBytesExt, LittleEndian};
use std::fs::File;
use std::io::{BufReader, Error, ErrorKind, Read, Result};
use std::path::Path;
use crate::addr::{
  CacheAddr,
  addr_block_size,
  addr_is_block_file,
  addr_is_initialized,
  addr_num_blocks,
  addr_start_block
};

/* Block File Constants */
pub const BLOCK_MAGIC: u32 = 0xC104CAC3;
pub const BLOCK_VERSION2_0: u32 = 0x20000;
// pub const BLOCK_VERSION3_0: u32 = 0x30000;
pub const BLOCK_HEADER_SIZE: u32 = 8192;
pub const BLOCK_MAX_BLOCKS: u32 = (BLOCK_HEADER_SIZE - 80) * 8;
pub const BLOCK_KEY_SIZE: u32 = 256 - 24 * 4;

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
  pub allocation_map: Box<[u32; BLOCK_MAX_BLOCKS as usize / 32]>
}

pub struct BlockFile {
  pub header: BlockFileHeader,
  pub data: Box<Vec<u8>>
}

impl BlockFileHeader {
  pub fn from_reader(mut reader: impl Read) -> Result<Self> {
    let magic = reader.read_u32::<LittleEndian>()?;
    let version = reader.read_u32::<LittleEndian>()?;
    let this_file = reader.read_i16::<LittleEndian>()?;
    let next_file = reader.read_i16::<LittleEndian>()?;
    let entry_size = reader.read_i32::<LittleEndian>()?;
    let num_entries = reader.read_i32::<LittleEndian>()?;
    let max_entries = reader.read_i32::<LittleEndian>()?;
    let mut empty = [0; 4];
    reader.read_i32_into::<LittleEndian>(&mut empty)?;
    let mut hints = [0; 4];
    reader.read_i32_into::<LittleEndian>(&mut hints)?;
    let updating = reader.read_i32::<LittleEndian>()?;
    let mut user = [0; 5];
    reader.read_i32_into::<LittleEndian>(&mut user)?;
    let mut allocation_map = Box::new([0; BLOCK_MAX_BLOCKS as usize / 32]);
    reader.read_u32_into::<LittleEndian>(&mut *allocation_map)?;

    Ok(Self {
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
      allocation_map
    })
  }
}

impl BlockFile {
  pub fn from_reader(mut reader: impl Read) -> Result<Self> {
    let header = BlockFileHeader::from_reader(&mut reader)?;
    let mut data = Box::new(Vec::new());
    reader.read_to_end(&mut *data)?;

    Ok(Self {
      header,
      data
    })
  }

  pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    Self::from_reader(reader)
  }

  pub fn read_data(&self, addr: CacheAddr) -> Result<&[u8]> {
    if !addr_is_initialized(addr) {
      return Err(Error::new(ErrorKind::InvalidInput, "Invalid address"))
    }

    if !addr_is_block_file(addr) {
      Err(Error::new(ErrorKind::InvalidInput, "Address is not block file"))
    } else {
      let block_size = addr_block_size(addr);
      let num_blocks = addr_num_blocks(addr);
      let offset = (addr_start_block(addr) * block_size) as usize;
      let length = (block_size * num_blocks) as usize;
      let data = &self.data[offset..(offset + length)];
      Ok(data)
    }
  }
}
