use std::fmt;
use std::ops;

const ADDR_INITIALIZED_MASK: u32 = 0x80000000;
const ADDR_FILE_TYPE_MASK: u32 = 0x70000000;
const ADDR_FILE_TYPE_OFFSET: u32 = 28;
const ADDR_NUM_BLOCKS_MASK: u32 = 0x03000000;
const ADDR_NUM_BLOCKS_OFFSET: u32 = 24;
const ADDR_FILE_SELECTOR_MASK: u32 = 0x00FF0000;
const ADDR_FILE_SELECTOR_OFFSET: u32 = 16;
const ADDR_START_BLOCK_MASK: u32 = 0x0000FFFF;
const ADDR_FILE_NAME_MASK: u32 = 0x0FFFFFFF;

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct Addr(pub u32);

impl Addr {
  pub const fn is_initialized(&self) -> bool {
    self.0 & ADDR_INITIALIZED_MASK != 0
  }

  pub const fn is_separate_file(&self) -> bool {
    self.0 & ADDR_FILE_TYPE_MASK == 0
  }

  pub const fn is_block_file(&self) -> bool {
    self.0 & ADDR_FILE_TYPE_MASK != 0
  }

  pub const fn file_type(&self) -> u32 {
    (self.0 & ADDR_FILE_TYPE_MASK) >> ADDR_FILE_TYPE_OFFSET
  }

  pub const fn file_number(&self) -> u32 {
    if self.is_separate_file() {
      self.0 & ADDR_FILE_NAME_MASK
    } else {
      (self.0 & ADDR_FILE_SELECTOR_MASK) >> ADDR_FILE_SELECTOR_OFFSET
    }
  }

  pub const fn block_size(&self) -> u32 {
    match self.file_type() {
      1 => 36,   // Rankings
      2 => 256,  // Block 256
      3 => 1024, // Block 1K
      4 => 4096, // Block 4K
      5 => 8,    // Block Files
      6 => 104,  // Block Entries
      7 => 48,   // Block Evicted
      _ => 0,    // Other is External. Always zero
    }
  }

  pub const fn start_block(&self) -> u32 {
    if self.is_separate_file() {
      0
    } else {
      self.0 & ADDR_START_BLOCK_MASK
    }
  }

  pub const fn num_blocks(&self) -> u32 {
    if self.is_separate_file() {
      0
    } else {
      ((self.0 & ADDR_NUM_BLOCKS_MASK) >> ADDR_NUM_BLOCKS_OFFSET) + 1
    }
  }
}

impl fmt::Debug for Addr {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "Addr[0x{:X}]", self.0)
  }
}

impl fmt::Display for Addr {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    write!(f, "{}", self.0)
  }
}

impl From<u32> for Addr {
  fn from(value: u32) -> Self {
    Self(value)
  }
}

impl ops::Deref for Addr {
  type Target = u32;

  fn deref(&self) -> &Self::Target {
    &self.0
  }
}
