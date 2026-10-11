use std::io::Read;

use crate::providers::MetadataProvider;
use crate::raw::RawMetadata;

pub struct JsonProvider<R>(R);

impl<R> JsonProvider<R> {
  #[inline]
  pub fn new(rdr: R) -> Self {
    Self(rdr)
  }
}

impl<R: Read> MetadataProvider for JsonProvider<R> {
  type Error = serde_json::Error;

  fn load(self) -> Result<RawMetadata, Self::Error> {
    serde_json::from_reader(self.0)
  }
}

impl<'a> JsonProvider<&'a [u8]> {
  #[inline]
  pub fn from_slice(bytes: &'a [u8]) -> Self {
    Self(bytes)
  }

  #[inline]
  #[allow(clippy::should_implement_trait)]
  pub fn from_str(s: &'a str) -> Self {
    Self(s.as_bytes())
  }
}

#[cfg(test)]
mod tests {
  use super::JsonProvider;
  use crate::Metadata;
  use crate::bake::bake;
  use crate::providers::MetadataProvider;

  /// Convenience: parse a JSON string and bake it in one step.
  fn bake_json(json: &str) -> Result<Box<dyn Metadata>, crate::bake::MismatchedItemsAndNames> {
    let raw = JsonProvider::from_str(json)
      .load()
      .expect("raw metadata must parse");

    bake(raw)
  }

  #[test]
  fn bake_rejects_mismatched_items_and_names() {
    let json = r#"
      [
        {
          "Id": 0,
          "Categories": [
            {
              "Category": "Character",
              "Entries": [[1001, 5], [1002, 4], [1003, 4]],
              "I18n": {
                "en-us": {
                  "Category": "Character",
                  "Entries": ["Foo", "Bar"]
                }
              }
            }
          ],
          "Banners": []
        }
      ]
    "#;

    let err = bake_json(json).expect_err("expected MismatchedItemsAndNames");

    assert_eq!(err.bid, 0);
    assert_eq!(&*err.locale, "en-us");
    assert_eq!(&*err.category, "Character");
    assert_eq!(err.items, 3);
    assert_eq!(err.names, 2);
  }

  /// Same shape, but entries and names are aligned — bake succeeds.
  #[test]
  fn bake_accepts_matched_items_and_names() {
    let json = r#"
      [
        {
          "Id": 0,
          "Categories": [
            {
              "Category": "Character",
              "Entries": [[1001, 5], [1002, 4]],
              "I18n": {
                "en-us": {
                  "Category": "Character",
                  "Entries": ["Foo", "Bar"]
                }
              }
            }
          ],
          "Banners": []
        }
      ]
    "#;

    let metadata = bake_json(json).expect("bake must succeed");

    let locale = metadata.locale(0, "en-us").expect("en-us locale");
    let item = locale.item(1001).expect("item 1001");

    assert_eq!(item.item_id, 1001);
    assert_eq!(item.item_name, "Foo");
    assert_eq!(item.category, "Character");
    assert_eq!(item.category_name, "Character");
    assert_eq!(item.rank_type, 5);
  }

  /// `LOCALE_ALIASES` maps short codes to canonical BCP 47 — `"en"` → `"en-us"`.
  #[test]
  fn bake_resolves_locale_alias() {
    let json = r#"
      [
        {
          "Id": 0,
          "Categories": [
            {
              "Category": "Character",
              "Entries": [[1001, 5]],
              "I18n": {
                "en-us": {
                  "Category": "Character",
                  "Entries": ["Foo"]
                }
              }
            }
          ],
          "Banners": []
        }
      ]
    "#;

    let metadata = bake_json(json).expect("bake must succeed");

    assert!(metadata.locale(0, "en").is_some(), "en must alias to en-us");
    assert!(metadata.locale(0, "en-us").is_some());
    assert!(
      metadata.locale(0, "unknown").is_none(),
      "unknown locale returns None",
    );
  }
}
