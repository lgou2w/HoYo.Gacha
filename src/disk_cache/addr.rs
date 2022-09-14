/* Cache Address */
pub const ADDR_INITIALIZED_MASK: u32 = 0x80000000;
pub const ADDR_FILE_TYPE_MASK: u32 = 0x70000000;
pub const ADDR_FILE_TYPE_OFFSET: u32 = 28;
pub const ADDR_NUM_BLOCKS_MASK: u32 = 0x03000000;
pub const ADDR_NUM_BLOCKS_OFFSET: u32 = 24;
pub const ADDR_FILE_SELECTOR_MASK: u32 = 0x00FF0000;
pub const ADDR_FILE_SELECTOR_OFFSET: u32 = 16;
pub const ADDR_START_BLOCK_MASK: u32 = 0x0000FFFF;
pub const ADDR_FILE_NAME_MASK: u32 = 0x0FFFFFFF;

pub type CacheAddr = u32;

#[inline(always)]
pub fn addr_is_initialized(addr: CacheAddr) -> bool {
  (addr & ADDR_INITIALIZED_MASK) != 0
}

#[inline(always)]
pub fn addr_is_separate_file(addr: CacheAddr) -> bool {
  (addr & ADDR_FILE_TYPE_MASK) == 0
}

#[inline(always)]
pub fn addr_is_block_file(addr: CacheAddr) -> bool {
  (addr & ADDR_FILE_TYPE_MASK) != 0
}

#[inline(always)]
pub fn addr_file_type(addr: CacheAddr) -> u32 {
  (addr & ADDR_FILE_TYPE_MASK) >> ADDR_FILE_TYPE_OFFSET
}

#[inline(always)]
pub fn addr_file_number(addr: CacheAddr) -> u32 {
  if addr_is_separate_file(addr) {
    addr & ADDR_FILE_NAME_MASK
  } else {
    (addr & ADDR_FILE_SELECTOR_MASK) >> ADDR_FILE_SELECTOR_OFFSET
  }
}

#[inline(always)]
pub fn addr_block_size(addr: CacheAddr) -> u32 {
  match addr_file_type(addr) {
    1 => 36,   // Rankings
    2 => 256,  // Block 256
    3 => 1024, // Block 1K
    4 => 4096, // Block 4K
    5 => 8,    // Block Files
    6 => 104,  // Block Entries
    7 => 48,   // Block Evicted
    _ => 0     // External
  }
}

#[inline(always)]
pub fn addr_start_block(addr: CacheAddr) -> u32 {
  if addr_is_separate_file(addr) {
    0
  } else {
    addr & ADDR_START_BLOCK_MASK
  }
}


#[inline(always)]
pub fn addr_num_blocks(addr: CacheAddr) -> u32 {
  if addr_is_separate_file(addr) {
    0
  } else {
    ((addr & ADDR_NUM_BLOCKS_MASK) >> ADDR_NUM_BLOCKS_OFFSET) + 1
  }
}
