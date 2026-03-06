use std::any::{self, Any};
use std::fmt;
use std::fs::{self, File};
use std::io::{self, Write};
use std::panic::{self, PanicHookInfo};
use std::path::{Path, PathBuf};
use std::process;

use backtrace::Backtrace;
use time::OffsetDateTime;
use time::format_description::FormatItem;
use time::format_description::well_known::Rfc3339;
use time::macros::format_description;

use crate::constants;

pub fn install() {
  // Directory to store crash reports
  //   In debug mode  : is in the tauri folder
  //   In release mode: Local data directory of the application
  const CRASHS_DIR: &str = "Crashs";
  let crashs_dir = if cfg!(debug_assertions) {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join(CRASHS_DIR)
  } else {
    constants::APP_LOCAL_DATA_DIR.join(CRASHS_DIR)
  };

  fs::create_dir_all(&crashs_dir).expect("Failed to create crash reports directory");

  // Install panic hook
  panic::set_hook(Box::new(move |panic| {
    Crash::collect(panic)
      .report(&crashs_dir)
      .expect("Error when reporting crash");
    process::exit(1)
  }));
}

struct Crash<'a> {
  cause: &'a str,
  explanation: String,
  backtrace: String,
}

impl<'a> Crash<'a> {
  fn collect(panic: &'a PanicHookInfo) -> Self {
    // See: https://github.com/rust-lang/rfcs/issues/1389
    #[inline]
    fn descript_panic(panic: &(dyn Any + Send)) -> &str {
      panic
        .downcast_ref::<&str>()
        .or(panic.downcast_ref::<String>().map(String::as_str).as_ref())
        .unwrap_or(&any::type_name_of_val(&panic))
    }

    let cause = descript_panic(panic.payload());
    let explanation = match panic.location() {
      None => "Panic location unknown".into(),
      Some(location) => {
        format!(
          "Panic occurrecd in file '{}' at line {}",
          location.file(),
          location.line()
        )
      }
    };

    const HEX_WIDTH: usize = std::mem::size_of::<usize>() + 2;
    const NEXT_SYMBOL_PADDING: usize = HEX_WIDTH + 6;

    let mut backtrace = String::new();
    for (idx, frame) in Backtrace::new().frames().iter().enumerate() {
      use std::fmt::Write;

      let ip = frame.ip();
      let _ = write!(backtrace, "\n{idx:4}: {ip:HEX_WIDTH$?}");

      let symbols = frame.symbols();
      if symbols.is_empty() {
        let _ = write!(backtrace, " - <unresolved>");
        continue;
      }

      for (idx, symbol) in symbols.iter().enumerate() {
        if idx != 0 {
          let _ = write!(backtrace, "\n{:1$}", "", NEXT_SYMBOL_PADDING);
        };

        let _ = match symbol.name() {
          None => write!(backtrace, "- <unknown>"),
          Some(name) => write!(backtrace, " - {name}"),
        };

        if let (Some(file), Some(line)) = (symbol.filename(), symbol.lineno()) {
          let _ = write!(
            backtrace,
            "\n{:3$}at {}:{}",
            "",
            file.display(),
            line,
            NEXT_SYMBOL_PADDING
          );
        }
      }
    }

    Self {
      cause,
      explanation,
      backtrace,
    }
  }
}

impl<'a> fmt::Display for Crash<'a> {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.debug_map()
      .entry(&"Cause", &self.cause)
      .entry(&"Explanation", &self.explanation)
      .entry(&"Backtrace", &format_args!("\n{}", self.backtrace))
      .finish()
  }
}

impl<'a> Crash<'a> {
  fn report(self, dir: &Path) -> io::Result<()> {
    const DATETIME_FORMAT: &[FormatItem<'_>] =
      format_description!("[year][month][day]_[hour][minute][second]");

    let report_path = {
      let now = OffsetDateTime::now_utc().to_offset(*constants::LOCAL_OFFSET);
      let report_filename = format!(
        "{appname}_Crash_Report_{datetime}.log",
        appname = constants::APP_NAME,
        datetime = now.format(&DATETIME_FORMAT).unwrap()
      );

      let report_path = dir.join(&report_filename);
      let mut report_w = File::create(&report_path)?;
      writeln!(report_w, "{report_filename}\n")?;
      writeln!(report_w, "Version: {}", constants::VERSION_WITH_PREFIX)?;
      writeln!(report_w, "Date: {}", now.format(&Rfc3339).unwrap())?;
      writeln!(report_w, "{self:#}")?;
      writeln!(report_w)?;
      report_w.flush()?;
      report_path
    };

    let message = if constants::LOCALE.get(..=1) == Some("zh") {
      format!(
        "哎呀！{name} {version} 出现问题并崩溃了。为了帮助我们诊断问题，您可以向我们发送一份崩溃报告。\n\n我们已经在 {report_path:?} 生成了一个报告文件。\n\n请提交一个主题为 “{name} 崩溃报告” 的问题或电子邮件，并将报告作为附件包含在内。\n\n- 主页：{homepage}\n- 开源：{repository}\n- 作者：{authors}\n",
        name = constants::APP_NAME,
        version = constants::VERSION_WITH_PREFIX,
        report_path = report_path,
        homepage = constants::HOMEPAGE,
        repository = constants::REPOSITORY,
        authors = constants::AUTHORS,
      )
    } else {
      format!(
        "Oops! {name} {version} had a problem and crashed. To help us diagnose the problem you can send us a crash report.\n\nWe have generated a report file at {report_path:?}.\n\nSubmit an issue or email with the subject of \"{name} Crash Report\" and include the report as an attachment.\n\n- Homepage: {homepage}\n- GitHub: {repository}\n- Authors: {authors}\n",
        name = constants::APP_NAME,
        version = constants::VERSION_WITH_PREFIX,
        report_path = report_path,
        homepage = constants::HOMEPAGE,
        repository = constants::REPOSITORY,
        authors = constants::AUTHORS,
      )
    };

    // Log the crash report
    if tracing::dispatcher::has_been_set() {
      tracing::error!(
        message,
        cause = ?self.cause,
        explanation = ?self.explanation,
        backtrace = %self.backtrace
      );
    } else {
      println!("{message}");
    }

    #[cfg(windows)]
    if hg_ffi::crash_msgbox(&message) {
      let _ = hg_ffi::open_with_explorer(report_path);
    }

    Ok(())
  }
}
