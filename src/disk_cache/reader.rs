extern crate byteorder;
extern crate chrono;

use std::fs::{File, metadata};
use std::io::{BufReader, Error, ErrorKind, Read, Result};
use std::path::Path;
use byteorder::{ReadBytesExt, LittleEndian};
use crate::disk_cache::addr::*;
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

fn windows_ticks_to_unix_timestamps(ticks: u64) -> (i64, u32) {
  let seconds = ticks / 10_000_000 - 11_644_473_600;
  let nano_seconds = ticks % 10_000_000;
  (seconds as i64, nano_seconds as u32)
}

impl EntryStore {
  pub fn get_creation_time_as_utc(&self) -> chrono::DateTime<chrono::Utc> {
    let creation_time = self.creation_time;
    let (seconds, nano_seconds) = windows_ticks_to_unix_timestamps(
      // The creation time of the entry store must be multiplied by 10 for correct windows ticks
      creation_time * 10
    );
    chrono::NaiveDateTime
      ::from_timestamp(seconds, nano_seconds)
      .and_local_timezone(chrono::Utc)
      .unwrap()
  }
}

impl DiskCache {
  pub fn from_dir<P : AsRef<Path>>(path: P) -> Result<Self> {
    let cache_dir = path.as_ref().to_path_buf();
    let cache_dir_md = metadata(&cache_dir)?;
    if !cache_dir_md.is_dir() {
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

  fn read_data(&self, addr: CacheAddr) -> Result<&[u8]> {
    if !addr_is_initialized(addr) {
      return Err(Error::new(ErrorKind::InvalidInput, "Invalid address"))
    }
    if addr_is_separate_file(addr) {
      // TODO: Read separate file data
      return Err(Error::new(ErrorKind::Unsupported, "Separate file not implemented"))
    }
    // Always a block file
    assert_eq!(addr_is_block_file(addr), true);
    let file_number = addr_file_number(addr);
    let block_size = addr_block_size(addr);
    let num_blocks = addr_num_blocks(addr);
    let offset = (addr_start_block(addr) * block_size) as usize;
    let length = (block_size * num_blocks) as usize;
    let data = &self.block_files[file_number as usize].data[offset .. (offset + length)];
    Ok(data)
  }

  pub fn read_entry(&self, addr: CacheAddr) -> Result<EntryStore> {
    let data = self.read_data(addr)?;
    let entry = EntryStore::from_reader(data)?;
    Ok(entry)
  }

  pub fn read_entry_key_as_url(&self, entry: &EntryStore) -> Result<String> {
    if entry.long_key == 0 {
      if entry.key_len <= BLOCK_KEY_SIZE as i32 {
        let data = &entry.key[0 .. entry.key_len as usize];
        Ok(String::from_utf8_lossy(data).to_string())
      } else {
        Ok(String::from_utf8_lossy(&*entry.key).to_string())
      }
    } else {
      // Long key are stored in other block files, such as data_2
      let long_key_data = self.read_data(entry.long_key)?;
      let data = &long_key_data[0 .. entry.key_len as usize];
      Ok(String::from_utf8_lossy(data).to_string())
    }
  }
}
