extern crate clap;
extern crate chrono;

use std::io::ErrorKind;
use clap::{arg, ArgMatches, Command};
use chrono::{Duration, Local, SecondsFormat};
use gacha_url;

fn cli() -> Command<'static> {
  Command::new("genshin-gacha-cli")
    .author("lgou2w <lgou2w@hotmail.com>")
    .version("0.1.0")
    .about("A tool to get Genshin Impact gacha logs.")
    .subcommand_required(true)
    .subcommand(
      Command::new("url")
        .about("Get the recent gacha url")
        .arg(arg!(-p --pure "Print only gacha url").action(clap::ArgAction::SetTrue))
    )
}

fn main() {
  let matches = cli().get_matches();
  match matches.subcommand() {
    Some(("url", sub_matches)) => get_genshin_gacha_url(sub_matches),
    _ => unreachable!()
  }
}

fn get_genshin_gacha_url(sub_matches: &ArgMatches) {
  let (creation_time, gacha_url) = match gacha_url::find_recent_gacha_url() {
    Ok(result) => result,
    Err(error) => {
      match error.kind() {
        ErrorKind::NotFound => panic!("Gacha url not found. Please open the wish history page in the game first!"),
        _ => panic!("{:?}", error)
      }
    }
  };

  if sub_matches.get_flag("pure") {
    println!("{}", gacha_url);
  } else {
    let now = Local::now();
    let expire_time = (creation_time + Duration::days(1)).with_timezone(&Local);
    println!("");
    println!("Creation Time(UTC)  : {}", creation_time.to_rfc3339_opts(SecondsFormat::Millis, true));
    println!("Creation Time(Local): {}", creation_time.with_timezone(&Local).format("%Y/%m/%d %H:%M:%S"));
    println!(" Expired Time(Local): {} [Creation Time + 1 Day]", expire_time.format("%Y/%m/%d %H:%M:%S"));
    println!(" Expired: {}", now >= expire_time);
    println!("");
    println!("{}", gacha_url);
  }
}
