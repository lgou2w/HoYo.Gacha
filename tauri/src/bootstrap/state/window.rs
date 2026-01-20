use std::fs::{self, File};
use std::io;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, MutexGuard};

use cfg_if::cfg_if;
use serde::{Deserialize, Serialize};
use tauri::{Error as TauriError, Monitor, PhysicalPosition, PhysicalSize, WebviewWindow, Window};
use tracing::{debug, error, info};

#[derive(Clone, Debug, Default)]
pub struct WindowState(Arc<Mutex<WindowStateInner>>);

impl WindowState {
  #[inline]
  fn window_state_path() -> PathBuf {
    cfg_if! {if #[cfg(debug_assertions)] {
      PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("__DEV__HoYo.Gacha.WindowState.json")
    } else {
      constants::APP_LOCAL_DATA_DIR.join("WindowState.json")
    }}
  }

  #[inline]
  fn read(&self) -> MutexGuard<'_, WindowStateInner> {
    self.0.lock().expect("window state lock poisoned")
  }

  /// Load and evaluate the window state from the file
  #[tracing::instrument]
  pub fn load_and_evaluate(&self) {
    let path = Self::window_state_path();
    if !path.is_file() {
      return;
    }

    let state = match WindowStateInner::from_json(&path) {
      Err(err) => {
        error!(message = "Failed to load window state from file", ?err);
        WindowStateInner::default()
      }
      Ok(Err(err)) => {
        error!(message = "Failed to deserialize window state", ?err);
        let _ = fs::remove_file(&path); // Delete corrupted file
        WindowStateInner::default()
      }
      Ok(Ok(state)) => {
        info!(message = "Loaded window state from file", ?state);
        state
      }
    };

    {
      *self.read() = state;
    }
  }

  pub fn update(&self, window: &WebviewWindow) -> Result<(), TauriError> {
    let mut state = self.read();

    let minimized = window.is_minimized()?;
    state.maximized = window.is_maximized()?;

    if !state.maximized && !minimized {
      let size = window.inner_size()?;
      if size.width > 0 && size.height > 0 {
        state.width = size.width;
        state.height = size.height;
      }

      let position = window.outer_position()?;
      state.x = position.x;
      state.y = position.y;
    }

    Ok(())
  }

  pub fn intersects(&self, window: &WebviewWindow) -> Result<(), TauriError> {
    fn intersects(
      monitor: &Monitor,
      position: PhysicalPosition<i32>,
      size: PhysicalSize<u32>,
    ) -> bool {
      let PhysicalPosition { x, y } = *monitor.position();
      let PhysicalSize { width, height } = *monitor.size();

      let left = x;
      let right = x + width as i32;
      let top = y;
      let bottom = y + height as i32;

      [
        (position.x, position.y),
        (position.x + size.width as i32, position.y),
        (position.x, position.y + size.height as i32),
        (
          position.x + size.width as i32,
          position.y + size.height as i32,
        ),
      ]
      .into_iter()
      .any(|(x, y)| x >= left && x < right && y >= top && y < bottom)
    }

    let state = self.read();

    let position = PhysicalPosition {
      x: state.x,
      y: state.y,
    };

    let size = PhysicalSize {
      width: state.width,
      height: state.height,
    };

    for monitor in window.available_monitors()? {
      if intersects(&monitor, position, size) {
        window.set_position(PhysicalPosition {
          x: if state.maximized {
            state.prev_x
          } else {
            state.x
          },
          y: if state.maximized {
            state.prev_y
          } else {
            state.y
          },
        })?;
      }
    }

    window.set_size(size)?;

    if state.maximized {
      window.maximize()?;
    }

    Ok(())
  }

  pub fn save(&self) {
    let path = Self::window_state_path();
    let state = self.read();
    let ret = state.to_json(path);
    debug!("Saving window state: {ret:?}")
  }

  pub fn r#move(&self, position: &PhysicalPosition<i32>) {
    let mut state = self.read();
    state.prev_x = state.x;
    state.prev_y = state.y;
    state.x = position.x;
    state.y = position.y;
  }

  pub fn resized(&self, window: &Window, size: &PhysicalSize<u32>) {
    let is_maximized = window.is_maximized().unwrap_or_default();
    let is_minimized = window.is_minimized().unwrap_or_default();
    if !is_maximized && !is_minimized {
      let mut state = self.read();
      state.width = size.width;
      state.height = size.height;
    }
  }
}

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct WindowStateInner {
  width: u32,
  height: u32,
  x: i32,
  y: i32,
  prev_x: i32,
  prev_y: i32,
  maximized: bool,
}

impl WindowStateInner {
  #[inline]
  fn from_json<P: AsRef<Path>>(path: P) -> Result<Result<Self, serde_json::Error>, io::Error> {
    let file = File::open(path)?;
    Ok(serde_json::from_reader(file))
  }

  #[inline]
  fn to_json<P: AsRef<Path>>(&self, path: P) -> Result<Result<(), serde_json::Error>, io::Error> {
    let file = File::create(path)?;
    Ok(serde_json::to_writer(file, self))
  }
}
