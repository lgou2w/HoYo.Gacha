use crate::dirty::{CreationTimePolicy, DirtyGachaUrl};
use crate::parse::ParsedGachaUrl;

#[test]
#[ignore = "Hard-code unit test"]
fn test_find_valid_urls() {
  let dirty = DirtyGachaUrl::from_webcaches(
    r"D:\miHoYo Launcher\games\ZenlessZoneZero Game\ZenlessZoneZero_Data\webCaches",
    CreationTimePolicy::Valid,
  )
  .unwrap();

  for d in dirty {
    let parsed = ParsedGachaUrl::from_dirty(&d.value).unwrap();

    println!("{parsed:?}\n");
  }
}
