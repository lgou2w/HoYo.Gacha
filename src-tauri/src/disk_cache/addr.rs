use byteorder::{ByteOrder, ReadBytesExt};
use once_cell::sync::Lazy;
use serde::ser::{Serialize, Serializer};
use std::cmp::Ordering;
use std::collections::HashMap;
use std::io::{Read, Result};

const ADDR_INITIALIZED_MASK: u32 = 0x80000000;
const ADDR_FILE_TYPE_MASK: u32 = 0x70000000;
const ADDR_FILE_TYPE_OFFSET: u32 = 28;
const ADDR_NUM_BLOCKS_MASK: u32 = 0x03000000;
const ADDR_NUM_BLOCKS_OFFSET: u32 = 24;
const ADDR_FILE_SELECTOR_MASK: u32 = 0x00FF0000;
const ADDR_FILE_SELECTOR_OFFSET: u32 = 16;
const ADDR_START_BLOCK_MASK: u32 = 0x0000FFFF;
const ADDR_FILE_NAME_MASK: u32 = 0x0FFFFFFF;

static FILE_BLOCK_SIZE_MAPPINGS: Lazy<HashMap<u32, u32>> = Lazy::new(|| {
  let mut m = HashMap::new();
  m.insert(1, 36); // Rankings
  m.insert(2, 256); // Block 256
  m.insert(3, 1024); // Block 1K
  m.insert(4, 4096); // Block 4K
  m.insert(5, 8); // Block Files
  m.insert(6, 104); // Block Entries
  m.insert(7, 48); // Block Evicted
  m
});

#[derive(Debug, Clone)]
pub struct CacheAddr(u32);

impl CacheAddr {
  pub fn is_initialized(&self) -> bool {
    (self.0 & ADDR_INITIALIZED_MASK) != 0
  }

  pub fn is_separate_file(&self) -> bool {
    (self.0 & ADDR_FILE_TYPE_MASK) == 0
  }

  pub fn is_block_file(&self) -> bool {
    (self.0 & ADDR_FILE_TYPE_MASK) != 0
  }

  pub fn file_type(&self) -> u32 {
    (self.0 & ADDR_FILE_TYPE_MASK) >> ADDR_FILE_TYPE_OFFSET
  }

  pub fn file_number(&self) -> u32 {
    if self.is_separate_file() {
      self.0 & ADDR_FILE_NAME_MASK
    } else {
      (self.0 & ADDR_FILE_SELECTOR_MASK) >> ADDR_FILE_SELECTOR_OFFSET
    }
  }

  pub fn block_size(&self) -> u32 {
    let file_type = self.file_type();
    *FILE_BLOCK_SIZE_MAPPINGS.get(&file_type).unwrap_or(&0) // Other is External. Always zero
  }

  pub fn start_block(&self) -> u32 {
    if self.is_separate_file() {
      0
    } else {
      self.0 & ADDR_START_BLOCK_MASK
    }
  }

  pub fn num_blocks(&self) -> u32 {
    if self.is_separate_file() {
      0
    } else {
      ((self.0 & ADDR_NUM_BLOCKS_MASK) >> ADDR_NUM_BLOCKS_OFFSET) + 1
    }
  }
}

impl PartialEq for CacheAddr {
  fn eq(&self, other: &Self) -> bool {
    self.0 == other.0
  }
}

impl PartialOrd for CacheAddr {
  fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
    self.0.partial_cmp(&other.0)
  }
}

impl From<CacheAddr> for u32 {
  fn from(val: CacheAddr) -> Self {
    val.0
  }
}

pub trait ReadCacheAddrExt: Read {
  #[inline]
  fn read_cache_addr<T: ByteOrder>(&mut self) -> Result<CacheAddr> {
    let addr = self.read_u32::<T>()?;
    Ok(CacheAddr(addr))
  }

  #[inline]
  fn read_cache_addrs<T: ByteOrder, const LENGTH: usize>(&mut self) -> Result<[CacheAddr; LENGTH]> {
    let mut addrs = [0u32; LENGTH];
    self.read_u32_into::<T>(&mut addrs)?;
    Ok(addrs.map(CacheAddr))
  }
}

impl<R: Read + ?Sized> ReadCacheAddrExt for R {}

impl Serialize for CacheAddr {
  fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    serializer.serialize_u32(self.0)
  }
}
