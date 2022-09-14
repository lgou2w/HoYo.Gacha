use std::path::PathBuf;
use crate::disk_cache::addr::CacheAddr;

/* Currently only 2.0, 2.1 versions are supported */

pub const INDEX_MAGIC: u32 = 0xC103CAC3;
pub const INDEX_VERSION2_0: u32 = 0x20000;
pub const INDEX_VERSION2_1: u32 = 0x20001;
// pub const INDEX_VERSION3_0: u32 = 0x30000;
pub const INDEX_TABLE_SIZE: u32 = 0x10000;

pub const BLOCK_MAGIC: u32 = 0xC104CAC3;
pub const BLOCK_VERSION2_0: u32 = 0x20000;
// pub const BLOCK_VERSION3_0: u32 = 0x30000;
pub const BLOCK_HEADER_SIZE: u32 = 8192;
pub const BLOCK_MAX_BLOCKS: u32 = (BLOCK_HEADER_SIZE - 80) * 8;
pub const BLOCK_KEY_SIZE: u32 = 256 - 24 * 4;

pub struct LruData {
  pub pad1: [i32; 2],
  pub filled: i32,
  pub sizes: [i32; 5],
  pub heads: [CacheAddr; 5],
  pub tails: [CacheAddr; 5],
  pub transaction: CacheAddr,
  pub operation: i32,
  pub operation_list: i32,
  pub pad2: [i32; 7]
}

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
  pub pad: Box<[i32; 52]>,
  pub lru: LruData
}

pub struct IndexFile {
  pub header: IndexFileHeader,
  pub table: Box<Vec<CacheAddr>>
}

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

pub struct DiskCache {
  pub cache_dir: PathBuf,
  pub index_file: IndexFile,
  pub block_files: [BlockFile; 4]
}
