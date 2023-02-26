extern crate chrono;
extern crate tauri;

use std::error::Error;
use std::fs::{File, create_dir};
use std::path::{Path, PathBuf};
use chrono::{DateTime, Local};
use tauri::State;
use super::official::model::GachaLogItem;
use super::uigf::model::UIGFGachaLog;
use super::uigf::convert::convert_to_uigf;
use crate::core::{CoreManage, GachaManageExt};

pub async fn export_gacha_logs(
  state: &State<'_, CoreManage>,
  uid: u32,
  directory: String,
  uigf: bool
) -> Result<(), Box<dyn Error + Send + Sync>> {
  let gacha_logs = state.find_gacha_logs(uid, None).await?;
  let export_time = Local::now();
  let export_file = combine_export_file(uid, &directory, uigf, &export_time)?;
  if uigf {
    export_gacha_logs_into_uigf(uid, &gacha_logs, &export_time, export_file)
  } else {
    export_gacha_logs_into_xlsx(&gacha_logs, &export_time, export_file)
  }
}

fn combine_export_file(
  uid: u32,
  directory: &str,
  uigf: bool,
  export_time: &DateTime<Local>
) -> Result<PathBuf, Box<dyn Error + Send + Sync>> {
  let directory = PathBuf::from(directory);
  if !directory.exists() {
    create_dir(&directory)?;
  }

  let (format, extension) = if uigf { ("UIGF", "json") } else { ("XLSX", "xlsx") };
  let time = export_time.format("%Y%m%d_%H%M%S").to_string();
  let name = format!("原神祈愿记录_{}_{}_{}", format, uid, time);
  Ok(
    directory
      .join(name)
      .with_extension(extension)
  )
}

fn export_gacha_logs_into_uigf<P: AsRef<Path>>(
  uid: u32,
  gacha_logs: &[GachaLogItem],
  export_time: &DateTime<Local>,
  export_file: P
) -> Result<(), Box<dyn Error + Send + Sync>> {
  let writer = File::create(export_file)?;
  let lang = gacha_logs.first().map(|v| v.lang.clone()).unwrap_or("zh-cn".into());
  let uigf_gacha_logs = convert_to_uigf(gacha_logs, true)?;
  let uigf = UIGFGachaLog::new(uid, lang, export_time, uigf_gacha_logs);
  uigf.to_writer(writer, false)?;
  Ok(())
}

fn export_gacha_logs_into_xlsx<P: AsRef<Path>>(
  gacha_logs: &[GachaLogItem],
  export_time: &DateTime<Local>,
  export_file: P
) -> Result<(), Box<dyn Error + Send + Sync>> {
  todo!()
}
