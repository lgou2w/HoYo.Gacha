use std::mem;

use tauri::WebviewWindow;
use windows::Win32::Foundation::{BOOL, FALSE, HWND, TRUE};
use windows::Win32::Graphics::Dwm::{
  DwmExtendFrameIntoClientArea, DwmSetWindowAttribute, DWMSBT_MAINWINDOW,
  DWMWA_SYSTEMBACKDROP_TYPE, DWMWA_USE_IMMERSIVE_DARK_MODE, DWMWINDOWATTRIBUTE,
  DWM_SYSTEMBACKDROP_TYPE,
};
use windows::Win32::UI::Controls::MARGINS;

use crate::consts;

pub fn set_window_shadow(window: &WebviewWindow, enable: bool) {
  let hwnd = window.hwnd().unwrap();
  let hwnd = HWND(hwnd.0 as _);

  let v = if enable { 1 } else { 0 };
  let margins = MARGINS {
    cxLeftWidth: v,
    cxRightWidth: v,
    cyTopHeight: v,
    cyBottomHeight: v,
  };

  unsafe {
    let _ = DwmExtendFrameIntoClientArea(hwnd, &margins);
  }
}

pub fn set_window_mica(window: &WebviewWindow) {
  let hwnd = window.hwnd().unwrap();
  let hwnd = HWND(hwnd.0 as _);

  if consts::PLATFORM.windows.is_22h2_and_higher {
    unsafe {
      let _ = DwmSetWindowAttribute(
        hwnd,
        DWMWA_SYSTEMBACKDROP_TYPE as _,
        &DWMSBT_MAINWINDOW as *const _ as _,
        mem::size_of::<DWM_SYSTEMBACKDROP_TYPE>() as _,
      );
    }
  } else if consts::PLATFORM.windows.is_21h2_and_higher {
    unsafe {
      let _ = DwmSetWindowAttribute(
        hwnd,
        DWMWINDOWATTRIBUTE(1029), // DWMWA_MICA_EFFECT
        &TRUE as *const _ as _,
        mem::size_of::<BOOL>() as _,
      );
    }
  }
}

pub fn set_window_theme(window: &WebviewWindow, dark: bool) {
  let hwnd = window.hwnd().unwrap();
  let hwnd = HWND(hwnd.0 as _);

  let pvattr = if dark { TRUE } else { FALSE };
  unsafe {
    let _ = DwmSetWindowAttribute(
      hwnd,
      DWMWA_USE_IMMERSIVE_DARK_MODE,
      &pvattr as *const _ as _,
      mem::size_of::<BOOL>() as _,
    );
  }
}
