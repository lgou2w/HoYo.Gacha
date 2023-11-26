#![cfg(windows)]

use raw_window_handle::{HasRawWindowHandle, RawWindowHandle};
use windows::Win32::Foundation::HWND;
use windows::Win32::Graphics::Dwm::DwmExtendFrameIntoClientArea;
use windows::Win32::System::Com::{CoCreateInstance, CLSCTX_SERVER};
use windows::Win32::UI::Controls::MARGINS;
use windows::Win32::UI::Shell::{
  ITaskbarList4, TaskbarList, TBPF_ERROR, TBPF_INDETERMINATE, TBPF_NOPROGRESS, TBPF_NORMAL,
  TBPF_PAUSED,
};

pub fn set_window_shadow(window: impl HasRawWindowHandle, enable: bool) {
  if let RawWindowHandle::Win32(handle) = window.raw_window_handle() {
    let m = if enable { 1 } else { 0 };
    let margins = MARGINS {
      cyTopHeight: m,
      cxRightWidth: m,
      cyBottomHeight: m,
      cxLeftWidth: m,
    };

    unsafe {
      let _ = DwmExtendFrameIntoClientArea(HWND(handle.hwnd as _), &margins);
    }
  }
}

pub enum ProgressState {
  None,
  Normal,
  Indeterminate,
  #[allow(unused)]
  Paused,
  #[allow(unused)]
  Error,
}

pub fn set_progress_bar(
  window: impl HasRawWindowHandle,
  state: ProgressState,
  progress: Option<u64>,
) {
  if let RawWindowHandle::Win32(handle) = window.raw_window_handle() {
    let tbpflag = match state {
      ProgressState::None => TBPF_NOPROGRESS,
      ProgressState::Normal => TBPF_NORMAL,
      ProgressState::Indeterminate => TBPF_INDETERMINATE,
      ProgressState::Paused => TBPF_PAUSED,
      ProgressState::Error => TBPF_ERROR,
    };

    unsafe {
      let hwnd = HWND(handle.hwnd as _);
      let taskbar_list: ITaskbarList4 =
        CoCreateInstance(&TaskbarList, None, CLSCTX_SERVER).unwrap();

      taskbar_list.SetProgressState(hwnd, tbpflag).unwrap_or(());

      if let Some(value) = progress {
        let value = if value > 100 { 100 } else { value };
        taskbar_list
          .SetProgressValue(hwnd, value, 100)
          .unwrap_or(());
      }
    }
  }
}

// use std::ptr::null_mut;

// use tauri::Window;
// use webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2_13;
// use webview2_com::Microsoft::Web::WebView2::Win32::{
//   COREWEBVIEW2_PREFERRED_COLOR_SCHEME_DARK, COREWEBVIEW2_PREFERRED_COLOR_SCHEME_LIGHT,
// };
// use windows::core::Interface;
// use windows_sys::w;
// use windows_sys::Win32::System::Registry::{
//   RegOpenKeyExW, RegQueryValueExW, HKEY, HKEY_CURRENT_USER, KEY_READ,
// };

// pub fn set_webview_theme(window: &Window, dark: bool) {
//   let _ = window.with_webview(move |platform| unsafe {
//     let webview = platform.controller().CoreWebView2().unwrap();
//     let _ = webview
//       .cast::<ICoreWebView2_13>()
//       .unwrap()
//       .Profile()
//       .unwrap()
//       .SetPreferredColorScheme(match dark {
//         true => COREWEBVIEW2_PREFERRED_COLOR_SCHEME_DARK,
//         false => COREWEBVIEW2_PREFERRED_COLOR_SCHEME_LIGHT,
//       });
//   });
// }

// pub fn is_apps_use_light_theme() -> bool {
//   let mut hkey: HKEY = 0;
//   if unsafe {
//     RegOpenKeyExW(
//       HKEY_CURRENT_USER,
//       w!(r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"),
//       0,
//       KEY_READ,
//       &mut hkey,
//     )
//   } == 0
//   {
//     let mut buf_len: u32 = 1024;
//     let mut buf_type: u32 = 0;
//     let mut buf: Vec<u8> = Vec::with_capacity(buf_len as usize);

//     if unsafe {
//       RegQueryValueExW(
//         hkey,
//         w!("AppsUseLightTheme"),
//         null_mut(),
//         &mut buf_type,
//         buf.as_mut_ptr(),
//         &mut buf_len,
//       )
//     } == 0
//     {
//       return unsafe { *(buf.as_ptr() as *const u32) } == 1;
//     }
//   }

//   false
// }
