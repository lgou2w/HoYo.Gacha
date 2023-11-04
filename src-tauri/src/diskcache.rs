use std::borrow::Cow;
use std::collections::HashMap;
use std::fmt::{Debug, Formatter};
use std::io::{Error, ErrorKind, Read, Result, Seek, SeekFrom};

use once_cell::sync::Lazy;
use paste::paste;

// Google Chromium Disk Cache
//   Endianness: Little-Endian
//   References:
//     https://www.chromium.org/developers/design-documents/network-stack/disk-cache/
//     https://www.chromium.org/developers/design-documents/network-stack/disk-cache/disk-cache-v3
//     https://github.com/chromium/chromium/blob/main/net/disk_cache/blockfile/disk_format_base.h
//     https://github.com/chromium/chromium/blob/main/net/disk_cache/blockfile/disk_format.h
//
//   Outdated: (Not recommended, contains incorrect)
//     https://github.com/libyal/dtformats/blob/main/documentation/Chrome%20Cache%20file%20format.asciidoc

// !
// This implementation is Disk Cache Version 2, not 3.
// Because 'Genshin Impact' and 'Honkai: Star Rail' are both version 2.

// =============
// Cache Address
// =============

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

#[derive(Clone, PartialEq, Eq)]
pub struct CacheAddr(u32);

impl CacheAddr {
  pub fn is_initialized(&self) -> bool {
    self.0 & ADDR_INITIALIZED_MASK != 0
  }

  pub fn is_separate_file(&self) -> bool {
    self.0 & ADDR_FILE_TYPE_MASK == 0
  }

  pub fn is_block_file(&self) -> bool {
    self.0 & ADDR_FILE_TYPE_MASK != 0
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
    *FILE_BLOCK_SIZE_MAPPINGS
      .get(&self.file_type())
      .unwrap_or(&0) // Other is External. Always zero
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

impl From<u32> for CacheAddr {
  fn from(value: u32) -> Self {
    Self(value)
  }
}

impl Debug for CacheAddr {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    f.write_fmt(format_args!("0x{:X?}", self.0))
  }
}

// ==========
// Buf Reader
// ==========

macro_rules! impl_int {
  ($($num:ty),*) => {
    paste! {
      $(
        fn [<read_ $num>](&mut self) -> Result<$num> {
          const SIZE: usize = std::mem::size_of::<$num>();

          let bytes = self.read_u8_arr::<SIZE>()?;
          Ok($num::from_le_bytes(bytes)) // Little-Endian
        }

        fn [<read_ $num _into>]<const LENGTH: usize>(&mut self) -> Result<[$num; LENGTH]> {
          let mut dst: [$num; LENGTH] = [$num::default(); LENGTH];
          {
            let buf = unsafe { slice_to_u8_mut(&mut dst) };
            self.read_exact(buf)?;
          }

          if cfg!(targe_endian = "big") {
            for n in &mut dst {
              *n = <$num>::to_le(*n); // Little-Endian
            }
          }

          Ok(dst)
        }
      )*
    }
  };
}

//
// This function is categorized as a Copyright MIT https://github.com/BurntSushi/byteorder
// Source code:
//   https://github.com/BurntSushi/byteorder/blob/2e17045ca2580719b2df78973901b56eb8a86f49/src/io.rs#L1581-L1592
//
/// Convert a slice of T (where T is plain old data) to its mutable binary
/// representation.
///
/// This function is wildly unsafe because it permits arbitrary modification of
/// the binary representation of any `Copy` type. Use with care. It's intended
/// to be called only where `T` is a numeric type.
unsafe fn slice_to_u8_mut<T: Copy>(slice: &mut [T]) -> &mut [u8] {
  use core::slice::from_raw_parts_mut;
  use std::mem::size_of_val;

  let len = size_of_val(slice) * slice.len();
  from_raw_parts_mut(slice.as_mut_ptr() as *mut u8, len)
}

// Don't export
/* pub */
trait DiskCacheRead: Read {
  fn read_u8_arr<const LENGTH: usize>(&mut self) -> Result<[u8; LENGTH]> {
    let mut buf = [0; LENGTH];
    self.read_exact(&mut buf)?;
    Ok(buf)
  }

