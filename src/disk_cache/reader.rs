extern crate byteorder;

use std::fs::{File, metadata};
use std::io::{BufReader, Error, ErrorKind, Read, Result};
use std::path::Path;
use byteorder::{ReadBytesExt, LittleEndian};
use crate::disk_cache::addr::{CacheAddr, addr_is_initialized};
use crate::disk_cache::structs::*;

pub trait FromReader<T> {
  fn from_reader(reader: impl Read) -> Result<T>;
}

pub trait FromFile<T> {
  fn from_file<P: AsRef<Path>>(path: P) -> Result<T>;
}

impl FromReader<Self> for LruData {
  fn from_reader(mut reader: impl Read) -> Result<Self> {
    let mut pad1 = [0; 2];
    reader.read_i32_into::<LittleEndian>(&mut pad1)?;
    let filled = reader.read_i32::<LittleEndian>()?;
    let mut sizes = [0; 5];
    reader.read_i32_into::<LittleEndian>(&mut sizes)?;
    let mut heads: [CacheAddr; 5] = [0; 5];
    reader.read_u32_into::<LittleEndian>(&mut heads)?;
    let mut tails: [CacheAddr; 5] = [0; 5];
    reader.read_u32_into::<LittleEndian>(&mut tails)?;
    let transaction = reader.read_u32::<LittleEndian>()?;
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

impl FromReader<Self> for IndexFileHeader {
  fn from_reader(mut reader: impl Read) -> Result<Self> {
    let magic = reader.read_u32::<LittleEndian>()?;
    let version = reader.read_u32::<LittleEndian>()?;
    let num_entries = reader.read_i32::<LittleEndian>()?;
    let num_bytes = reader.read_i32::<LittleEndian>()?;
    let last_file = reader.read_i32::<LittleEndian>()?;
    let this_id = reader.read_i32::<LittleEndian>()?;
    let stats = reader.read_u32::<LittleEndian>()?;
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

impl FromReader<Self> for IndexFile {
  fn from_reader(mut reader: impl Read) -> Result<Self> {
    let header = IndexFileHeader::from_reader(&mut reader)?;
    let mut table = Box::new(Vec::new());
    for _i in 0 .. header.table_len {
      let addr = reader.read_u32::<LittleEndian>()?;
      if addr_is_initialized(addr) {
        table.push(addr);
      }
    }

    Ok(Self {
      header,
      table
    })
  }
}

impl FromFile<Self> for IndexFile {
  fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    Self::from_reader(reader)
  }
}

impl FromReader<Self> for BlockFileHeader {
  fn from_reader(mut reader: impl Read) -> Result<Self> {
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

impl FromReader<Self> for BlockFile {
  fn from_reader(mut reader: impl Read) -> Result<Self> {
    let header = BlockFileHeader::from_reader(&mut reader)?;
    let mut data = Box::new(Vec::new());
    reader.read_to_end(&mut *data)?;

    Ok(Self {
      header,
      data
    })
  }
}

impl FromFile<Self> for BlockFile {
  fn from_file<P: AsRef<Path>>(path: P) -> Result<Self> {
    let file = File::open(path)?;
    let reader = BufReader::new(file);
    Self::from_reader(reader)
  }
}

impl FromReader<Self> for EntryStore {
  fn from_reader(mut reader: impl Read) -> Result<Self> {
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
}

impl DiskCache {
  pub fn from_dir<P : AsRef<Path>>(path: P) -> Result<Self> {
    let cache_dir = path.as_ref().to_path_buf();
    let cache_md = metadata(&cache_dir)?;
    if !cache_md.is_dir() {
      Err(Error::new(ErrorKind::InvalidInput, "Expected path is a directory"))
    } else {
      let index_file = IndexFile::from_file(cache_dir.join("index"))?;
      let block_file0 = BlockFile::from_file(cache_dir.join("data_0"))?;
      let block_file1 = BlockFile::from_file(cache_dir.join("data_1"))?;
      let block_file2 = BlockFile::from_file(cache_dir.join("data_2"))?;
      let block_file3 = BlockFile::from_file(cache_dir.join("data_3"))?;
      let block_files = [block_file0, block_file1, block_file2, block_file3];

      Ok(Self {
        cache_dir,
        index_file,
        block_files
      })
    }
  }

  pub fn from_dir_str(path: &str) -> Result<Self> {
    let path = Path::new(path);
    Self::from_dir(path)
  }
}
