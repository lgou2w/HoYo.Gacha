use std::any::{type_name_of_val, Any};
use std::fs::{create_dir_all, File};
use std::io::Write;
use std::panic;
use std::sync::atomic::{AtomicBool, Ordering};

use backtrace::Backtrace;
use time::format_description::FormatItem;
use time::macros::format_description;
use time::OffsetDateTime;
use tracing::error;
use tracing_appender::non_blocking as non_blocking_appender;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_appender::rolling::RollingFileAppender;
use tracing_subscriber::fmt::time::LocalTime;
use tracing_subscriber::fmt::writer::MakeWriterExt;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

use super::paths::appdata_local;
use crate::constants;

static TRACING_INITIALIZED: AtomicBool = AtomicBool::new(false);

pub fn initialize_tracing() -> Option<WorkerGuard> {
  if TRACING_INITIALIZED.load(Ordering::Relaxed) {
    return None;
  }

  const TRACING_TIME_FORMAT: &[FormatItem<'_>] =
    format_description!("[year]-[month]-[day] [hour]:[minute]:[second].[subsecond digits:9]");

  let filter = EnvFilter::builder()
    .from_env_lossy()
    .add_directive("hyper=error".parse().unwrap())
    .add_directive("reqwest=error".parse().unwrap())
    .add_directive("tao::platform_impl=error".parse().unwrap())
    .add_directive("wry::webview=error".parse().unwrap());

  // Use stdout in debug, otherwise use a rolling file appender
  let result = if cfg!(debug_assertions) {
    tracing_subscriber::registry()
      .with(
        tracing_subscriber::fmt::layer()
          .with_ansi(true)
          .with_line_number(true)
          .with_file(true)
          .with_thread_ids(true)
          .with_thread_names(true)
          .with_timer(LocalTime::new(TRACING_TIME_FORMAT))
          .log_internal_errors(true)
          .pretty(),
      )
      .with(filter)
      .init();

    None
  } else {
    // In release mode, flush logs to app local directory
    let logs_dir = appdata_local()
      .join(constants::ID)
      .join(constants::LOGS_DIRECTORY);

    if !logs_dir.exists() {
      create_dir_all(&logs_dir).expect("Failed to create logs directory");
    }

    let file_appender = RollingFileAppender::builder()
      .rotation(constants::LOGS_ROTATION)
      .max_log_files(constants::LOGS_MAX_FILES)
      .filename_prefix(constants::LOGS_FILE_NAME_PREFIX)
      .filename_suffix(constants::LOGS_FILE_NAME_SUFFIX)
      .build(logs_dir)
      .expect("failed to initialize rolling file appender");

    let (non_blocking, appender_guard) = non_blocking_appender(file_appender);

    tracing_subscriber::registry()
      .with(
        tracing_subscriber::fmt::layer()
          .with_ansi(false)
          .with_thread_ids(false)
          .with_thread_names(true)
          .with_timer(LocalTime::new(TRACING_TIME_FORMAT))
          .with_writer(non_blocking.and(std::io::stdout)),
      )
      .with(filter)
      .init();

    Some(appender_guard)
  };

  TRACING_INITIALIZED.store(true, Ordering::Relaxed);
  result
}

// See: https://github.com/rust-lang/rfcs/issues/1389
#[inline]
fn descript_panic(panic: &(dyn Any + Send)) -> &str {
  panic
    .downcast_ref::<&str>()
    .or(panic.downcast_ref::<String>().map(String::as_str).as_ref())
    .unwrap_or(&type_name_of_val(&panic))
}

#[cfg(windows)]
pub static mut MAIN_WINDOW_HWND: Option<isize> = None;

pub fn setup_panic_hook() {
  panic::set_hook(Box::new(|info| {
    let cause = descript_panic(info.payload());
    let explanation = match info.location() {
      None => "Panic location unknown".into(),
      Some(location) => format!(
        "Panic occurred in file '{}' at line {}",
        location.file(),
        location.line()
      ),
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

    let crashs_dir = appdata_local()
      .join(constants::ID)
      .join(constants::CRASHS_DIRECTORY);

    if !crashs_dir.exists() {
      create_dir_all(&crashs_dir).expect("Failed to create crashs directory");
    }

    const CRASHS_TIME_FORMAT: &[FormatItem<'_>] =
      format_description!("[year][month][day]_[hour][minute][second]");

    let datetime = OffsetDateTime::now_utc()
      .to_offset(*constants::CURRENT_LOCAL_OFFSET)
      .format(CRASHS_TIME_FORMAT)
      .unwrap();

    let report_name = format!("{}_Crash_Report_{datetime}.txt", constants::NAME);
    let report_path = crashs_dir.join(&report_name);
    let mut report = File::create(&report_path).expect("Failed to create crash report file");

    report
      .write_fmt(format_args!(
        r#"{report_name}

"Name"        : "{name}"
"Version"     : "{version}"
"Cause"       : "{cause}"
"Explanation" : "{explanation}"
"Backtrace"   : "
{backtrace}
"
"#,
        name = constants::NAME,
        version = constants::VERSION
      ))
      .expect("Failed to write crash report file");

    report.flush().expect("Failed to flush crash report file");

    let message = format!(
      "Oops! {name} had a problem and crashed. To help us diagnose the problem you can send us a crash report.\n\nWe have generated a report file at {report_path:?}. Submit an issue or email with the subject of \"{name} Crash Report\" and include the report as an attachment.\n\n- Homepage: {homepage}\n- Authors: {authors}\n",
      name = constants::NAME,
      homepage = constants::HOMEPAGE,
      authors = constants::AUTHORS
    );

    if TRACING_INITIALIZED.load(Ordering::Relaxed) {
      error!(
        target: env!("CARGO_PKG_NAME"),
        message,
        version = constants::VERSION,
        ?cause,
        ?explanation,
        %backtrace
      );
    } else {
      eprintln!("{message}");
    }

    #[cfg(windows)]
    unsafe {
      use windows::core::{w, PCWSTR};
      use windows::Win32::Foundation::HWND;
      use windows::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_ICONERROR, MB_OK};

      let lptext = message
        .encode_utf16()
        .chain(std::iter::once(0))
        .collect::<Vec<u16>>();

      MessageBoxW(
        MAIN_WINDOW_HWND
          .take()
          .map(|hwnd| HWND(hwnd as _))
          .unwrap_or_default(),
        PCWSTR::from_raw(lptext.as_ptr()),
        w!("Application crash"),
        MB_ICONERROR | MB_OK,
      );
    }

    std::process::exit(1)
  }));
}
