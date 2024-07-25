use std::sync::atomic::{AtomicBool, AtomicIsize};

pub(super) static TRACING_INITIALIZED: AtomicBool = AtomicBool::new(false);

#[cfg(windows)]
pub(super) static TAURI_MAIN_WINDOW_HWND: AtomicIsize = AtomicIsize::new(0);
