use std::borrow::Cow;
use std::io::{Error, ErrorKind, Read, Result};

use crate::reader::DiskCacheRead;
use crate::{Addr, BlockFile};

pub const BLOCK_KEY_SIZE: usize = 256 - 24 * 4;

#[derive(Debug)]
pub struct EntryStore {
  pub hash: u32,
  pub next: Addr,
  pub rankings_node: Addr,
  pub reuse_count: i32,
  pub refetch_count: i32,
  pub state: i32,
  pub creation_time: u64,
  pub key_len: i32,
  pub long_key: Addr,
  pub data_size: [Addr; 4],
  pub data_addr: [Addr; 4],
  pub flags: u32,
  pub pad: [i32; 4],
  pub self_hash: u32,
  pub key: [u8; BLOCK_KEY_SIZE],
}

impl EntryStore {
  pub fn from_reader<R: Read>(mut reader: R) -> Result<Self> {
    let hash = reader.read_u32()?;
    let next = reader.read_addr()?;
    let rankings_node = reader.read_addr()?;
    let reuse_count = reader.read_i32()?;
    let refetch_count = reader.read_i32()?;
    let state = reader.read_i32()?;
    let creation_time = reader.read_u64()?;
    let key_len = reader.read_i32()?;
    let long_key = reader.read_addr()?;
    let data_size = reader.read_addr_into::<4>()?;
    let data_addr = reader.read_addr_into::<4>()?;
    let flags = reader.read_u32()?;
    let pad = reader.read_i32_into::<4>()?;
    let self_hash = reader.read_u32()?;
    let key = reader.read_u8_slice::<BLOCK_KEY_SIZE>()?;

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
      key,
    })
  }
}

impl EntryStore {
  pub const fn has_long_key(&self) -> bool {
    self.long_key.is_initialized()
  }

  pub fn read_key(&self) -> Result<Cow<'_, str>> {
    if self.has_long_key() {
      return Err(Error::new(
        ErrorKind::Unsupported,
        format!(
          "Entry store has a long key. Require other block file data: {:?}",
          self.long_key
        ),
      ));
    }

    if self.key_len <= BLOCK_KEY_SIZE as i32 {
      let data = &self.key[..self.key_len as usize];
      Ok(String::from_utf8_lossy(data))
    } else {
      Ok(String::from_utf8_lossy(&self.key))
    }
  }

  pub fn read_long_key<'a>(&self, block_file: &'a BlockFile) -> Result<Cow<'a, str>> {
    if !self.has_long_key() {
      return Err(Error::new(
        ErrorKind::AddrNotAvailable,
        "Entry store does not have a long key",
      ));
    }

    let long_key_data = block_file.read_data(self.long_key)?;
    let data = &long_key_data[..self.key_len as usize];
    Ok(String::from_utf8_lossy(data))
  }
}
