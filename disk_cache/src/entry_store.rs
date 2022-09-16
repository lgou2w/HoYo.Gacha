extern crate byteorder;

use byteorder::{ReadBytesExt, LittleEndian};
use std::io::{Error, ErrorKind, Read, Result};
use crate::addr::CacheAddr;
use crate::block_file::{BLOCK_KEY_SIZE, BlockFile};

pub struct EntryStore {
  pub hash: u32,
  pub next: CacheAddr,
  pub rankings_node: CacheAddr,
  pub reuse_count: i32,
  pub refetch_count: i32,
  pub state: i32,
  pub creation_time: u64,
  pub key_len: i32,
  pub long_key: CacheAddr,
  pub data_size: [CacheAddr; 4],
  pub data_addr: [CacheAddr; 4],
  pub flags: u32,
  pub pad: [i32; 4],
  pub self_hash: u32,
  pub key: Box<[u8; BLOCK_KEY_SIZE as usize]>
}

impl EntryStore {
  pub fn from_reader(mut reader: impl Read) -> Result<Self> {
    let hash = reader.read_u32::<LittleEndian>()?;
    let next = reader.read_u32::<LittleEndian>()?;
    let rankings_node = reader.read_u32::<LittleEndian>()?;
    let reuse_count = reader.read_i32::<LittleEndian>()?;
    let refetch_count = reader.read_i32::<LittleEndian>()?;
    let state = reader.read_i32::<LittleEndian>()?;
    let creation_time = reader.read_u64::<LittleEndian>()?;
    let key_len = reader.read_i32::<LittleEndian>()?;
    let long_key = reader.read_u32::<LittleEndian>()?;
    let mut data_size: [CacheAddr; 4] = [0; 4];
    reader.read_u32_into::<LittleEndian>(&mut data_size)?;
    let mut data_addr: [CacheAddr; 4] = [0; 4];
    reader.read_u32_into::<LittleEndian>(&mut data_addr)?;
    let flags = reader.read_u32::<LittleEndian>()?;
    let mut pad = [0; 4];
    reader.read_i32_into::<LittleEndian>(&mut pad)?;
    let self_hash = reader.read_u32::<LittleEndian>()?;
    let mut key = Box::new([0; BLOCK_KEY_SIZE as usize]);
    reader.read(&mut *key)?;

    Ok(Self {
      hash,
      next,
      rankings_node,
      reuse_count,
      refetch_count,
      state,
      creation_time,
      key_len,
      long_key,
      data_size,
      data_addr,
      flags,
      pad,
      self_hash,
      key
    })
  }

  pub fn from_block_file(block_file: &BlockFile, addr: CacheAddr) -> Result<Self> {
    if block_file.header.this_file != 1 {
      Err(Error::new(
        ErrorKind::InvalidData,
        format!(
          "Entry store is only in data_1 block file. (Current file: {}, Expected: 1)",
          block_file.header.this_file
        )
      ))
    } else {
      let data = block_file.read_data(addr)?;
      let entry = Self::from_reader(data)?;
      Ok(entry)
    }
  }

  pub fn is_long_url(&self) -> bool {
    self.long_key != 0
  }

  pub fn get_url(&self) -> Result<String> {
    if self.is_long_url() {
      return Err(Error::new(
        ErrorKind::Unsupported,
        format!("Entry store is a long key. Require other block file data: {}", self.long_key)
      ))
    }

    if self.key_len <= BLOCK_KEY_SIZE as i32 {
      let data = &self.key[0..self.key_len as usize];
      Ok(String::from_utf8_lossy(data).to_string())
    } else {
      Ok(String::from_utf8_lossy(&*self.key).to_string())
    }
  }

  pub fn get_long_url(&self, block_file: &BlockFile) -> Result<String> {
    if !self.is_long_url() {
      return Err(Error::new(ErrorKind::Unsupported, "Entry store is a short key"))
    }

    if block_file.header.this_file != 2 {
      Err(Error::new(
        ErrorKind::InvalidData,
        format!(
          "Long key is only in data_2 block file. (Current file: {}, Expected: 2)",
          block_file.header.this_file
        )
      ))
    } else {
      let long_key_data = block_file.read_data(self.long_key)?;
      let data = &long_key_data[0..self.key_len as usize];
      Ok(String::from_utf8_lossy(data).to_string())
    }
  }
}
