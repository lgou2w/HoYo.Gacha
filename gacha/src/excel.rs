extern crate simple_excel_writer;

use simple_excel_writer::{Workbook, Column, Row, row};
use crate::log::GachaLogEntry;

pub fn convert_gacha_logs_to_excel(gacha_logs_vec: Vec<(&'static str, Vec<GachaLogEntry>)>) -> Vec<u8> {
  let mut work_book = Workbook::create_in_memory();

  for (name, gacha_logs) in gacha_logs_vec {
    write_excel_sheet(&mut work_book, name, &gacha_logs);
  }

  work_book
    .close()
    .expect("Close excel error")
    .unwrap()
}

fn write_excel_sheet(work_book: &mut Workbook, name: &str, gacha_logs: &Vec<GachaLogEntry>) {
  let mut sheet = work_book.create_sheet(name);
  sheet.add_column(Column { width: 22.0 });
  sheet.add_column(Column { width: 15.0 });
  sheet.add_column(Column { width: 9.0 });
  sheet.add_column(Column { width: 9.0 });
  sheet.add_column(Column { width: 9.0 });
  sheet.add_column(Column { width: 9.0 });
  work_book.write_sheet(&mut sheet, |writer| {
    // TODO: Support locale
    writer.append_row(row!["时间", "名称", "类别", "星级", "总次数", "保底内"])?;

    let mut entries = gacha_logs.clone();
    entries.reverse();

    let mut count = 0;
    let mut count_pity = 0;
    for entry in entries {
      count = count + 1;
      count_pity = count_pity + 1;

      let mut row = Row::new();
      row.add_cell(entry.time);
      row.add_cell(entry.name);
      row.add_cell(entry.item_type);
      row.add_cell(entry.rank_type.clone());
      row.add_cell(count.to_string());
      row.add_cell(count_pity.to_string());
      writer.append_row(row)?;

      if entry.rank_type.eq("5") {
        count_pity = 0;
      }
    }

    Ok(())
  }).expect("Write excel error");
}