  fn read_u8_vec(&mut self, length: usize) -> Result<Vec<u8>> {
    let mut vec = vec![0; length];
    self.read_exact(&mut vec)?;
    Ok(vec)
  }

  impl_int!(u8, u16, u32, u64, i8, i16, i32, i64);

  fn read_cache_addr(&mut self) -> Result<CacheAddr> {
    let addr = self.read_u32()?;
    Ok(CacheAddr::from(addr))
  }

  fn read_cache_addrs<const LENGTH: usize>(&mut self) -> Result<[CacheAddr; LENGTH]> {
    let addrs = self.read_u32_into::<LENGTH>()?;
    Ok(addrs.map(CacheAddr::from))
  }
}

// DiskCacheRead -> Read
impl<R: Read + ?Sized> DiskCacheRead for R {}

// ==========
// Index File
// ==========

const INDEX_MAGIC: u32 = 0xC103CAC3;
const INDEX_VERSION2_0: u32 = 0x20000;
const INDEX_VERSION2_1: u32 = 0x20001;
const INDEX_VERSION3_0: u32 = 0x30000;
const INDEX_TABLE_SIZE: u32 = 0x10000;

#[derive(Debug)]
pub struct IndexFileHeader {
  pub magic: u32,
  pub version: u32,
  pub num_entries: i32,
  pub num_bytes: i32,
  pub last_file: i32,
  pub this_id: i32,
  pub stats: CacheAddr,
  pub table_len: i32,
  pub crash: i32,
  pub experiment: i32,
  pub create_time: u64,
  // HACK: Useless. See below
  // pub pad: [u32; 52],
  // pub lru: Lru,
}

#[derive(Debug)]
pub struct IndexFile {
  pub header: IndexFileHeader,
  pub table: Vec<CacheAddr>,
}

impl IndexFile {
  pub fn from_reader(mut reader: impl Read + Seek) -> Result<Self> {
    let magic = reader.read_u32()?;
    assert_eq!(magic, INDEX_MAGIC); // FIXME: unsafe

    let version = reader.read_u32()?;
    let num_entries = reader.read_i32()?;
    let num_bytes = reader.read_i32()?;
    let last_file = reader.read_i32()?;
    let this_id = reader.read_i32()?;
    let stats = reader.read_cache_addr()?;
    let table_len = reader.read_i32()?;
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
      let addr = reader.read_cache_addr()?;
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
}

// ==========
// Block File
// ==========

const BLOCK_MAGIC: u32 = 0xC104CAC3;
const BLOCK_VERSION2_0: u32 = 0x20000;
const BLOCK_VERSION3_0: u32 = 0x30000;
const BLOCK_HEADER_SIZE: u32 = 8192;
const BLOCK_MAX_BLOCKS: u32 = (BLOCK_HEADER_SIZE - 80) * 8;

#[derive(Debug)]
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

pub struct BlockFile {
  pub header: BlockFileHeader,
  pub data: Vec<u8>,
}

impl Debug for BlockFile {
  fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
    f.debug_struct("BlockFile")
      .field("header", &self.header)
      .field("data", &format_args!("[..{} Bytes]", self.data.len()))
      .finish()
  }
}

impl BlockFile {
  pub fn from_reader(mut reader: impl Read + Seek) -> Result<Self> {
    let magic = reader.read_u32()?;
    assert_eq!(magic, BLOCK_MAGIC); // FIXME: unsafe

    let version = reader.read_u32()?;
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

    // FIXME: index out bounds. If the address is unsafe
    let data = &self.data[offset..offset + length];
    Ok(data)
  }
}

// ===========
// Entry Store
// ===========

const BLOCK_KEY_SIZE: usize = 256 - 24 * 4;

#[derive(Debug)]
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
  pub key: [u8; BLOCK_KEY_SIZE],
}

