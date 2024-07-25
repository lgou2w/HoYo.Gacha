use std::sync::atomic::Ordering;

use tracing::info;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_appender::rolling::RollingFileAppender;
use tracing_subscriber::fmt::time::LocalTime;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

use super::internals::TRACING_INITIALIZED;
use crate::consts;

pub struct Tracing {
  file_appender: Option<WorkerGuard>,
}

impl Tracing {
  pub fn initialize() -> Self {
    if TRACING_INITIALIZED.load(Ordering::Relaxed) {
      panic!("Tracing has already been initialized")
    }

    let filter = EnvFilter::builder()
      .from_env_lossy()
      .add_directive("hyper=error".parse().unwrap())
      .add_directive("reqwest=error".parse().unwrap())
      .add_directive("tao::platform_impl=error".parse().unwrap())
      .add_directive("wry::webview=error".parse().unwrap());

    let file_appender = if cfg!(any(debug_assertions, test)) {
      tracing_subscriber::registry()
        .with(
          tracing_subscriber::fmt::layer()
            .with_ansi(true)
            .with_line_number(true)
            .with_file(true)
            .with_thread_ids(true)
            .with_thread_names(true)
            .with_timer(LocalTime::new(consts::TRACING_TIME_FORMAT))
            .log_internal_errors(true)
            .pretty(),
        )
        .with(filter)
        .init();

      None
    } else {
      let logs_dir = consts::APPDATA_LOCAL
        .join(consts::ID)
        .join(consts::TRACING_LOGS_DIRECTORY);

      let file_appender = RollingFileAppender::builder()
        .rotation(consts::TRACING_LOGS_ROTATION)
        .max_log_files(consts::TRACING_LOGS_MAX_FILES)
        .filename_prefix(consts::TRACING_LOGS_FILE_NAME_PREFIX)
        .filename_suffix(consts::TRACING_LOGS_FILE_NAME_SUFFIX)
        .build(logs_dir)
        .expect("Failed to initialize rolling file appender");

      let (non_blocking, appender_guard) = tracing_appender::non_blocking(file_appender);

      tracing_subscriber::registry()
        .with(
          tracing_subscriber::fmt::layer()
            .with_ansi(false)
            .with_line_number(true)
            .with_file(true)
            .with_thread_ids(true)
            .with_thread_names(true)
            .with_timer(LocalTime::new(consts::TRACING_TIME_FORMAT))
            .log_internal_errors(true)
            .with_writer(non_blocking)
            .pretty(),
        )
        .with(filter)
        .init();

      Some(appender_guard)
    };

    info!("Tracing initialized");
    TRACING_INITIALIZED.store(true, Ordering::Relaxed);
    Self { file_appender }
  }

  #[tracing::instrument(skip(self))]
  pub fn close(self) {
    info!("bye!");
    drop(self.file_appender)
  }
}
