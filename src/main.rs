mod disk_cache;
mod genshin;

fn main() {
  println!("Genshin Gacha");

  let (creation_time, url) = genshin::url::find_recent_gacha_url().unwrap();
  println!("Time: {}", creation_time.to_rfc3339_opts(chrono::SecondsFormat::Millis, true));
  println!("Url: {}", url);
}
