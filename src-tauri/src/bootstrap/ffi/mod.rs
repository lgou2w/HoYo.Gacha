#[cfg(windows)]
#[path = "windows.rs"]
mod platform;

pub use platform::*;
