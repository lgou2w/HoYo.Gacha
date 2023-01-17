use std::env;
use std::fs::File;
use std::io::{prelude::*, BufReader};
use std::path::{Path, PathBuf};

pub fn find_output_log_path() -> Option<PathBuf> {
  let user_profile = env::var("USERPROFILE").unwrap();
  let user_profile_dir = Path::new(&user_profile);
  let mihoyo_dir = user_profile_dir.join("AppData/LocalLow/miHoYo");

  // International
  let mut output_log_path = mihoyo_dir.join("Genshin Impact/output_log.txt");
  if !output_log_path.exists() {
    // Chinese
    output_log_path = mihoyo_dir.join("原神/output_log.txt");
    if !output_log_path.exists() {
      return None;
    }
  }

  Some(output_log_path)
}

pub fn find_game_data_dir() -> Option<PathBuf> {
  let output_log_path = find_output_log_path()?;
  let output_log_file = File::open(output_log_path)
    .expect("Failed to read the Genshin Impact output_log.txt file");

  let reader = BufReader::new(output_log_file);
  for line in reader.lines() {
    let line = line.unwrap();
    if line.contains("/GenshinImpact_Data/") || line.contains("/YuanShen_Data/") {
      if let Some(colon) = line.find(':') {
        if let Some(end) = line.find("_Data/") {
          // -> X:/Foo/Bar/(GenshinImpact|YuanShen)_Data/
          let path = &line[colon - 1..end + 6];
          return Some(Path::new(path).to_path_buf());
        }
      }
    }
  }

  None
}