impl EntryStore {
  pub fn from_reader(mut reader: impl Read) -> Result<Self> {
    let hash = reader.read_u32()?;
    let next = reader.read_cache_addr()?;
    let rankings_node = reader.read_cache_addr()?;
    let reuse_count = reader.read_i32()?;
    let refetch_count = reader.read_i32()?;
    let state = reader.read_i32()?;
    let creation_time = reader.read_u64()?;
    let key_len = reader.read_i32()?;
    let long_key = reader.read_cache_addr()?;
    let data_size = reader.read_cache_addrs::<4>()?;
    let data_addr = reader.read_cache_addrs::<4>()?;
    let flags = reader.read_u32()?;
    let pad = reader.read_i32_into::<4>()?;
    let self_hash = reader.read_u32()?;
    let key = reader.read_u8_arr::<BLOCK_KEY_SIZE>()?;

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

  pub fn from_block_file(block_file: &BlockFile, addr: &CacheAddr) -> Result<Self> {
    let data = block_file.read_data(addr)?;
    let entry = Self::from_reader(data)?;
    Ok(entry)
  }

  pub fn is_long_key(&self) -> bool {
    self.long_key.is_initialized()
  }

  pub fn read_key(&self) -> Result<Cow<'_, str>> {
    if self.is_long_key() {
      return Err(Error::new(
        ErrorKind::Unsupported,
        format!(
          "Entry store is a long key. Require other block file data: {:?}",
          self.long_key
        ),
      ));
    }

    if self.key_len <= BLOCK_KEY_SIZE as i32 {
      let data = &self.key[0..self.key_len as usize];
      Ok(String::from_utf8_lossy(data))
    } else {
      Ok(String::from_utf8_lossy(&self.key))
    }
  }

  pub fn read_long_key<'a>(&self, block_file: &'a BlockFile) -> Result<Cow<'a, str>> {
    if !self.is_long_key() {
      return Err(Error::new(
        ErrorKind::Unsupported,
        "Entry store is a short key",
      ));
    }

    let long_key_data = block_file.read_data(&self.long_key)?;
    let data = &long_key_data[0..self.key_len as usize];
    Ok(String::from_utf8_lossy(data))
  }
}

#[cfg(test)]
mod tests {
  use std::fs::File;
  use std::io::Result;
  use std::path::PathBuf;

  use crate::diskcache::{
    BlockFile, IndexFile, BLOCK_MAGIC, BLOCK_VERSION2_0, INDEX_MAGIC, INDEX_VERSION2_1,
  };

  // HACK: Hard-coded unit test
  #[ignore = "Because the path is hard-coded, it is for manual testing only"]
  #[test]
  fn test_local() -> Result<()> {
    const DIR: &str = r"D:\miHoYo\Star Rail\Game\StarRail_Data\webCaches\2.17.0.0\Cache\Cache_Data";

    let cache_data_dir = PathBuf::from(DIR);
    let index_file = cache_data_dir.join("index");
    let block_file1 = cache_data_dir.join("data_1");
    let block_file2 = cache_data_dir.join("data_2");

    let index_file = IndexFile::from_reader(File::open(index_file)?)?;
    let block_file1 = BlockFile::from_reader(File::open(block_file1)?)?;
    let block_file2 = BlockFile::from_reader(File::open(block_file2)?)?;

    assert_eq!(index_file.header.magic, INDEX_MAGIC); // Index magic
    assert_eq!(index_file.header.version, INDEX_VERSION2_1); // Index version 2.1

    assert_eq!(block_file1.header.magic, BLOCK_MAGIC); // Block magic
    assert_eq!(block_file1.header.version, BLOCK_VERSION2_0); // Block version 2.0
    assert_eq!(block_file1.header.this_file, 1); // data_1
    assert_eq!(block_file1.header.entry_size, 256); // Block 256

    assert_eq!(block_file2.header.magic, BLOCK_MAGIC); // Block magic
    assert_eq!(block_file2.header.version, BLOCK_VERSION2_0); // Block version 2.0
    assert_eq!(block_file2.header.this_file, 2); // data_2
    assert_eq!(block_file2.header.entry_size, 1024); // Block 1K

    Ok(())
  }
}
