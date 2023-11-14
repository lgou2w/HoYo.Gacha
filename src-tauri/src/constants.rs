// Important

pub const ID: &str = "com.lgou2w.hoyo.gacha";
pub const NAME: &str = "HoYo.Gacha";
pub const DATABASE: &str = "HoYo.Gacha.db";

pub const VERSION: &str = env!("CARGO_PKG_VERSION");
pub const AUTHORS: &str = env!("CARGO_PKG_AUTHORS");
pub const REPOSITORY: &str = env!("CARGO_PKG_REPOSITORY");

pub const LOGS_DIRECTORY: &str = "logs";
pub const LOGS_ROTATION: tracing_appender::rolling::Rotation =
  tracing_appender::rolling::Rotation::DAILY;
pub const LOGS_MAX_FILES: usize = 30;
pub const LOGS_FILE_NAME_PREFIX: &str = "HoYo.Gacha.";
pub const LOGS_FILE_NAME_SUFFIX: &str = ".log";

// Environment Variables

pub const ENV_DEVTOOLS: &str = "HG_DEVTOOLS";
