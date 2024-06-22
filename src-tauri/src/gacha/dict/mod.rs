use std::borrow::Cow;
use std::collections::HashMap;

use once_cell::sync::OnceCell;
use serde::Deserialize;

pub mod embedded;

#[derive(Clone, Debug, Deserialize, PartialEq, Eq, Hash)]
#[serde(rename_all = "camelCase")]
pub enum Category {
  Character,
  Weapon,
}

#[derive(Debug)]
pub struct GachaDictionaryEntry<'a> {
  #[allow(unused)]
  pub lang: &'a str,
  #[allow(unused)]
  pub category: Category,
  pub category_name: &'a str,
  pub item_name: Cow<'a, str>,
  pub item_id: &'a str,
  pub rank_type: u8,
}

#[derive(Debug)]
pub struct GachaDictionary<'a> {
  entries: HashMap<Cow<'a, str>, GachaDictionaryEntry<'a>>, // item_name -> entry
  reverses: OnceCell<HashMap<&'a str, Cow<'a, str>>>,       // item_id -> item_name
}

impl<'a> GachaDictionary<'a> {
  pub fn new(entries: HashMap<Cow<'a, str>, GachaDictionaryEntry<'a>>) -> Self {
    Self {
      entries,
      reverses: OnceCell::new(),
    }
  }

  pub fn name(&self, item_name: &str) -> Option<&GachaDictionaryEntry> {
    self.entries.get(item_name)
  }

  pub fn id(&self, item_id: &str) -> Option<&GachaDictionaryEntry> {
    self
      .reverses
      .get_or_init(|| {
        self
          .entries
          .iter()
          .map(|(item_name, entry)| (entry.item_id, item_name.clone()))
          .collect()
      })
      .get(item_id)
      .and_then(|item_name| self.entries.get(item_name))
  }
}
