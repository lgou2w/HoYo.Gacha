#![windows_subsystem = "console"]

extern crate clap;
extern crate chrono;
extern crate genshin;
extern crate gacha;

use std::env::current_dir;
use std::fs::File;
use std::io::{ErrorKind, Read, Write};
use std::path::PathBuf;
use clap::{arg, value_parser, ArgAction, Command};
use chrono::{Duration, Local, Utc, SecondsFormat, DateTime};

fn cli() -> Command<'static> {
  Command::new("Genshin Gacha CLI")
    .author(env!("CARGO_PKG_AUTHORS"))
    .version(env!("CARGO_PKG_VERSION"))
    .about(env!("CARGO_PKG_DESCRIPTION"))
    .subcommand_required(false)
    .subcommand(
      Command::new("url")
        .about("Get the recent gacha url")
        .arg(arg!(-p --pure "Print only gacha url").action(ArgAction::SetTrue))
    )
    .subcommand(
      Command::new("logs")
        .about("Fetch and export all gacha logs from gacha url")
        .arg(arg!(-f --format <FORMAT> "Set output format. (json, excel)"))
        .arg(arg!(-o --out <FILE> "Set output file.").value_parser(value_parser!(PathBuf)))
    )
}

fn main() {
  let matches = cli().get_matches();
  match matches.subcommand() {
    Some(("url", sub_matches)) => print_genshin_gacha_url(sub_matches.get_flag("pure")),
    Some(("logs", sub_matches)) => {
      let out_format = sub_matches.get_one::<String>("format").unwrap();
      let is_json_format = out_format.eq_ignore_ascii_case("json");
      if !is_json_format && !out_format.eq_ignore_ascii_case("excel") {
        panic!("Invalid out format: {} (Expected: json, excel)", out_format);
      }
      let out_path = sub_matches.get_one::<PathBuf>("out").unwrap();
      export_genshin_gacha_logs(
        if is_json_format { &OutFormat::Json } else { &OutFormat::Excel },
        out_path
      );
    },
    _ => {
      print_genshin_gacha_url(false);

      let now = Local::now();
      let export_time = now.format("%Y%m%d_%H%M%S");

      let current_dir = current_dir().unwrap(); // TODO: custom filename
      let out_path = current_dir.join(format!("原神祈愿记录_{}.xlsx", export_time));
      export_genshin_gacha_logs(&OutFormat::Excel, &out_path);

      // TODO: temporary
      println!("");
      println!("If you need to analyze gacha logs. You can use the link below:");
      println!("如果你需要分析祈愿记录。你可以使用下面的链接：");
      println!("");
      println!("GitHub : https://voderl.github.io/genshin-gacha-analyzer/");
      println!("Chinese: https://genshin.voderl.cn/");

      // TODO: any key
      let mut stdout = std::io::stdout();
      stdout.write(b"Press Enter to continue...").unwrap();
      stdout.flush().unwrap();
      std::io::stdin().read(&mut [0]).unwrap();
    }
  }
}

fn find_gacha_url(genshin_data_dir: PathBuf) -> (DateTime<Utc>, String) {
  match gacha::url::find_recent_gacha_url(genshin_data_dir) {
    Ok(result) => result,
    Err(error) => {
      match error.kind() {
        ErrorKind::NotFound => panic!("Gacha url not found. Please open the gacha history page in the game first!"),
        _ => panic!("{:?}", error)
      }
    }
  }
}

fn print_genshin_gacha_url(pure: bool) {
  let genshin_data_dir = genshin::get_game_data_dir_path().unwrap();
  let (creation_time, gacha_url) = find_gacha_url(genshin_data_dir);

  if pure {
    println!("{}", gacha_url);
  } else {
    let now = Local::now();
    let expire_time = (creation_time + Duration::days(1)).with_timezone(&Local);
    println!("");
    println!("Gacha url:");
    println!("Creation Time(UTC)  : {}", creation_time.to_rfc3339_opts(SecondsFormat::Millis, true));
    println!("Creation Time(Local): {}", creation_time.with_timezone(&Local).format("%Y/%m/%d %H:%M:%S"));
    println!(" Expired Time(Local): {} [Creation Time + 1 Day]", expire_time.format("%Y/%m/%d %H:%M:%S"));
    println!(" Expired: {}", now >= expire_time);
    println!("");
    println!("{}", gacha_url);
  }
}

enum OutFormat {
  Json,
  Excel
}

fn export_genshin_gacha_logs(out_format: &OutFormat, out_path: &PathBuf) {
  let genshin_data_dir = genshin::get_game_data_dir_path().unwrap();
  let (creation_time, gacha_url) = find_gacha_url(genshin_data_dir);

  let now = Local::now();
  let expire_time = (creation_time + Duration::days(1)).with_timezone(&Local);
  if now >= expire_time {
    panic!("Last gacha url has expired. Please reopen the gacha history page in the game!")
  }

  let mut out_file = File::create(out_path).unwrap();

  println!("");
  println!("Fetch gacha logs...");

  // TODO: locale
  let gacha_types = vec![(301, "角色活动祈愿"), (302, "武器活动祈愿"), (200, "常驻祈愿"), (100, "新手祈愿")];
  let mut gacha_logs_vec = Vec::new();
  for (gacha_type, name) in gacha_types.iter() {
    println!("Fetch gacha type: {} ({})", gacha_type, *name);
    let gacha_logs = gacha::log::fetch_gacha_logs(
      &gacha_url,
      &gacha_type.to_string(),
      true
    );
    gacha_logs_vec.push((*name, gacha_logs));
  }


  println!("Exporting...");
  match out_format {
    OutFormat::Json => {
      let mut gacha_logs = Vec::new();
      for (_, logs) in gacha_logs_vec {
        gacha_logs.extend(logs);
      }

      gacha::uigf::convect_gacha_logs_to_uigf(
        "Genshin Gacha",
        env!("CARGO_PKG_VERSION"),
        Some(now),
        &gacha_logs,
        true
      )
        .to_write(out_file, false)
        .expect("Write uigf failed");
    },
    OutFormat::Excel => {
      let excel_gacha_log = gacha::excel::convert_gacha_logs_to_excel(gacha_logs_vec);
      out_file
        .write(&excel_gacha_log)
        .expect("Write excel failed");
    }
  }

  println!("{:?}", out_path.as_os_str());
  println!("ok");
}
