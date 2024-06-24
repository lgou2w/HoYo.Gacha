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
  pub item_id: GachaDictionaryEntryItemId<'a>,
  pub rank_type: u8,
}

#[derive(Debug, Deserialize)]
#[serde(untagged)]
pub enum GachaDictionaryEntryItemId<'a> {
  Unique(&'a str),
  Many(Vec<&'a str>),
}

impl<'a> GachaDictionaryEntryItemId<'a> {
  #[allow(unused)]
  pub fn has_many(&self) -> bool {
    matches!(self, Self::Many(_))
  }

  pub fn acceptance(&self) -> &str {
    match self {
      Self::Unique(one) => one,
      Self::Many(vec) => vec.last().unwrap(), // HACK: embedded resource
    }
  }
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
      .get_or_init(|| self.init_reverses())
      .get(item_id)
      .and_then(|item_name| self.entries.get(item_name))
  }

  // private
  fn init_reverses(&self) -> HashMap<&'a str, Cow<'a, str>> {
    self
      .entries
      .iter()
      .flat_map(|(item_name, entry)| match &entry.item_id {
        GachaDictionaryEntryItemId::Unique(one) => vec![(*one, item_name.clone())],
        GachaDictionaryEntryItemId::Many(vec) => {
          vec.iter().map(|e| (*e, item_name.clone())).collect()
        }
      })
      .collect()
  }
}
