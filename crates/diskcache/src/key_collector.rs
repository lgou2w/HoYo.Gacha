use std::borrow::Cow;
use std::io::Result;
use std::path::Path;

use crate::{Addr, BlockFile, EntryStore, IndexFile};

pub const DEFAULT_INDEX_FILE: &str = "index";
pub const DEFAULT_BLOCK_FILE1: &str = "data_1";
pub const DEFAULT_BLOCK_FILE2: &str = "data_2";

#[derive(Debug)]
pub struct Key<'a> {
  pub addr: Addr,
  pub timestamp: u64,
  pub is_long_key: bool,
  pub data: Cow<'a, str>,
}

pub struct KeyCollector {
  index_file: IndexFile,
  block_file1: BlockFile,
  block_file2: BlockFile,
  long_key_only: bool, // When true, the short key data will no longer be read
}

impl KeyCollector {
  #[inline]
  pub fn long_key_only<P: AsRef<Path>>(data_folder: P) -> Result<Self> {
    Self::new(data_folder, true)
  }

  pub fn new<P: AsRef<Path>>(data_folder: P, long_key_only: bool) -> Result<Self> {
    let cwd = data_folder.as_ref();

    let index_file_path = cwd.join(DEFAULT_INDEX_FILE);
    let index_file = IndexFile::from_file(index_file_path)?;

    let block_file1_path = cwd.join(DEFAULT_BLOCK_FILE1);
    let block_file1 = BlockFile::from_file(block_file1_path)?;

    let block_file2_path = cwd.join(DEFAULT_BLOCK_FILE2);
    let block_file2 = BlockFile::from_file(block_file2_path)?;

    Ok(Self {
      index_file,
      block_file1,
      block_file2,
      long_key_only,
    })
  }
}

impl KeyCollector {
  pub fn collect<V, R>(self, visitor: V) -> Result<Vec<R>>
  where
    V: Fn(Key<'_>) -> Option<R>,
  {
    let KeyCollector {
      index_file,
      block_file1,
      block_file2,
      long_key_only,
    } = self;

    let mut results = Vec::new();

    for addr in index_file.table {
      // Read the entry store from the data_1 block file by cache address
      let entry_store = {
        let data = block_file1.read_data(addr)?;
        EntryStore::from_reader(data)?
      };

      // The key could be a long key or a short key.
      let is_long_key = entry_store.has_long_key();
      let key = if is_long_key {
        // Long key and stored in the data_2 block file,
        // So the long key of entry store must not be zero.

        // Maybe the long key points to data_3 or something else
        // See: https://github.com/lgou2w/HoYo.Gacha/issues/15
        if entry_store.long_key.file_number() != block_file2.header.this_file as u32 {
          continue;
        }

        // Read the long key of entry store from the data_2 block file
        entry_store.read_long_key(&block_file2)?
      } else if !long_key_only {
        // Short key: data is read only when `long_key_only` is false
        entry_store.read_key()?
      } else {
        continue;
      };

      // Convert creation time (microsecond timebase) to Unix timestamp
      // https://github.com/chromium/chromium/blob/0b124cb/net/disk_cache/blockfile/entry_impl.cc#L451
      // https://github.com/chromium/chromium/blob/0b124cb/base/time/time.h#L493
      let timestamp = entry_store.creation_time / 1_000_000 - 11_644_473_600;

      // Visit key and collect
      if let Some(result) = visitor(Key {
        addr,
        timestamp,
        is_long_key,
        data: key,
      }) {
        results.push(result)
      }
    }

    Ok(results)
  }
}
