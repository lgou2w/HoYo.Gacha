extern crate serde;

use std::env;
use std::fs::File;
use std::io::{prelude::*, BufReader, Result};
use std::path::{Path, PathBuf};
use serde::Serialize;

// TODO:
//   - Cloud Genshin Impact
//   - MacOS

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GameDirectory {
  pub output_log: PathBuf,
  pub game_data_dir: PathBuf,
  pub international: bool
}

pub fn find_available_game_directories() -> Result<Vec<GameDirectory>> {
  let user_profile = env::var("USERPROFILE").unwrap();
  let mihoyo_dir = Path::new(&user_profile).join("AppData/LocalLow/miHoYo");
  let mut directories: Vec<GameDirectory> = Vec::new();

  const INTERNATIONAL_OUTPUT_LOG : &str = "Genshin Impact/output_log.txt";
  const INTERNATIONAL_DIR_KEYWORD: &str = "/GenshinImpact_Data/";
  const CHINESE_OUTPUT_LOG       : &str = "原神/output_log.txt";
  const CHINESE_DIR_KEYWORD      : &str = "/YuanShen_Data/";

  let mut output_log = mihoyo_dir.join(INTERNATIONAL_OUTPUT_LOG);
  if let Some(mut directory) = find_game_directory(&output_log, INTERNATIONAL_DIR_KEYWORD)? {
    directory.international = true;
    directories.push(directory);
  }

  output_log = mihoyo_dir.join(CHINESE_OUTPUT_LOG);
  if let Some(directory) = find_game_directory(&output_log, CHINESE_DIR_KEYWORD)? {
    directories.push(directory);
  }

  Ok(directories)
}

fn find_game_directory(output_log: &PathBuf, dir_keyword: &str) -> Result<Option<GameDirectory>> {
  if !output_log.exists() || !output_log.is_file() {
    return Ok(None);
  }

  let file = File::open(output_log)?;
  let reader = BufReader::new(file);

  for line in reader.lines().map(|l| l.unwrap()) {
    if !line.contains(dir_keyword) {
      continue;
    }

    if let Some(colon) = line.rfind(':') {
      if let Some(end) = line.find(dir_keyword) {
        // -> X:/Foo/Bar/(GenshinImpact|YuanShen)_Data/
        let path = &line[colon - 1..end + dir_keyword.len()];
        return Ok(Some(GameDirectory {
          output_log: output_log.clone(),
          game_data_dir: Path::new(path).to_path_buf(),
          international: false
        }));
      }
    }
  }

  Ok(None)
}
