use std::sync::atomic::{AtomicBool, AtomicIsize, Ordering};

static TRACING_INITIALIZED: AtomicBool = AtomicBool::new(false);

#[inline]
pub(super) fn set_tracing_initialized(val: bool) {
  TRACING_INITIALIZED.store(val, Ordering::Relaxed);
}

#[inline]
pub fn has_tracing_initialized() -> bool {
  TRACING_INITIALIZED.load(Ordering::Relaxed)
}

#[cfg(windows)]
static TAURI_MAIN_WINDOW_HWND: AtomicIsize = AtomicIsize::new(0);

#[inline]
#[cfg(windows)]
pub(super) fn set_tauri_main_window_hwnd(val: isize) {
  TAURI_MAIN_WINDOW_HWND.store(val, Ordering::Relaxed);
}

#[inline]
#[cfg(windows)]
pub fn get_tauri_main_window_hwnd() -> isize {
  TAURI_MAIN_WINDOW_HWND.load(Ordering::Relaxed)
}
