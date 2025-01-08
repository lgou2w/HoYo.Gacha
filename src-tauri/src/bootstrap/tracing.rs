use tracing::info;
use tracing::level_filters::LevelFilter;
use tracing_appender::non_blocking::WorkerGuard;
use tracing_appender::rolling::RollingFileAppender;
use tracing_subscriber::fmt::time::LocalTime;
use tracing_subscriber::layer::SubscriberExt;
use tracing_subscriber::util::SubscriberInitExt;
use tracing_subscriber::EnvFilter;

use super::internals;
use crate::consts;

pub struct Tracing {
  file_appender: Option<WorkerGuard>,
}

impl Tracing {
  pub fn initialize() -> Self {
    if internals::has_tracing_initialized() {
      panic!("Tracing has already been initialized")
    }

    let filter = EnvFilter::builder()
      .with_default_directive(if cfg!(debug_assertions) {
        LevelFilter::TRACE.into()
      } else {
        LevelFilter::INFO.into()
      })
      .from_env_lossy()
      .add_directive("hyper=error".parse().unwrap())
      .add_directive("reqwest=error".parse().unwrap())
      .add_directive("tao::platform_impl=error".parse().unwrap())
      .add_directive("wry::webview=error".parse().unwrap());

    macro_rules! fmt {
      ($ansi:expr, $writer:expr) => {
        tracing_subscriber::fmt::layer()
          .with_ansi($ansi)
          .with_line_number(true)
          .with_file(true)
          .with_thread_ids(true)
          .with_thread_names(true)
          .with_timer(LocalTime::new(consts::TRACING_TIME_FORMAT))
          .with_writer($writer)
          .log_internal_errors(true)
      };
    }

    let file_appender = if cfg!(any(debug_assertions, test)) {
      tracing_subscriber::registry()
        .with(filter)
        .with(fmt! { true, std::io::stdout }.pretty())
        .init();

      None
    } else {
      let file_appender = RollingFileAppender::builder()
        .rotation(consts::TRACING_LOGS_ROTATION)
        .max_log_files(consts::TRACING_LOGS_MAX_FILES)
        .filename_prefix(consts::TRACING_LOGS_FILE_NAME_PREFIX)
        .filename_suffix(consts::TRACING_LOGS_FILE_NAME_SUFFIX)
        .build(
          consts::PLATFORM
            .appdata_local
            .join(consts::ID)
            .join(consts::TRACING_LOGS_DIRECTORY),
        )
        .expect("Failed to initialize rolling file appender");

      let (non_blocking, appender_guard) = tracing_appender::non_blocking(file_appender);

      tracing_subscriber::registry()
        .with(filter)
        .with(fmt! { false, non_blocking })
        .with(fmt! { true, std::io::stdout }.pretty())
        .init();

      Some(appender_guard)
    };

    info!("Tracing initialized");
    internals::set_tracing_initialized(true);

    Self { file_appender }
  }

  #[tracing::instrument(skip(self))]
  pub fn close(self) {
    info!("bye!");
    drop(self.file_appender)
  }
}
