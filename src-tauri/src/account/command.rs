extern crate tauri;

use tauri::State;
use super::{AccountManage, Accounts, Account};

#[tauri::command]
pub fn cmd_get_accounts(state: State<AccountManage>) -> Accounts {
  state.get_accounts()
}

#[tauri::command]
pub fn cmd_add_account(
  state: State<AccountManage>,
  uid: u32,
  display_name: Option<String>,
  game_data_dir: String
) -> Result<Account, String> {
  let account = state.add_account(uid, display_name, game_data_dir)?;
  state.save().map_err(|err| err.to_string())?;
  Ok(account)
}

#[tauri::command]
pub fn cmd_remove_account(
  state: State<AccountManage>,
  uid: u32
) -> Result<Option<Account>, String> {
  let account = state.remove_account(uid);
  state.save().map_err(|err| err.to_string())?;
  Ok(account)
}
