extern crate tauri;

use tauri::{Invoke, Runtime};
use crate::constants;

pub fn get_handlers<R: Runtime>() -> Box<dyn Fn(Invoke<R>) + Send + Sync> {
  Box::new(tauri::generate_handler![
    get_version
  ])
}

#[tauri::command]
fn get_version() -> String {
  let date = constants::COMMIT_DATE.split('T').collect::<Vec<&str>>()[0];
  let commit_tag = constants::COMMIT_TAG;
  if !commit_tag.is_empty() && commit_tag.to_lowercase().contains("snapshot") {
    format!("{} ({})", commit_tag, date)
  } else {
    format!("{}-{} ({})",
      constants::VERSION,
      constants::COMMIT_HASH[0..7].to_owned(),
      date
    )
  }
}
