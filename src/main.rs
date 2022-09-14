mod disk_cache;
mod genshin;

fn main() {
  println!("Genshin Gacha");

  let genshin_data_dir = genshin::path::get_data_dir_path().unwrap();
  let cache_dir = genshin_data_dir.join("webCaches/Cache/Cache_Data/");
  let disk_cache = disk_cache::structs::DiskCache::from_dir(cache_dir).unwrap();
  println!("Cache dir: {:?}", disk_cache.cache_dir.as_os_str());

  assert_eq!(disk_cache.index_file.header.magic, disk_cache::structs::INDEX_MAGIC);
  assert_eq!(disk_cache.index_file.header.version, disk_cache::structs::INDEX_VERSION2_1);
}
