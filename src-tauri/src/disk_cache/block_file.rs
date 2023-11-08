use super::CacheAddr;
use byteorder::{LittleEndian, ReadBytesExt};
use std::fs::File;
use std::io::{BufReader, Error, ErrorKind, Read, Result};
use std::path::Path;

#[allow(unused)]
const BLOCK_MAGIC: u32 = 0xC104CAC3;
#[allow(unused)]
const BLOCK_VERSION2_0: u32 = 0x20000;
#[allow(unused)]
const BLOCK_VERSION3_0: u32 = 0x30000;
const BLOCK_HEADER_SIZE: u32 = 8192;
const BLOCK_MAX_BLOCKS: u32 = (BLOCK_HEADER_SIZE - 80) * 8;

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
  pub allocation_map: [u32; BLOCK_MAX_BLOCKS as usize / 32],
}

pub struct BlockFile {
  pub header: BlockFileHeader,
  pub data: Vec<u8>,
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
    let mut allocation_map = [0; BLOCK_MAX_BLOCKS as usize / 32];
    reader.read_u32_into::<LittleEndian>(&mut allocation_map)?;

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
      allocation_map,
    })
  }
}

impl BlockFile {
  pub fn from_reader(mut reader: impl Read) -> Result<Self> {
    let header = BlockFileHeader::from_reader(&mut reader)?;
    let mut data = Vec::new();
    reader.read_to_end(&mut data)?;

    Ok(Self { header, data })
  }

  pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    Self::from_reader(reader)
  }

  pub fn read_data(&self, addr: &CacheAddr) -> Result<&[u8]> {
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
        format!("File number of the address does not match the current block file. (Expected: {}, Actual: {})", self.header.this_file, addr.file_number()),
      ));
    }

    let block_size = addr.block_size();
    let num_blocks = addr.num_blocks();
    let offset = (addr.start_block() * block_size) as usize;
    let length = (block_size * num_blocks) as usize;
    let data = &self.data[offset..(offset + length)];
    Ok(data)
  }
}
