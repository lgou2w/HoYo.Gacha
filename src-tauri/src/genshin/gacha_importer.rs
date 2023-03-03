extern crate tauri;

use std::error::Error;
use std::fs::File;
use tauri::State;
use super::uigf::model::UIGFGachaLog;
use super::uigf::convert::convert_to_official;
use crate::core::{CoreManage, GachaManageExt};

pub async fn import_gacha_logs(
  state: &State<'_, CoreManage>,
  #[allow(unused)]
  uid: u32,
  file: String
) -> Result<u64, Box<dyn Error + Send + Sync>> {
  let file = File::open(file)?;
  let uigf = UIGFGachaLog::from_reader(file)?;
  let gacha_logs = convert_to_official(&uigf.list, true)?;
  state
    .save_gacha_logs(&gacha_logs)
    .await
}
