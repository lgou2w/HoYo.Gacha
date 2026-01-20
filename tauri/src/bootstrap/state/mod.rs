use std::sync::atomic::{AtomicBool, Ordering};

mod window;

pub use window::WindowState;

/// Mutable application state values
#[derive(Debug, Default)]
pub struct AppState {
  follow_system_theme: AtomicBool,

  // You can clone it freely because its internal is Arc.
  window_state: WindowState,
}

impl AppState {
  /// Get whether to follow the system theme
  pub fn is_follow_system_theme(&self) -> bool {
    self.follow_system_theme.load(Ordering::Relaxed)
  }

  /// Set whether to follow the system theme
  pub fn set_follow_system_theme(&self, state: bool) {
    self.follow_system_theme.store(state, Ordering::Relaxed);
  }

  /// Load and evaluate the window state
  pub fn load_and_evaluate_window_state(&self) -> Option<WindowState> {
    self.window_state.load_and_evaluate();
    Some(self.window_state.clone())
  }
}
