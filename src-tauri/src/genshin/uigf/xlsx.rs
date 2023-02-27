extern crate lazy_static;
extern crate xlsxwriter;

use std::collections::HashMap;
use lazy_static::lazy_static;
use xlsxwriter::{FormatAlignment, FormatColor, Workbook, XlsxError};
use super::convert::GACHA_TYPE_UIGF_MAPPINGS;
use crate::genshin::official::model::{
  GachaType,
  GachaItemType,
  GachaLogItem,
  GACHA_ITEM_TYPE_CHARACTER,
  GACHA_ITEM_TYPE_WEAPON
};

/* https://uigf.org/standards/UIGF.html#excel-%E5%B7%A5%E4%BD%9C%E7%B0%BF-workbook-format */

type SheetFilterFn = Box<dyn (Fn(&GachaLogItem) -> bool) + Send + Sync>;

lazy_static! {
  static ref SHEETS: Vec<(&'static str, SheetFilterFn)> = {
    vec![
      ("角色活动祈愿", Box::new(|v|
        v.gacha_type.eq(&GachaType::CharacterEvent) ||
        v.gacha_type.eq(&GachaType::CharacterEvent2))
      ),
      ("武器活动祈愿", Box::new(|v| v.gacha_type.eq(&GachaType::WeaponEvent))),
      ("常驻祈愿", Box::new(|v| v.gacha_type.eq(&GachaType::Permanent))),
      ("新手祈愿", Box::new(|v| v.gacha_type.eq(&GachaType::Newbie))),
    ]
  };

  static ref SHEET_GACHA_TYPES: HashMap<u32, &'static str> = {
    let mut m = HashMap::with_capacity(5);
    m.insert(GachaType::Newbie          as u32, "新手祈愿");
    m.insert(GachaType::Permanent       as u32, "常驻祈愿");
    m.insert(GachaType::CharacterEvent  as u32, "角色活动祈愿");
    m.insert(GachaType::WeaponEvent     as u32, "武器活动祈愿");
    m.insert(GachaType::CharacterEvent2 as u32, "角色活动祈愿-2");
    m
  };
}

pub fn write_to_excel(
  gacha_logs: &[GachaLogItem],
  filename: &str
) -> Result<(), XlsxError> {
  let mut excel = Workbook::new(filename)?;
  for (name, filter) in SHEETS.iter() {
    let items: Vec<&GachaLogItem> = gacha_logs
      .iter()
      .filter(|v| filter(v))
      .collect();
    write_excel_sheet(&mut excel, &items, name)?;
  }
  write_excel_sheet_raw(&mut excel, gacha_logs, RAW)?;
  excel.close()?;
  Ok(())
}

const RAW: &str = "原始数据";
const FONT: &str = "微软雅黑";

const H_TIME      : &str = "时间";
const H_NAME      : &str = "名称";
const H_ITEM_TYPE : &str = "类别";
const H_RANK_TYPE : &str = "星级";
const H_GACHA_TYPE: &str = "祈愿类型";
const H_COUNT     : &str = "总次数";
const H_GOLD_PITY : &str = "保底内";

