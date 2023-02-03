extern crate serde_json;

use std::collections::hash_map::Entry;
use std::error::Error;
use std::fs::{create_dir, File};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use super::Account;
use crate::errors;

pub type Accounts = HashMap<u32, Account>;

#[derive(Debug)]
pub struct AccountManage {
  file: PathBuf,
  accounts: Mutex<Accounts>
}

impl AccountManage {
  pub const FILENAME: &str = "accounts.json";
  pub fn new(file: PathBuf) -> Self {
    Self {
      file,
      accounts: Default::default()
    }
  }

  pub fn from_data_dir(data_dir: &Path) -> Result<Self, Box<dyn Error>> {
    if !data_dir.exists() {
      create_dir(data_dir)?
    };

    let file_path = data_dir.join(Self::FILENAME);
    let result = AccountManage::new(file_path);
    result.load()?;

    Ok(result)
  }

  pub fn load(&self) -> Result<(), Box<dyn Error>> {
    if self.file.exists() {
      let mut accounts = self.accounts.lock().unwrap();
      let file = File::open(&self.file)?;
      *accounts = serde_json::from_reader(&file)?;
    }
    Ok(())
  }

  pub fn save(&self) -> Result<(), Box<dyn Error>> {
    let accounts = self.accounts.lock().unwrap();
    let data = (*accounts).clone();
    let file = File::create(&self.file)?;
    serde_json::to_writer_pretty(&file, &data)?;
    Ok(())
  }

  pub fn get_accounts(&self) -> Accounts {
    let accounts = self.accounts.lock().unwrap();
    (*accounts).clone()
  }

  pub fn get_account(&self, uid: u32) -> Result<Account, String> {
    self
      .try_get_account(uid)
      .ok_or(errors::ERR_ACCOUNT_NOT_FOUND.into())
  }

  pub fn try_get_account(&self, uid: u32) -> Option<Account> {
    let accounts = self.accounts.lock().unwrap();
    accounts.get(&uid).cloned()
  }

  pub fn add_account(
    &self,
    uid: u32,
    display_name: Option<String>,
    game_data_dir: String
  ) -> Result<Account, String> {
    let mut accounts = self.accounts.lock().unwrap();
    if let Entry::Vacant(e) = accounts.entry(uid) {
      let account = e.insert(Account {
        uid,
        display_name,
        game_data_dir: PathBuf::from(game_data_dir)
      });
      Ok(account.clone())
    } else {
      Err(errors::ERR_ACCOUNT_EXISTED.into())
    }
  }

  pub fn remove_account(&self, uid: u32) -> Option<Account> {
    let mut accounts = self.accounts.lock().unwrap();
    accounts.remove(&uid)
  }
}
