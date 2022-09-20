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
        .about("获取最近的一个祈愿链接")
        .arg(arg!(-v --verbose "显示该祈愿链接的更多信息").action(ArgAction::SetTrue))
    )
    .subcommand(
      Command::new("logs")
        .about("从祈愿链接获取最新的记录并导出")
        .arg(arg!(-o --out <DIRECTORY> "设置输出目录").value_parser(value_parser!(PathBuf)))
    )
}

fn main() {
  let matches = cli().get_matches();
  match matches.subcommand() {
    Some(("url", sub_matches)) => print_genshin_gacha_url(sub_matches.get_flag("verbose")),
    Some(("logs", sub_matches)) => {
      let out_directory = sub_matches.get_one::<PathBuf>("out").unwrap();
      if !out_directory.is_dir() {
        panic!("参数 out 必须是一个目录文件夹");
      } else {
        export_genshin_gacha_logs(out_directory);
      }
    },
    _ => {
      print_genshin_gacha_url(true);

      let current_dir = current_dir().unwrap();
      export_genshin_gacha_logs(&current_dir);

      // TODO: temporary
      println!();
      println!("如果你需要分析祈愿记录。你可以使用下面的链接：");
      println!();
      println!("推荐：https://genshin.voderl.cn/");
      println!("国外：https://voderl.github.io/genshin-gacha-analyzer/");

      let mut stdout = std::io::stdout();
      stdout.write("按回车继续...".as_bytes()).unwrap();
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
        ErrorKind::NotFound => panic!("祈愿链接未找到。请先在游戏内打开祈愿历史记录页面！"),
        _ => panic!("{:?}", error)
      }
    }
  }
}

fn print_genshin_gacha_url(verbose: bool) {
  let genshin_data_dir = genshin::get_game_data_dir_path().unwrap();
  let (creation_time, gacha_url) = find_gacha_url(genshin_data_dir);

  if !verbose {
    println!("{}", gacha_url);
  } else {
    let now = Local::now();
    let expire_time = (creation_time + Duration::days(1)).with_timezone(&Local);
    println!();
    println!("祈愿链接:");
    println!("创建日期（国际）：{}", creation_time.to_rfc3339_opts(SecondsFormat::Millis, true));
    println!("创建日期（本地）：{}", creation_time.with_timezone(&Local).format("%Y/%m/%d %H:%M:%S"));
    println!("过期时间（本地）：{}【创建时间 + 1 天】", expire_time.format("%Y/%m/%d %H:%M:%S"));
    println!("是否已过期：{}", now >= expire_time);
    println!();
    println!("{}", gacha_url);
  }
}

fn export_genshin_gacha_logs(out_directory: &PathBuf) {
  let genshin_data_dir = genshin::get_game_data_dir_path().unwrap();
  let (creation_time, gacha_url) = find_gacha_url(genshin_data_dir);

  let now = Local::now();
  let expire_time = (creation_time + Duration::days(1)).with_timezone(&Local);
  if now >= expire_time {
    panic!("最新的祈愿链接已过期。请在游戏内重新打开祈愿历史记录页面！")
  }

  println!();
  println!("获取祈愿记录中...");

  // TODO: locale
  let gacha_types = vec![(301, "角色活动祈愿"), (302, "武器活动祈愿"), (200, "常驻祈愿"), (100, "新手祈愿")];
  let mut gacha_logs_vec: Vec<(&str, Vec<gacha::log::GachaLogEntry>)> = Vec::new();
  for (gacha_type, name) in gacha_types {
    println!("获取祈愿类型：{}（{}）", gacha_type, name);
    let gacha_logs = gacha::log::fetch_gacha_logs(
      &gacha_url,
      &gacha_type.to_string(),
      true
    );
    gacha_logs_vec.push((name, gacha_logs));
  }

  println!("导出记录中...");
  let time_suffix =  now.format("%Y%m%d_%H%M%S");

  // Export UIGF JSON
  {
    let out_path = &out_directory.join(format!("原神祈愿记录_UIGF_{}.json", time_suffix));
    let out_uigf_file = File::create(out_path).unwrap();

    let mut gacha_logs = Vec::new();
      for (_, logs) in &gacha_logs_vec {
        gacha_logs.extend(logs.clone());
      }

    gacha::uigf::convect_gacha_logs_to_uigf(
      "Genshin Gacha",
      env!("CARGO_PKG_VERSION"),
      Some(now),
      &gacha_logs,
      true
    )
      .to_write(out_uigf_file, false)
      .expect("写 UIGF 文件错误");

    println!("JSON（UIGF）：{:?}", out_path.as_os_str());
  }

  // Export Excel
  {
    let out_path = &out_directory.join(format!("原神祈愿记录_EXCEL_{}.xlsx", time_suffix));
    let mut out_excel_file = File::create(out_path).unwrap();

    let excel_gacha_log = gacha::excel::convert_gacha_logs_to_excel(&gacha_logs_vec);
    out_excel_file
      .write(&excel_gacha_log)
      .expect("写 EXCEL 文件错误");

    println!("EXCEL：{:?}", out_path.as_os_str());
  }

  println!("完成");
}
