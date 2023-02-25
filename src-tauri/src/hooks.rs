extern crate log;
extern crate tauri;

use std::error::Error;
use log::debug;
use tauri::{App, Manager};
use crate::core::{CoreManage, GachaManageExt};

type Setup = Box<dyn FnOnce(&mut App<tauri::Wry>) -> Result<(), Box<dyn Error>> + Send + Sync>;

pub fn get_setup() -> Setup {
  Box::new(|app| {
    setup_manage(app)?;
    Ok(())
  })
}

fn setup_manage(app: &mut App) -> Result<(), Box<dyn Error>> {
  let data_dir = app.path_resolver().app_data_dir().ok_or("tauri app data dir")?;
  debug!("Data dir: {data_dir:?}");

  let core_manage: Result<CoreManage, Box<dyn Error>> = tauri::async_runtime::block_on(async move {
    debug!("Initializing core manage...");
    let manage = CoreManage::from_data_dir(&data_dir).await?;
    GachaManageExt::initial_gacha(&manage).await?;
    Ok(manage)
  });

  app.manage(core_manage?);

  Ok(())
}
