use std::fs::{self, File};
use std::io;
use std::path::{Path, PathBuf};
use std::sync::{Arc, LazyLock, Mutex, MutexGuard};

use serde::{Deserialize, Serialize};
use tauri::{Error as TauriError, Monitor, PhysicalPosition, PhysicalSize, WebviewWindow, Window};
use tracing::{debug, error, info};

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
  fn from_json(path: &Path) -> Result<Result<Self, serde_json::Error>, io::Error> {
    let file = File::open(path)?;
    Ok(serde_json::from_reader(file))
  }

  #[inline]
  fn to_json(&self, path: &Path) -> Result<Result<(), serde_json::Error>, io::Error> {
    let file = File::create(path)?;
    Ok(serde_json::to_writer(file, self))
  }
}

#[derive(Clone, Debug, Default)]
pub struct WindowState(Arc<Mutex<WindowStateInner>>);

static STATE_FILE: LazyLock<PathBuf> = LazyLock::new(|| {
  cfg_if::cfg_if! {if #[cfg(any(debug_assertions, test))] {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
      .join("__DEV__HoYo.Gacha.WindowState.json")
  } else {
    crate::constants::APP_LOCAL_DATA_DIR
      .join("WindowState.json")
  }}
});

impl WindowState {
  fn read(&self) -> MutexGuard<'_, WindowStateInner> {
    self.0.lock().expect("Window state lock poisoned")
  }

  /// Loads the window state from the file and updates the internal state.
  /// Returns `true` if the state was loaded successfully, `false` otherwise.
  pub fn load(&self) -> bool {
    if !STATE_FILE.exists() {
      return false;
    }

    let mut success = false;
    let inner = match WindowStateInner::from_json(&STATE_FILE) {
      Err(err) => {
        error!(message = "Failed to load window state from file", ?err);
        WindowStateInner::default()
      }
      Ok(Err(err)) => {
        error!(message = "Failed to deserialize window state", ?err);
        let _ = fs::remove_file(&*STATE_FILE); // Delete corrupted file
        WindowStateInner::default()
      }
      Ok(Ok(state)) => {
        info!(message = "Loaded window state from file", ?state);
        success = true;
        state
      }
    };

    {
      *self.read() = inner;
    }

    success
  }

  pub fn update(&self, window: &WebviewWindow) -> Result<(), TauriError> {
    let mut inner = self.read();

    let minimized = window.is_minimized()?;
    inner.maximized = window.is_maximized()?;

    if !inner.maximized && !minimized {
      let size = window.inner_size()?;
      if size.width > 0 && size.height > 0 {
        inner.width = size.width;
        inner.height = size.height;
      }

      let position = window.outer_position()?;
      inner.x = position.x;
      inner.y = position.y;
    }

    Ok(())
  }

  pub fn intersects(&self, window: &WebviewWindow) -> Result<(), TauriError> {
    let inner = self.read();

    let position = PhysicalPosition {
      x: inner.x,
      y: inner.y,
    };

    let size = PhysicalSize {
      width: inner.width,
      height: inner.height,
    };

    for monitor in window.available_monitors()? {
      if intersects(&monitor, position, size) {
        window.set_position(PhysicalPosition {
          x: if inner.maximized {
            inner.prev_x
          } else {
            inner.x
          },
          y: if inner.maximized {
            inner.prev_y
          } else {
            inner.y
          },
        })?;
      }
    }

    window.set_size(size)?;

    if inner.maximized {
      window.maximize()?;
    }

    Ok(())
  }

  pub fn moving(&self, position: &PhysicalPosition<i32>) {
    let mut inner = self.read();
    inner.prev_x = inner.x;
    inner.prev_y = inner.y;
    inner.x = position.x;
    inner.y = position.y;
  }

  pub fn resizing(&self, window: &Window, size: &PhysicalSize<u32>) {
    let is_maximized = window.is_maximized().unwrap_or_default();
    let is_minimized = window.is_minimized().unwrap_or_default();
    if !is_maximized && !is_minimized {
      let mut inner = self.read();
      inner.width = size.width;
      inner.height = size.height;
    }
  }

  pub fn save(&self) {
    let inner = self.read();
    let result = inner.to_json(&STATE_FILE);
    debug!(message = "Saved window state", ?result);
  }
}

fn intersects(monitor: &Monitor, position: PhysicalPosition<i32>, size: PhysicalSize<u32>) -> bool {
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
