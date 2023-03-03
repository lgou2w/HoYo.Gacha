extern crate byteorder;

use byteorder::{ReadBytesExt, LittleEndian};
use std::fs::File;
use std::io::{BufReader, Read, Result};
use std::path::Path;
use super::{CacheAddr, ReadCacheAddrExt};

#[allow(unused)] const INDEX_MAGIC     : u32 = 0xC103CAC3;
#[allow(unused)] const INDEX_VERSION2_0: u32 =    0x20000;
#[allow(unused)] const INDEX_VERSION2_1: u32 =    0x20001;
#[allow(unused)] const INDEX_VERSION3_0: u32 =    0x30000;
#[allow(unused)] const INDEX_TABLE_SIZE: u32 =    0x10000;

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
  pub table: Vec<CacheAddr>
}

impl LruData {
  pub fn from_reader(mut reader: impl Read) -> Result<Self> {
    let mut pad1 = [0; 2];
    reader.read_i32_into::<LittleEndian>(&mut pad1)?;
    let filled = reader.read_i32::<LittleEndian>()?;
    let mut sizes = [0; 5];
    reader.read_i32_into::<LittleEndian>(&mut sizes)?;
    let heads = reader.read_cache_addrs::<LittleEndian, 5>()?;
    let tails = reader.read_cache_addrs::<LittleEndian, 5>()?;
    let transaction = reader.read_cache_addr::<LittleEndian>()?;
    let operation = reader.read_i32::<LittleEndian>()?;
    let operation_list = reader.read_i32::<LittleEndian>()?;
    let mut pad2 = [0; 7];
    reader.read_i32_into::<LittleEndian>(&mut pad2)?;

    Ok(Self {
      pad1,
      filled,
      sizes,
      heads,
      tails,
      transaction,
      operation,
      operation_list,
      pad2
    })
  }
}

impl IndexFileHeader {
  pub fn from_reader(mut reader: impl Read) -> Result<Self> {
    let magic = reader.read_u32::<LittleEndian>()?;
    let version = reader.read_u32::<LittleEndian>()?;
    let num_entries = reader.read_i32::<LittleEndian>()?;
    let num_bytes = reader.read_i32::<LittleEndian>()?;
    let last_file = reader.read_i32::<LittleEndian>()?;
    let this_id = reader.read_i32::<LittleEndian>()?;
    let stats = reader.read_cache_addr::<LittleEndian>()?;
    let table_len = reader.read_i32::<LittleEndian>()?;
    let crash = reader.read_i32::<LittleEndian>()?;
    let experiment = reader.read_i32::<LittleEndian>()?;
    let create_time = reader.read_u64::<LittleEndian>()?;
    let mut pad = Box::new([0; 52]);
    reader.read_i32_into::<LittleEndian>(&mut *pad)?;
    let lru = LruData::from_reader(reader)?;

    Ok(Self {
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
      pad,
      lru
    })
  }
}

impl IndexFile {
  pub fn from_reader(mut reader: impl Read) -> Result<Self> {
    let header = IndexFileHeader::from_reader(&mut reader)?;
    let mut table = Vec::new();
    for _i in 0..header.table_len {
      let addr = reader.read_cache_addr::<LittleEndian>()?;
      if addr.is_initialized() {
        table.push(addr);
      }
    }

    Ok(Self {
      header,
      table
    })
  }

  pub fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    Self::from_reader(reader)
  }
}
