extern crate xlsxwriter;

use xlsxwriter::{Workbook, FormatAlignment, FormatColor, XlsxError};
use crate::log::GachaLogEntry;

pub fn convert_gacha_logs_to_excel(filename: &str, gacha_logs_vec: &Vec<(&str, Vec<GachaLogEntry>)>) {
  let work_book = Workbook::new(filename);
  for entry in gacha_logs_vec {
    write_excel_sheet(&work_book, entry.0, &entry.1)
      .expect("Write excel sheet failed");
  }
  work_book
    .close()
    .expect("Write excel failed");
}

// TODO: Locale

fn write_excel_sheet(work_book: &Workbook, name: &str, gacha_logs: &Vec<GachaLogEntry>) -> Result<(), XlsxError> {
  let mut sheet = work_book.add_worksheet(Some(name))?;

  // Column
  let format_column = work_book
    .add_format()
    .set_align(FormatAlignment::Center)
    .set_font_name("微软雅黑");

  sheet.set_column(0, 0, 22.0, Some(&format_column))?;
  sheet.set_column(1, 1, 15.0, Some(&format_column))?;
  sheet.set_column(2, 6, 9.0, Some(&format_column))?;

  // Header
  let format_header = work_book
    .add_format()
    .set_bold()
    .set_font_size(12.0)
    .set_font_name("微软雅黑")
    .set_align(FormatAlignment::Center);

  sheet.write_string(0, 0, "时间", Some(&format_header))?;
  sheet.write_string(0, 1, "名称", Some(&format_header))?;
  sheet.write_string(0, 2, "类别", Some(&format_header))?;
  sheet.write_string(0, 3, "星级", Some(&format_header))?;
  sheet.write_string(0, 4, "总次数", Some(&format_header))?;
  sheet.write_string(0, 5, "保底内", Some(&format_header))?;
  sheet.write_string(0, 6, "备注", Some(&format_header))?;

  // Logs

  // Rank format
  let format_rank4 = work_book
    .add_format()
    .set_bold()
    .set_align(FormatAlignment::Center)
    .set_font_color(FormatColor::Custom(0xA256E1))
    .set_font_name("微软雅黑");
  let format_rank5 = work_book
    .add_format()
    .set_bold()
    .set_align(FormatAlignment::Center)
    .set_font_color(FormatColor::Custom(0xBD6932))
    .set_font_name("微软雅黑");

  // Reverse gacha logs
  let mut entries = gacha_logs.clone();
  entries.reverse();

  let mut row: u32 = 1;
  let mut count: u32 = 0;
  let mut count_pity: u32 = 0;

  for entry in entries {
    let is_rank5 = entry.rank_type.eq("5");
    let format = if entry.rank_type.eq("4") {
      Some(&format_rank4)
    } else if is_rank5 {
      Some(&format_rank5)
    } else {
      None
    };

    count = count + 1;
    count_pity = count_pity + 1;

    sheet.write_string(row, 0, &entry.time, format)?;
    sheet.write_string(row, 1, &entry.name, format)?;
    sheet.write_string(row, 2, &entry.item_type, format)?;
    sheet.write_string(row, 3, &entry.rank_type, format)?;
    sheet.write_string(row, 4, &count.to_string(), format)?;
    sheet.write_string(row, 5, &count_pity.to_string(), format)?;

    if entry.gacha_type.eq("400") {
      sheet.write_string(row, 6, "祈愿-2", format)?;
    }

    if is_rank5 {
      count_pity = 0;
    }

    row = row + 1;
  }

  Ok(())
}
