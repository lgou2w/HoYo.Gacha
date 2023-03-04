extern crate tauri;

use std::error::Error;
use std::fs::File;
use tauri::State;
use super::uigf::model::UIGFGachaLog;
use super::uigf::convert::convert_to_official;
use crate::core::{CoreManage, GachaManageExt};
use crate::errors;

pub async fn import_gacha_logs(
  state: &State<'_, CoreManage>,
  #[allow(unused)]
  uid: u32,
  file: String
) -> Result<u64, Box<dyn Error + Send + Sync>> {
  let file = File::open(file)?;
  let uigf = UIGFGachaLog::from_reader(file)?;
  let uigf_uid = uigf.info.uid.parse::<u32>()?;
  let uigf_lang = &uigf.info.lang;

  if uid != uigf_uid {
    let message = errors::ERR_UIGF_MISMATCHED_UID.replace("%1", &uigf.info.uid);
    return Err(message.into());
  }

  let gacha_logs = convert_to_official(&uigf.list, true, uigf_uid, uigf_lang)?;
  state
    .save_gacha_logs(&gacha_logs)
    .await
}
