#![windows_subsystem = "console"]

extern crate clap;
extern crate chrono;
extern crate genshin;
extern crate gacha;

use std::collections::HashMap;
use std::env::current_dir;
use std::fs::File;
use std::io::{ErrorKind, Read, Write};
use std::path::{Path, PathBuf};
use clap::{arg, value_parser, ArgAction, Command};
use chrono::{Duration, Local, Utc, SecondsFormat, DateTime};
use gacha::log::GachaLogEntry;
use gacha::uigf::UIGFGachaLog;

fn cli() -> Command {
  Command::new("Genshin Gacha CLI")
    .author(env!("CARGO_PKG_AUTHORS"))
    .version(env!("CARGO_PKG_VERSION"))
    .about(env!("CARGO_PKG_DESCRIPTION"))
    .allow_external_subcommands(true)
    .subcommand_required(false)
    .subcommand(
      Command::new("url")
        .about("获取最近的一个祈愿链接")
        .arg(arg!(-v --verbose "显示该祈愿链接的更多信息").action(ArgAction::SetTrue))
    )
    .subcommand(
      Command::new("logs")
        .about("从祈愿链接获取最新的记录并导出")
        .arg(arg!(-o --out <DIRECTORY> "设置输出目录")
          .value_parser(value_parser!(PathBuf))
          .required(true))
    )
}

fn main() {
  let matches = cli().get_matches();
  match matches.subcommand() {
    Some(("url", sub_matches)) => {
      let genshin_data_dir = genshin::get_game_data_dir_path().unwrap();
      let (creation_time, gacha_url) = find_gacha_url(&genshin_data_dir);
      print_genshin_gacha_url(&creation_time, &gacha_url, sub_matches.get_flag("verbose"));
    },
    Some(("logs", sub_matches)) => {
      let out_directory = sub_matches.get_one::<PathBuf>("out").unwrap();
      if !out_directory.is_dir() {
        panic!("参数 out 必须是一个目录文件夹");
      } else {
        let genshin_data_dir = genshin::get_game_data_dir_path().unwrap();
        let (creation_time, gacha_url) = find_gacha_url(&genshin_data_dir);
        let (out_time, gacha_logs_vec) = fetch_all_gacha_logs(&creation_time, &gacha_url);
        export_genshin_gacha_logs(&gacha_logs_vec, &out_time, out_directory);
      }
    },
    Some((other, _)) => {
      let input_path = Path::new(other);
      if !input_path.is_file() {
        panic!("数据合并的输入参数必须是一个文件");
      }

      let input_file = File::open(input_path).expect("无法打开文件");
      let old_data = UIGFGachaLog::from_reader(input_file)
        .expect("文件不是一个有效的 UIGF 标准祈愿 JSON 数据");

      gacha_workflow(Some(old_data));
    },
    _ => {
      gacha_workflow(None);
    }
  }
}

fn gacha_workflow(merge_data: Option<UIGFGachaLog>) {
  let genshin_data_dir = genshin::get_game_data_dir_path().unwrap();
  let (creation_time, gacha_url) = find_gacha_url(&genshin_data_dir);

  // Print url
  print_genshin_gacha_url(&creation_time, &gacha_url, true);

  // Fetch
  std::thread::sleep(std::time::Duration::from_secs(3));
  let (out_time, mut gacha_logs_vec) = fetch_all_gacha_logs(&creation_time, &gacha_url);

  // Merge
  if let Some(ref old_data) = merge_data {
    if let Some(result) = merge_gacha_logs(old_data, &gacha_logs_vec) {
      gacha_logs_vec = result;
    }
  }

  // Export
  let out_directory = current_dir().unwrap();
  export_genshin_gacha_logs(&gacha_logs_vec, &out_time, &out_directory);

  // Await exit
  let mut stdout = std::io::stdout();
  stdout.write("按回车继续...".as_bytes()).unwrap();
  stdout.flush().unwrap();
  std::io::stdin().read(&mut [0]).unwrap();
}

