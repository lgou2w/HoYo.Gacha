extern crate serde;
extern crate serde_json;

use std::collections::hash_map::Entry;
use std::error::Error;
use std::fs::{create_dir, File};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use serde::{Serialize, Deserialize};

use super::Account;
use crate::errors;

pub type Accounts = HashMap<u32, Account>;

#[derive(Debug)]
pub struct AccountManage {
  file: PathBuf,
  inner: Mutex<AccountManageInner>
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct AccountManageInner {
  accounts: Accounts,
  selected: Option<u32>
}

impl AccountManage {
  pub const FILENAME: &str = "accounts.json";
  pub fn new(file: PathBuf) -> Self {
    Self {
      file,
      inner: Default::default()
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
      let mut inner = self.inner.lock().unwrap();
      let file = File::open(&self.file)?;
      *inner = serde_json::from_reader(&file)?;
    }
    Ok(())
  }

  pub fn save(&self) -> Result<(), Box<dyn Error>> {
    let inner = self.inner.lock().unwrap();
    let file = File::create(&self.file)?;
    serde_json::to_writer_pretty(&file, &(*inner))?;
    Ok(())
  }

  pub fn get_inner(&self) -> AccountManageInner {
    let inner = self.inner.lock().unwrap();
    inner.clone()
  }

  pub fn get_accounts(&self) -> Accounts {
    let inner = self.inner.lock().unwrap();
    inner.accounts.clone()
  }

  pub fn get_account(&self, uid: u32) -> Result<Account, String> {
    self
      .try_get_account(uid)
      .ok_or(errors::ERR_ACCOUNT_NOT_FOUND.into())
  }

  pub fn try_get_account(&self, uid: u32) -> Option<Account> {
    let inner = self.inner.lock().unwrap();
    inner.accounts.get(&uid).cloned()
  }

  pub fn add_account(
    &self,
    uid: u32,
    display_name: Option<String>,
    game_data_dir: String
  ) -> Result<Account, String> {
    let mut inner = self.inner.lock().unwrap();
    if let Entry::Vacant(e) = inner.accounts.entry(uid) {
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
    let mut inner = self.inner.lock().unwrap();
    let removed = inner.accounts.remove(&uid);

    // And remove current selected
    if removed.is_some() && inner.selected.eq(&Some(uid)) {
      inner.selected.take();
    }

    removed
  }

  pub fn get_selected(&self) -> Option<u32> {
    let inner = self.inner.lock().unwrap();
    inner.selected
  }

  pub fn get_selected_account(&self) -> Option<Account> {
    let inner = self.inner.lock().unwrap();
    if let Some(ref selected) = inner.selected {
      inner.accounts.get(selected).cloned()
    } else {
      None
    }
  }

  pub fn select_account(&self, uid: u32) -> Result<Account, String> {
    let mut inner = self.inner.lock().unwrap();
    let account = inner.accounts
      .get(&uid)
      .cloned()
      .ok_or(errors::ERR_ACCOUNT_NOT_FOUND)?;

    inner.selected.replace(uid);
    Ok(account)
  }
}
