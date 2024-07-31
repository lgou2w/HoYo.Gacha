use std::mem;

use tauri::{Theme, WebviewWindow};
use webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2_13;
use webview2_com::Microsoft::Web::WebView2::Win32::{
  COREWEBVIEW2_PREFERRED_COLOR_SCHEME_DARK, COREWEBVIEW2_PREFERRED_COLOR_SCHEME_LIGHT,
};
use windows::core::w;
use windows::core::Interface;
use windows::Win32::Foundation::{BOOL, FALSE, HANDLE, TRUE};
use windows::Win32::Graphics::Dwm::{
  DwmExtendFrameIntoClientArea, DwmSetWindowAttribute, DWMSBT_MAINWINDOW,
  DWMWA_SYSTEMBACKDROP_TYPE, DWMWA_USE_IMMERSIVE_DARK_MODE, DWMWINDOWATTRIBUTE,
  DWM_SYSTEMBACKDROP_TYPE,
};
use windows::Win32::System::Console::{AttachConsole, ATTACH_PARENT_PROCESS};
use windows::Win32::UI::Controls::MARGINS;
use windows::Win32::UI::WindowsAndMessaging::SetPropW;

use crate::consts;

// Ensure that you can see the std output when start the app from the command line
// https://github.com/rust-lang/rust/issues/67159#issuecomment-987882771
pub fn attach_console() {
  unsafe {
    let _ = AttachConsole(ATTACH_PARENT_PROCESS);
  }
}

pub fn set_window_shadow(window: &WebviewWindow, enable: bool) {
  let hwnd = window.hwnd().unwrap();

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

pub fn set_window_vibrancy(window: &WebviewWindow) {
  let hwnd = window.hwnd().unwrap();

  if consts::WINDOWS.is_22h2_and_higher {
    unsafe {
      let _ = DwmSetWindowAttribute(
        hwnd,
        DWMWA_SYSTEMBACKDROP_TYPE as _,
        &DWMSBT_MAINWINDOW as *const _ as _,
        mem::size_of::<DWM_SYSTEMBACKDROP_TYPE>() as _,
      );
    }
  } else if consts::WINDOWS.is_21h2_and_higher {
    unsafe {
      let _ = DwmSetWindowAttribute(
        hwnd,
        DWMWINDOWATTRIBUTE(1029), // DWMWA_MICA_EFFECT
        &TRUE as *const _ as _,
        mem::size_of::<BOOL>() as _,
      );
    }
  } else {
    // TODO: Windows 10
  }
}

pub fn set_window_theme(window: &WebviewWindow, color_scheme: Theme) {
  let hwnd = window.hwnd().unwrap();
  let dark = if matches!(color_scheme, Theme::Dark) {
    TRUE
  } else {
    FALSE
  };

  if consts::WINDOWS.is_19h1_and_higher {
    unsafe {
      let _ = DwmSetWindowAttribute(
        hwnd,
        DWMWA_USE_IMMERSIVE_DARK_MODE,
        &dark as *const _ as _,
        mem::size_of::<BOOL>() as _,
      );
    }
  } else {
    let mut dark: i32 = dark.0;
    unsafe {
      let _ = SetPropW(
        hwnd,
        w!("UseImmersiveDarkModeColors"),
        HANDLE(&mut dark as *mut _ as _),
      );
    }
  }
}

pub fn set_webview_theme(window: &WebviewWindow, color_scheme: Theme) -> tauri::Result<()> {
  window.with_webview(move |webview| {
    let color_scheme = if matches!(color_scheme, Theme::Dark) {
      COREWEBVIEW2_PREFERRED_COLOR_SCHEME_DARK
    } else {
      COREWEBVIEW2_PREFERRED_COLOR_SCHEME_LIGHT
    };

    unsafe {
      let _ = webview
        .controller()
        .CoreWebView2()
        .unwrap()
        .cast::<ICoreWebView2_13>()
        .unwrap()
        .Profile()
        .unwrap()
        .SetPreferredColorScheme(color_scheme);
    }
  })
}
