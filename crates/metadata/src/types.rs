use std::collections::HashSet;
use std::fmt;

use time::OffsetDateTime;

#[derive(Debug, PartialEq, Eq, Hash)]
pub struct Entry<'a> {
  pub locale: &'a str,
  pub category: &'a str,
  pub category_name: &'a str,
  pub item_id: u32,
  pub item_name: &'a str,
  pub rank_type: u8,
}

pub trait Metadata: fmt::Debug + Send + Sync {
  fn locale(&self, business_id: u8, locale: &str) -> Option<&dyn MetadataLocale>;

  fn query_banner(
    &self,
    business_id: u8,
    gacha_type: u32,
    point: OffsetDateTime,
  ) -> Option<&dyn MetadataBanner>;
}

pub trait MetadataLocale: fmt::Debug + Send + Sync {
  fn entry_from_id(&self, item_id: u32) -> Option<Entry<'_>>;

  fn entry_from_name<'a, 'n: 'a>(&'a self, item_name: &'n str) -> Option<HashSet<Entry<'a>>>;
  fn entry_from_name_first<'a, 'n: 'a>(&'a self, item_name: &'n str) -> Option<Entry<'a>>;
}

pub trait MetadataBanner: fmt::Debug + Send + Sync {
  fn gacha_type(&self) -> u32;
  fn start_time(&self) -> &OffsetDateTime;
  fn end_time(&self) -> &OffsetDateTime;
  fn version(&self) -> Option<&str>;

  fn is_up_golden(&self, item_id: u32) -> bool;
  fn is_up_purple(&self, item_id: u32) -> bool;
}
