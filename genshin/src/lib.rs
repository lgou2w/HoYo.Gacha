use std::env::var;
use std::fs::File;
use std::io::{prelude::*, BufReader, Error, ErrorKind, Result};
use std::path::{Path, PathBuf};

pub fn get_output_log_path() -> Result<PathBuf> {
  let user_profile_env = var("USERPROFILE").unwrap();
  let user_profile_dir = Path::new(&user_profile_env);

  let mihoyo_dir = user_profile_dir.join("AppData/LocalLow/miHoYo");
  let mut output_log_path = mihoyo_dir.join("Genshin Impact/output_log.txt");
  if !output_log_path.exists() {
    output_log_path = mihoyo_dir.join("原神/output_log.txt");
    if !output_log_path.exists() {
      return Err(Error::new(
        ErrorKind::NotFound,
        format!("Genshin output log file not found: {:?}", output_log_path.as_os_str())
      ))
    }
  }

  Ok(output_log_path)
}

pub fn get_game_data_dir_path() -> Result<PathBuf> {
  let output_log_path = get_output_log_path()?;
  let output_log_file = File::open(output_log_path)?;

  let reader = BufReader::new(output_log_file);
  for line in reader.lines() {
    let line = line.unwrap();
    if line.contains("/GenshinImpact_Data/") || line.contains("/YuanShen_Data/") {
      if let Some(colon) = line.find(':') {
        if let Some(end) = line.find("_Data/") {
          // -> X:/Foo/Bar/(GenshinImpact|YuanShen)_Data/
          let path = &line[colon - 1..end + 6];
          return Ok(Path::new(path).to_path_buf());
        }
      }
    }
  }

  Err(Error::new(
    ErrorKind::NotFound,
    "Genshin game installation data directory not found"
  ))
}