fn write_excel_sheet(
  excel: &mut Workbook,
  items: &[&GachaLogItem],
  name: &str
) -> Result<(), XlsxError> {
  let mut sheet = excel.add_worksheet(Some(name))?;

  let format_column = excel
    .add_format()
    .set_align(FormatAlignment::Center)
    .set_font_name(FONT);

  sheet.set_column(0, 0, 22.0, Some(&format_column))?;
  sheet.set_column(1, 1, 15.0, Some(&format_column))?;
  sheet.set_column(2, 3, 9.0, Some(&format_column))?;
  sheet.set_column(4, 4, 16.0, Some(&format_column))?;
  sheet.set_column(5, 6, 9.0, Some(&format_column))?;

  let format_header = excel
    .add_format()
    .set_bold()
    .set_font_size(12.0)
    .set_font_name(FONT)
    .set_align(FormatAlignment::Center);

  sheet.write_string(0, 0, H_TIME, Some(&format_header))?;
  sheet.write_string(0, 1, H_NAME, Some(&format_header))?;
  sheet.write_string(0, 2, H_ITEM_TYPE, Some(&format_header))?;
  sheet.write_string(0, 3, H_RANK_TYPE, Some(&format_header))?;
  sheet.write_string(0, 4, H_GACHA_TYPE, Some(&format_header))?;
  sheet.write_string(0, 5, H_COUNT, Some(&format_header))?;
  sheet.write_string(0, 6, H_GOLD_PITY, Some(&format_header))?;

  let format_rank4 = excel
    .add_format()
    .set_bold()
    .set_align(FormatAlignment::Center)
    .set_font_color(FormatColor::Custom(0xA256E1))
    .set_font_name(FONT);

  let format_rank5 = excel
    .add_format()
    .set_bold()
    .set_align(FormatAlignment::Center)
    .set_font_color(FormatColor::Custom(0xBD6932))
    .set_font_name(FONT);

  let mut row: u32 = 1;
  let mut count: u32 = 0;
  let mut gold_pity: u32 = 0;

  for item in items {
    let is_rank5 = item.rank_type.eq("5");
    let format = if item.rank_type.eq("4") {
      Some(&format_rank4)
    } else if is_rank5 {
      Some(&format_rank5)
    } else {
      None
    };

    count += 1;
    gold_pity += 1;

    let item_type = if item.item_type.eq(&GachaItemType::Character) {
      GACHA_ITEM_TYPE_CHARACTER
    } else {
      GACHA_ITEM_TYPE_WEAPON
    };

    let gacha_type = *SHEET_GACHA_TYPES
      .get(&(item.gacha_type as u32))
      .unwrap();

    sheet.write_string(row, 0, &item.time, format)?;
    sheet.write_string(row, 1, &item.name, format)?;
    sheet.write_string(row, 2, item_type, format)?;
    sheet.write_string(row, 3, &item.rank_type, format)?;
    sheet.write_string(row, 4, gacha_type, format)?;
    sheet.write_string(row, 5, &count.to_string(), format)?;
    sheet.write_string(row, 6, &gold_pity.to_string(), format)?;

    if is_rank5 {
      gold_pity = 0;
    }

    row += 1;
  }

  Ok(())
}

fn write_excel_sheet_raw(
  excel: &mut Workbook,
  items: &[GachaLogItem],
  name: &str
) -> Result<(), XlsxError> {
  let mut sheet = excel.add_worksheet(Some(name))?;
  let format = excel.add_format()
    .set_align(FormatAlignment::Center)
    .set_font_name(FONT);

  sheet.set_column(0, 0, 9.0, Some(&format))?;
  sheet.set_column(1, 1, 12.0, Some(&format))?;
  sheet.set_column(2, 2, 25.0, Some(&format))?;
  sheet.set_column(3, 5, 12.0, Some(&format))?;
  sheet.set_column(6, 6, 15.0, Some(&format))?;
  sheet.set_column(7, 7, 12.0, Some(&format))?;
  sheet.set_column(8, 8, 22.0, Some(&format))?;
  sheet.set_column(9, 9, 15.0, Some(&format))?;
  sheet.set_column(10, 10, 20.0, Some(&format))?;

  sheet.write_string(0, 0, "count", None)?;
  sheet.write_string(0, 1, "gacha_type", None)?;
  sheet.write_string(0, 2, "id", None)?;
  sheet.write_string(0, 3, "item_id", None)?;
  sheet.write_string(0, 4, "item_type", None)?;
  sheet.write_string(0, 5, "lang", None)?;
  sheet.write_string(0, 6, "name", None)?;
  sheet.write_string(0, 7, "rank_type", None)?;
  sheet.write_string(0, 8, "time", None)?;
  sheet.write_string(0, 9, "uid", None)?;
  sheet.write_string(0, 10, "uigf_gacha_type", None)?;

  let mut row: u32 = 1;

  for item in items {
    let item_type = if item.item_type.eq(&GachaItemType::Character) {
      GACHA_ITEM_TYPE_CHARACTER
    } else {
      GACHA_ITEM_TYPE_WEAPON
    };

    let gacha_type = item.gacha_type as u32;
    let uigf_gacha_type = GACHA_TYPE_UIGF_MAPPINGS
      .get(&gacha_type)
      .unwrap();

    sheet.write_string(row, 0, &item.count, None)?;
    sheet.write_string(row, 1, gacha_type.to_string().as_str(), None)?;
    sheet.write_string(row, 2, &item.id, None)?;
    sheet.write_string(row, 3, &item.item_id, None)?;
    sheet.write_string(row, 4, item_type, None)?;
    sheet.write_string(row, 5, &item.lang, None)?;
    sheet.write_string(row, 6, &item.name, None)?;
    sheet.write_string(row, 7, &item.rank_type, None)?;
    sheet.write_string(row, 8, &item.time, None)?;
    sheet.write_string(row, 9, &item.uid, None)?;
    sheet.write_string(row, 10, uigf_gacha_type, None)?;
    row += 1;
  }

  Ok(())
}
