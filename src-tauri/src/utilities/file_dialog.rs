use rfd::AsyncFileDialog;

use crate::bootstrap::internals;

pub fn create() -> AsyncFileDialog {
  let mut rfd = AsyncFileDialog::new();

  #[cfg(windows)]
  {
    use std::num::NonZeroIsize;

    use raw_window_handle::{
      DisplayHandle, HandleError, HasDisplayHandle, HasWindowHandle, RawWindowHandle,
      Win32WindowHandle, WindowHandle,
    };

    struct MyWindowHandle(isize);

    impl HasWindowHandle for MyWindowHandle {
      fn window_handle(&self) -> Result<WindowHandle<'_>, HandleError> {
        let hwnd = NonZeroIsize::new(self.0).unwrap();
        let raw_window_handle = RawWindowHandle::Win32(Win32WindowHandle::new(hwnd));
        let window_handle = unsafe { WindowHandle::borrow_raw(raw_window_handle) };
        Ok(window_handle)
      }
    }

    impl HasDisplayHandle for MyWindowHandle {
      fn display_handle(&self) -> Result<DisplayHandle<'_>, HandleError> {
        Ok(DisplayHandle::windows())
      }
    }

    let hwnd = internals::get_tauri_main_window_hwnd();
    if hwnd != 0 {
      rfd = rfd.set_parent(&MyWindowHandle(hwnd));
    }
  }

  rfd
}