fn find_gacha_url(genshin_data_dir: &PathBuf) -> (DateTime<Utc>, String) {
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

fn print_genshin_gacha_url(creation_time: &DateTime<Utc>, gacha_url: &str, verbose: bool) {
  if !verbose {
    println!("{}", gacha_url);
  } else {
    let now = Local::now();
    let expire_time = (*creation_time + Duration::days(1)).with_timezone(&Local);
    println!();
    println!("祈愿链接：");
    println!("创建日期（国际）：{}", creation_time.to_rfc3339_opts(SecondsFormat::Millis, true));
    println!("创建日期（本地）：{}", creation_time.with_timezone(&Local).format("%Y/%m/%d %H:%M:%S"));
    println!("过期时间（本地）：{}【创建时间 + 1 天】", expire_time.format("%Y/%m/%d %H:%M:%S"));
    println!("是否已过期：{}", now >= expire_time);
    println!();
    println!("{}", gacha_url);
  }
}

type GachaLogsVec = Vec<(&'static str, &'static str, Vec<GachaLogEntry>)>;

fn fetch_all_gacha_logs(creation_time: &DateTime<Utc>, gacha_url: &str) -> (DateTime<Local>, GachaLogsVec) {
  let now = Local::now();
  let expire_time = (*creation_time + Duration::days(1)).with_timezone(&Local);
  if now >= expire_time {
    panic!("最新的祈愿链接已过期。请在游戏内重新打开祈愿历史记录页面！");
  }

  // TODO: locale
  let gacha_types = vec![
    ("301", "角色活动祈愿"),
    ("302", "武器活动祈愿"),
    ("200", "常驻祈愿"),
    ("100", "新手祈愿")
  ];

  println!();
  println!("获取祈愿记录中...");

  let counter_fn: Box<dyn Fn(u32) -> ()> = Box::new(|count| {
    println!("获取第 {} 页的记录...", count);
  });

  let mut gacha_logs_vec: GachaLogsVec = Vec::new();
  for (gacha_type, name) in gacha_types {
    println!("获取祈愿类型：{}（{}）", gacha_type, name);
    let gacha_logs = gacha::log::fetch_gacha_logs(&gacha_url, &gacha_type, &counter_fn);
    gacha_logs_vec.push((gacha_type, name, gacha_logs));
  }

  (now, gacha_logs_vec)
}

fn export_genshin_gacha_logs(gacha_logs_vec: &GachaLogsVec, out_time: &DateTime<Local>, out_directory: &PathBuf) {
  println!("导出记录中...");
  let time_suffix = out_time.format("%Y%m%d_%H%M%S");

  // Export UIGF JSON
  {
    let out_path = out_directory.join(format!("原神祈愿记录_UIGF_{}.json", time_suffix));
    let out_uigf_file = File::create(&out_path).unwrap();

    let mut gacha_logs = Vec::new();
    for (_, _, logs) in gacha_logs_vec {
      gacha_logs.extend(logs.clone());
    }

    gacha::uigf::gacha_logs_into_uigf(
      "Genshin Gacha",
      env!("CARGO_PKG_VERSION"),
      out_time,
      &gacha_logs
    )
      .to_writer(out_uigf_file, false)
      .expect("写 UIGF 文件错误");

    println!("JSON（UIGF）：{:?}", out_path.as_os_str());
  }

  // Export Excel
  {
    let out_path = out_directory.join(format!("原神祈愿记录_EXCEL_{}.xlsx", time_suffix));
    let filename = out_path.as_os_str().to_str().unwrap();

    let mut gacha_logs_map = Vec::new();
    for (_, name, logs) in gacha_logs_vec {
      gacha_logs_map.push((*name, logs.clone()));
    }

    gacha::excel::gacha_logs_into_excel(filename, &gacha_logs_map);
    println!("EXCEL：{:?}", out_path.as_os_str());
  }

  println!("导出完成");

  // TODO: temporary
  println!();
  println!("如果你需要分析祈愿记录。你可以使用下面的链接：");
  println!();
  println!("推荐：https://genshin.voderl.cn/");
  println!("国外：https://voderl.github.io/genshin-gacha-analyzer/");
  println!();
}

fn merge_gacha_logs(
  old_data: &UIGFGachaLog,
  new_data: &GachaLogsVec
) -> Option<GachaLogsVec> {
  println!();
  println!("合并旧数据中...");
  println!("{:#?}", old_data.info);
  println!("旧数据祈愿记录数量为：{}", old_data.list.len());

  let first_uigf_entry = old_data.list.first();
  match first_uigf_entry {
    None => return None,
    Some(first) => {
      if first.time.is_none() || first.rank_type.is_none() {
        println!("旧数据中祈愿记录没有存在 time 或 rank_type 字段！");
        println!("这是必须的字段。跳过合并...");
        return None
      }
    }
  }

  let mut result: GachaLogsVec = Vec::new();
  let uid = &old_data.info.uid;
  let lang = &old_data.info.lang;

  const BLANK: &'static str = "";
  const COUNT_1: &'static str = "1";

  // TODO: Merged code logic optimization
  for (gacha_type, name, gacha_logs) in new_data {
    let old_gacha_logs: Vec<_> = old_data.list
      .iter()
      .filter(|&entry| entry.gacha_type.eq(gacha_type))
      .collect();

    let mut old_gacha_logs_mappings = HashMap::new();
    for old_gacha_log in &old_gacha_logs {
      old_gacha_logs_mappings.insert(&old_gacha_log.id, old_gacha_log);
    }

    let mut new_gacha_logs: Vec<GachaLogEntry> = gacha_logs
      .clone()
      .into_iter()
      .filter(|entry| !old_gacha_logs_mappings.contains_key(&entry.id))
      .collect();

    for old_gacha_log in &old_gacha_logs {
      let convert = GachaLogEntry {
        uid: old_gacha_log.uid.clone().unwrap_or(uid.clone()),
        gacha_type: old_gacha_log.gacha_type.clone(),
        item_id: old_gacha_log.item_id.clone().unwrap_or(String::from(BLANK)),
        count: old_gacha_log.count.clone().unwrap_or(String::from(COUNT_1)),
        time: old_gacha_log.time.clone().unwrap(),
        name: old_gacha_log.name.clone(),
        lang: old_gacha_log.lang.clone().unwrap_or(lang.clone()),
        item_type: old_gacha_log.item_type.clone(),
        rank_type: old_gacha_log.rank_type.clone().unwrap(),
        id: old_gacha_log.id.clone()
      };
      new_gacha_logs.push(convert);
    }

    result.push((gacha_type, name, new_gacha_logs))
  }

  println!("合并成功");
  Some(result)
}
