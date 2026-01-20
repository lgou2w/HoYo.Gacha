use std::time::Duration;

use exponential_backoff::Backoff;
use hg_game_biz::GachaLogEndpointType;
use hg_url_finder::parse::ParsedGachaUrl;

use crate::requester::RetryOptions;
use crate::scraper::GachaLogsScraper;

#[tokio::test]
#[ignore = "Hard-coded unit test"]
async fn test_scrape_gacha_logs() {
  let dirty = "https://public-operation-hkrpg.mihoyo.com/common/gacha_record/api/getGachaLog?authkey_ver=1&sign_type=2&region=prod_gf_cn&default_gacha_type=11&lang=zh-cn&game_biz=hkrpg_cn&page=1&size=5&gacha_type=11&end_id=0&authkey=TF8It6Dz%2BEPimaMAoNyICMdD9BqMSY...........................";

  let parsed = ParsedGachaUrl::from_dirty(dirty).unwrap();

  let logs = GachaLogsScraper::new(
    parsed,
    RetryOptions::default(),
    tokio::time::sleep,
    Some(Box::new(|notify| println!("Scraper notify: {notify:?}"))),
  )
  .scrape(
    GachaLogEndpointType::Standard,
    &[
      (1, None), // Permanent
    ],
    None,
  )
  .await
  .unwrap();

  println!("GachaLogs length: {}", logs.len());

  // std::fs::write("./GachaLogs.txt", format!("{logs:#?}")).unwrap();
}

#[test]
fn test_backoff() {
  use std::fmt::Write;

  let backoff = Backoff::new(3, Duration::from_secs(3), Duration::from_secs(10));

  let mut i = 0;
  let mut w = String::new();

  for duration in &backoff {
    i += 1;
    let _ = write!(w, "{i}");

    if duration.is_some() {
      let _ = write!(w, "sleep");
    } else {
      let _ = write!(w, "max");
    }
  }

  assert_eq!(i, 3);
  assert_eq!(w, "1sleep2sleep3max");
}
