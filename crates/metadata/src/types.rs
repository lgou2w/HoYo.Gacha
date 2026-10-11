use std::collections::hash_map::Values as MapValues;
use std::collections::{HashMap, HashSet};
use std::fmt::Debug;
use std::sync::Arc;

use time::OffsetDateTime;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum UpRarity {
  Purple,
  Golden,
}

#[derive(Debug, PartialEq, Eq, Hash)]
pub struct Item<'a> {
  pub locale: &'a str,
  pub category: &'a str,
  pub category_name: &'a str,
  pub item_id: u32,
  pub item_name: &'a str,
  pub rank_type: u8,
}

pub trait Metadata: Debug + Send + Sync {
  fn locale(&self, bid: u8, locale: &str) -> Option<&dyn Locale>;
  fn locales(&self, bid: u8) -> Option<MapValues<'_, Arc<str>, Box<dyn Locale>>>;
  fn banner(&self, bid: u8, gacha_type: u32, point: OffsetDateTime) -> Option<&dyn Banner>;
}

pub trait Locale: Debug + Send + Sync {
  fn lang(&self) -> &str;
  fn items(&self) -> HashMap<u32, Item<'_>>;
  fn item(&self, item_id: u32) -> Option<Item<'_>>;
  fn items_by_name<'a, 'n: 'a>(&'a self, item_name: &'n str) -> Option<HashSet<Item<'a>>>;
  fn item_by_name<'a, 'n: 'a>(&'a self, item_name: &'n str) -> Option<Item<'a>>;
}

pub trait Banner: Debug + Send + Sync {
  fn gacha_type(&self) -> u32;
  fn start_time(&self) -> &OffsetDateTime;
  fn end_time(&self) -> &OffsetDateTime;
  fn version(&self) -> Option<&str>;
  fn is_up(&self, item_id: u32, rarity: UpRarity) -> bool;
}
