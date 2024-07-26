use std::any::{self, Any};
use std::fmt::{self, Display};
use std::fs::{self, File};
use std::io::{self, Write};
use std::panic::{self, PanicInfo};
use std::path::Path;
use std::process;
use std::sync::atomic::Ordering;

use backtrace::Backtrace;
use time::OffsetDateTime;
use tracing::error;

use super::internals::{TAURI_MAIN_WINDOW_HWND, TRACING_INITIALIZED};
use crate::consts;

pub fn install() {
  let crashs_dir = consts::PLATFORM
    .appdata_local
    .join(consts::ID)
    .join(consts::CRASHS_DIRECTORY);

  if !crashs_dir.exists() {
    fs::create_dir_all(&crashs_dir).expect("Failed to create crashs directory");
  }

  panic::set_hook(Box::new(move |panic| {
    Crash::collect(panic)
      .report(&crashs_dir)
      .expect("Error when reporting crash");
    process::exit(1)
  }));
}

struct Crash<'a> {
  name: &'static str,
  version: &'static str,
  cause: &'a str,
  explanation: String,
  backtrace: String,
}

impl<'a> Crash<'a> {
  #[inline]
  fn collect(panic: &'a PanicInfo) -> Self {
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
      Some(location) => format!(
        "Panic occurrecd in file '{}' at line {}",
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

    Self {
      name: consts::NAME,
      version: consts::VERSION,
      cause,
      explanation,
      backtrace,
    }
  }
}

impl<'a> Display for Crash<'a> {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.debug_map()
      .entry(&"Name", &self.name)
      .entry(&"Version", &self.version)
      .entry(&"Cause", &self.cause)
      .entry(&"Explanation", &self.explanation)
      .entry(&"Backtrace", &format_args!("\n{}", self.backtrace))
      .finish()
  }
}

impl<'a> Crash<'a> {
  #[inline]
  fn report(self, dir: impl AsRef<Path>) -> io::Result<()> {
    let datetime = OffsetDateTime::now_utc()
      .to_offset(*consts::LOCAL_OFFSET)
      .format(consts::CRASHS_TIME_FORMAT)
      .unwrap();

    let report_filename = format!("{}_Crash_Report_{datetime}.log", self.name);
    let report_path = dir.as_ref().join(&report_filename);
    let mut report_file = File::create(&report_path)?;
    writeln!(report_file, "{report_filename}\n")?;
    report_file.write_fmt(format_args!("{self:#}"))?;
    writeln!(report_file)?;
    report_file.flush()?;

    let message = format!(
      "Oops! {name} v{version} had a problem and crashed. To help us diagnose the problem you can send us a crash report.\n\nWe have generated a report file at {report_path:?}.\n\nSubmit an issue or email with the subject of \"{name} Crash Report\" and include the report as an attachment.\n\n- Homepage: {homepage}\n- Authors: {authors}\n",
      name = self.name,
      version = self.version,
      report_path = report_path,
      homepage = consts::HOMEPAGE,
      authors = consts::AUTHORS,
    );

    if TRACING_INITIALIZED.load(Ordering::Relaxed) {
      error!(
        target: consts::PKG_NAME,
        message,
        cause = ?self.cause,
        explanation = ?self.explanation,
        backtrace = %self.backtrace,
      );
    } else {
      eprintln!("{message}");
    }

    crash_notify(message, &report_path);
    Ok(())
  }
}

#[cfg(windows)]
fn crash_notify(message: String, report_path: impl AsRef<Path>) {
  let hwnd = TAURI_MAIN_WINDOW_HWND.load(Ordering::Relaxed);

  unsafe {
    use std::os::windows::process::CommandExt;
    use std::process::Command;

    use windows::core::{w, PCWSTR};
    use windows::Win32::Foundation::HWND;
    use windows::Win32::UI::WindowsAndMessaging::{
      MessageBoxW, IDYES, MB_DEFBUTTON1, MB_ICONERROR, MB_YESNO,
    };

    let lptext = message
      .encode_utf16()
      .chain(std::iter::once(0))
      .collect::<Vec<u16>>();

    if IDYES
      == MessageBoxW(
        HWND(hwnd as _),
        PCWSTR::from_raw(lptext.as_ptr()),
        w!("Application crash"),
        MB_ICONERROR | MB_YESNO | MB_DEFBUTTON1,
      )
    {
      Command::new("explorer")
        .arg("/select,")
        .raw_arg(&format!("\"{}\"", report_path.as_ref().display()))
        .spawn()
        .unwrap();
    }
  }
}

#[cfg(not(windows))]
fn crash_notify(message: String, report_path: impl AsRef<Path>) {
  // TODO: (Other platforms): crash_notify
  unimplemented!()
}
