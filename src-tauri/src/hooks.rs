extern crate tauri;

use std::error::Error;
use tauri::{App, Manager};
use crate::account::AccountManage;

type Setup = Box<dyn FnOnce(&mut App<tauri::Wry>) -> Result<(), Box<dyn Error>> + Send>;

pub fn get_setup() -> Setup {
  Box::new(|app| {
    setup_manage(app)?;
    Ok(())
  })
}

fn setup_manage(app: &mut App) -> Result<(), Box<dyn Error>> {
  let data_dir = app.path_resolver().app_data_dir().ok_or("tauri app data dir")?;
  println!("Data dir: {data_dir:#?}");

  let account_manage = AccountManage::from_data_dir(&data_dir)?;
  println!("Account manage: {account_manage:#?}");
  app.manage(account_manage);

  Ok(())
}
