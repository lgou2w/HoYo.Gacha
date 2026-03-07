use cfg_if::cfg_if;
use time::format_description::FormatItem;
use time::macros::format_description;
use tracing::Level;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_subscriber::EnvFilter;
use tracing_subscriber::fmt::time::LocalTime;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;

// For Unit test only
#[cfg(test)]
pub fn init_tracing() {
  Tracing::new();
}

pub struct Tracing {
  // Keep the guards to ensure logs are flushed on drop
  appenders: Option<Vec<WorkerGuard>>,
}

impl Tracing {
  pub fn new() -> Self {
    const TIME_FORMAT: &[FormatItem<'_>] =
      format_description!("[year]-[month]-[day] [hour]:[minute]:[second].[subsecond digits:5]");

    // fmt layer macro
    macro_rules! fmt {
      (ansi: $ansi:expr, writer: $writer:expr) => {
        tracing_subscriber::fmt::layer()
          .with_ansi($ansi)
          .with_line_number(true)
          .with_file(true)
          .with_thread_ids(true)
          .with_thread_names(true)
          .with_timer(LocalTime::new(TIME_FORMAT))
          .with_writer($writer)
          .log_internal_errors(true)
      };
    }

    // Set up the environment filter
    let filter = EnvFilter::builder()
      .with_default_directive(Level::TRACE.into())
      .from_env_lossy()
      .add_directive("h2=error".parse().unwrap())
      .add_directive("hyper=error".parse().unwrap())
      .add_directive("sqlx=error".parse().unwrap())
      .add_directive("tao=error".parse().unwrap())
      .add_directive("wry=error".parse().unwrap());

    // Initialize the tracing subscriber
    cfg_if! {if #[cfg(debug_assertions)] {
      // Development logging to stdout
      tracing_subscriber::registry()
        .with(filter)
        .with(fmt! { ansi: true, writer: std::io::stdout }.pretty())
        .init();

      let appenders = None;
    } else {
      // Production logging with file appenders
      use tracing_appender::non_blocking;
      use tracing_appender::rolling::{RollingFileAppender, Rotation};
      use tracing_subscriber::fmt::writer::MakeWriterExt;

      use crate::constants;

      // Log rotation settings
      const LOGS_ROTATION: Rotation = Rotation::DAILY;
      const LOGS_MAX_FILES: usize = 30;
      const LOGS_PREFIX: &str = constants::APP_NAME;
      const LOGS_SUFFIX: &str = "log";

      // Log directory
      let directory = constants::APP_LOCAL_DATA_DIR.join("Logs");

      // Create rolling file appenders
      macro_rules! rolling {
        ($directory:expr, prefix: $prefix:expr) => {
          RollingFileAppender::builder()
            .rotation(LOGS_ROTATION)
            .max_log_files(LOGS_MAX_FILES)
            .filename_suffix(LOGS_SUFFIX)
            .filename_prefix($prefix)
            .build($directory)
            .expect("Failed to initialize rolling file appender")
        };
      }
      let (debug, appender1) = non_blocking(rolling! { &directory, prefix: format!("{LOGS_PREFIX}.debug") });
      let (info , appender2) = non_blocking(rolling! { &directory, prefix: LOGS_PREFIX });

      // Set up the subscriber with multiple layers
      tracing_subscriber::registry()
        .with(filter)
        .with(fmt! { ansi: false, writer: debug.with_max_level(Level::DEBUG) }.pretty())
        .with(fmt! { ansi: false, writer: info .with_max_level(Level::INFO)  }.pretty())
        .with(fmt! { ansi: true , writer: std::io::stdout }.pretty())
        .init();

      // Keep the guards to flush logs on drop
      let appenders = Some(vec![
        appender1,
        appender2,
      ]);
    }};

    // Log that tracing has been initialized
    tracing::debug!("Tracing initialized");

    Self { appenders }
  }

  pub fn close(self) {
    // When the guards are dropped, all remaining logs are flushed
    drop(self.appenders)
  }
}
