use std::process;

use windows::Win32::Foundation::{
  CloseHandle, ERROR_ALREADY_EXISTS, GetLastError, HANDLE, NO_ERROR,
};
use windows::Win32::System::Threading::{CreateMutexW, ReleaseMutex};
use windows::Win32::UI::WindowsAndMessaging::{
  FindWindowW, IsWindow, SW_SHOW, SetForegroundWindow, ShowWindow,
};
use windows::core::HSTRING;

use crate::consts;

pub struct Singleton {
  hmutex: HANDLE,
}

unsafe impl Send for Singleton {}

impl Drop for Singleton {
  fn drop(&mut self) {
    if !self.hmutex.is_invalid() {
      unsafe {
        let _ = ReleaseMutex(self.hmutex);
        let _ = CloseHandle(self.hmutex);
      }
    }
  }
}

impl Singleton {
  pub fn mutex() -> Self {
    let hmutex = unsafe { CreateMutexW(None, true, &HSTRING::from(consts::ID)) }
      .expect("CreateMutexW has failed");

    let error = unsafe { GetLastError() };
    if error == NO_ERROR {
      Self { hmutex }
    } else if error == ERROR_ALREADY_EXISTS {
      unsafe {
        if let Ok(hwnd) = FindWindowW(None, &HSTRING::from(consts::TAURI_MAIN_WINDOW_TITLE)) {
          if IsWindow(Some(hwnd)).as_bool() {
            let _ = ShowWindow(hwnd, SW_SHOW);
            let _ = SetForegroundWindow(hwnd);
          }
        }
      }

      println!("App instance already exists");
      process::exit(0)
    } else {
      panic!("Unexpected error: {error:?}")
    }
  }
}
