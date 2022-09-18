extern crate clap;
extern crate chrono;
extern crate serde_json;
extern crate tokio;

use std::fs::File;
use std::io::{BufWriter, ErrorKind, Write};
use std::path::PathBuf;
use clap::{arg, value_parser, ArgAction, ArgMatches, Command};
use chrono::{Duration, Local, Utc, SecondsFormat, DateTime};
use genshin_path;
use gacha_url;
use gacha_log;

fn cli() -> Command<'static> {
  Command::new("Genshin Gacha CLI")
    .author(env!("CARGO_PKG_AUTHORS"))
    .version(env!("CARGO_PKG_VERSION"))
    .about(env!("CARGO_PKG_DESCRIPTION"))
    .subcommand_required(true)
    .subcommand(
      Command::new("url")
        .about("Get the recent gacha url")
        .arg(arg!(-p --pure "Print only gacha url").action(ArgAction::SetTrue))
    )
    .subcommand(
      Command::new("logs")
        .about("Fetch all gacha logs from gacha url")
        .arg(arg!(-f --format <FORMAT> "Set output format. (json, excel)"))
        .arg(arg!(-o --out <FILE> "Set output file.").value_parser(value_parser!(PathBuf)))
    )
}

#[tokio::main]
async fn main() {
  let matches = cli().get_matches();
  match matches.subcommand() {
    Some(("url", sub_matches)) => get_genshin_gacha_url(sub_matches),
    Some(("logs", sub_matches)) => get_genshin_gacha_logs(sub_matches).await,
    _ => unreachable!()
  }
}

fn find_gacha_url(genshin_data_dir: PathBuf) -> (DateTime<Utc>, String) {
  match gacha_url::find_recent_gacha_url(genshin_data_dir) {
    Ok(result) => result,
    Err(error) => {
      match error.kind() {
        ErrorKind::NotFound => panic!("Gacha url not found. Please open the gacha history page in the game first!"),
        _ => panic!("{:?}", error)
      }
    }
  }
}

fn get_genshin_gacha_url(sub_matches: &ArgMatches) {
  let genshin_data_dir = genshin_path::get_game_data_dir_path().unwrap();
  let (creation_time, gacha_url) = find_gacha_url(genshin_data_dir);

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

async fn get_genshin_gacha_logs(sub_matches: &ArgMatches) {
  let format = sub_matches.get_one::<String>("format").unwrap();

  let out_path = sub_matches.get_one::<PathBuf>("out").unwrap();
  let mut out_file = File::create(out_path).unwrap();

  let genshin_data_dir = genshin_path::get_game_data_dir_path().unwrap();
  let (creation_time, gacha_url) = find_gacha_url(genshin_data_dir);

  let now = Local::now();
  let expire_time = (creation_time + Duration::days(1)).with_timezone(&Local);
  if now >= expire_time {
    panic!("Last gacha url has expired. Please reopen the gacha history page in the game!")
  }

  println!("Fetch gacha logs...");

  let gacha_types = vec![(301, "角色活动祈愿"), (302, "武器活动祈愿"), (200, "常驻祈愿"), (100, "新手祈愿")];
  let mut gacha_logs_vec = Vec::new();
  for (gacha_type, name) in gacha_types.iter() {
    println!("Fetch gacha type: {} ({})", gacha_type, *name);
    let gacha_logs = gacha_log::fetch_gacha_logs(&gacha_url, &gacha_type.to_string()).await;
    gacha_logs_vec.push((*name, gacha_logs));
  }


  println!("Writing...");

  let excel_gacha_log = gacha_log::convert_to_excel(gacha_logs_vec);
  out_file.write(&excel_gacha_log).unwrap();

}
