mod disk_cache;
mod genshin;

use std::io::{Write, BufWriter};

fn main() {
  println!("Genshin Gacha");

  let genshin_data_dir = genshin::path::get_data_dir_path().unwrap();
  let cache_dir = genshin_data_dir.join("webCaches/Cache/Cache_Data/");
  let disk_cache = disk_cache::structs::DiskCache::from_dir(cache_dir).unwrap();
  println!("Cache dir: {:?}", disk_cache.cache_dir.as_os_str());

  assert_eq!(disk_cache.index_file.header.magic, disk_cache::structs::INDEX_MAGIC);
  assert_eq!(disk_cache.index_file.header.version, disk_cache::structs::INDEX_VERSION2_1);

  // FIXME: DEBUG CODE
  let file = std::fs::File::create("D:/ys_cache_tables.txt").unwrap();
  let mut writer = BufWriter::new(file);

  for addr in disk_cache.index_file.table.iter().cloned() {
    let entry = disk_cache.read_entry(addr).unwrap();
    let url = disk_cache.read_entry_key_as_url(&entry).unwrap();
    let creation_time = entry.get_creation_time_as_utc().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    writer.write(format!("[{}] [{}] {}\n", addr, creation_time, url).as_bytes()).unwrap();
  }
  println!("done");
}
