use std::ffi::{OsString, c_void};
use std::os::windows::ffi::OsStringExt;
use std::os::windows::process::CommandExt;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicIsize, Ordering};
use std::{io, mem, process};

use tauri::{App, WebviewWindow};
use windows::Win32::Foundation::HWND;
use windows::Win32::Globalization::{GetUserPreferredUILanguages, MUI_LANGUAGE_NAME};
use windows::Win32::Graphics::DirectWrite::{
  DWRITE_FACTORY_TYPE_SHARED, DWriteCreateFactory, IDWriteFactory,
};
use windows::Win32::System::Com::{
  CLSCTX_INPROC_SERVER, COINIT_APARTMENTTHREADED, COINIT_DISABLE_OLE1DDE, CoCreateInstance,
  CoInitialize, CoInitializeEx, CoTaskMemFree, CoUninitialize, IPersistFile,
};
use windows::Win32::System::Console::{ATTACH_PARENT_PROCESS, AttachConsole};
use windows::Win32::UI::Shell::{
  FOLDERID_Desktop, FOLDERID_LocalAppData, FOLDERID_LocalAppDataLow, FOLDERID_Profile, IShellLinkW,
  KF_FLAG_DEFAULT, SHGetKnownFolderPath, ShellLink,
};
use windows::Win32::UI::WindowsAndMessaging::{
  FLASHW_ALL, FLASHW_TIMERNOFG, FLASHWINFO, FlashWindowEx, SWP_FRAMECHANGED, SWP_NOACTIVATE,
  SWP_NOMOVE, SWP_NOSIZE, SWP_NOZORDER, SetWindowPos,
};
use windows::core::{BOOL, Error as WindowsError, GUID, Interface, PCWSTR, PWSTR};

/// The current window HWND stored as an atomic isize. (Pointer)
static WINDOW_HWND: AtomicIsize = AtomicIsize::new(0);

/// Get the current window HWND as an Option<HWND>.
pub fn window_hwnd() -> Option<HWND> {
  match WINDOW_HWND.load(Ordering::Relaxed) {
    0 => None,
    ptr => Some(HWND(ptr as *mut c_void)),
  }
}

pub fn on_tauri_setup(_app: &mut App, window: &WebviewWindow) -> Result<(), tauri::Error> {
  // Store the window handle
  if let Ok(hwnd) = window.hwnd() {
    WINDOW_HWND.store(hwnd.0 as isize, Ordering::Relaxed);
  }

  Ok(())
}

/// Force Windows to re-evaluate the window's non-client area.
///
/// Called from `setup()` before any `set_size`, to work around a `tao`
/// regression in Tauri 2.12.x where hidden windows keep a stale
/// "window rect → client rect" offset, causing `set_size(N)` to land on a
/// client area of `N + titlebar` on every launch. See the long comment at
/// the call site in `bootstrap/tauri.rs` for the full story and links.
///
/// No-op on non-Windows platforms (not compiled there either).
pub fn force_frame_recalculation(window: &WebviewWindow) {
  let Ok(hwnd) = window.hwnd() else {
    return;
  };

  unsafe {
    let _ = SetWindowPos(
      hwnd,
      None,
      0,
      0,
      0,
      0,
      SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE,
    );
  }
}

/// Attach the console of the parent process to the current process.
pub fn attach_console() {
  unsafe {
    let _ = AttachConsole(ATTACH_PARENT_PROCESS);
  }
}

/// Get the known folder path by its GUID.
fn known_folder(id: GUID) -> Result<PathBuf, WindowsError> {
  let path = unsafe { SHGetKnownFolderPath(&id, KF_FLAG_DEFAULT, None) }?;
  let ostr = OsString::from_wide(unsafe { path.as_wide() });
  unsafe { CoTaskMemFree(Some(path.as_ptr() as _)) };
  Ok(PathBuf::from(ostr))
}

/// Get the desktop directory path.
#[inline]
pub fn desktop_dir() -> Result<PathBuf, WindowsError> {
  known_folder(FOLDERID_Desktop)
}

/// Get the user profile directory path. (USERPROFILE)
#[inline]
pub fn profile_dir() -> Result<PathBuf, WindowsError> {
  known_folder(FOLDERID_Profile)
}

/// Get the local application data directory path. (`APPDATA/Local`)
#[inline]
pub fn data_local_dir() -> Result<PathBuf, WindowsError> {
  known_folder(FOLDERID_LocalAppData)
}

/// Get the locally low application data directory path. (`APPDATA/LocalLow`)
#[inline]
pub fn data_locallow_dir() -> Result<PathBuf, WindowsError> {
  known_folder(FOLDERID_LocalAppDataLow)
}

/// Get the list of user preferred UI languages.
pub fn locales() -> impl Iterator<Item = String> {
  let mut num_languages = 0;
  let mut buffer_length = 0;

  if unsafe {
    GetUserPreferredUILanguages(
      MUI_LANGUAGE_NAME,
      &mut num_languages,
      None,
      &mut buffer_length,
    )
  }
  .is_err()
  {
    return Vec::new().into_iter();
  };

  let mut results = Vec::with_capacity(num_languages as usize);
  let mut buffer = Vec::<u16>::with_capacity(buffer_length as usize);

  if unsafe {
    GetUserPreferredUILanguages(
      MUI_LANGUAGE_NAME,
      &mut num_languages,
      Some(PWSTR::from_raw(buffer.as_mut_ptr())),
      &mut buffer_length,
    )
  }
  .is_ok()
  {
    unsafe { buffer.set_len(buffer_length as usize) };

    for part in buffer.split(|i| *i == 0).filter(|p| !p.is_empty()) {
      if let Ok(locale) = String::from_utf16(part) {
        results.push(locale);
      }
    }
  }

  results.into_iter()
}

/// Get the first user preferred UI language.
#[inline]
pub fn locale() -> Option<String> {
  locales().next()
}

/// Open a file or directory in the system's default file explorer.
pub fn open_with_explorer<P: AsRef<Path>>(path: P) -> io::Result<process::Child> {
  process::Command::new("explorer")
    .arg("/select,")
    .raw_arg(format!("\"{}\"", path.as_ref().display()))
    .spawn()
}

/// Convert a &str to a wide string (Vec<u16>).
#[inline]
fn to_wide(str: &str) -> Vec<u16> {
  str.encode_utf16().chain(std::iter::once(0)).collect()
}

/// Create a `.lnk` shortcut from `src` to `dst`.
/// The `dst` should include the `.lnk` filename.
pub fn create_lnk(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> Result<(), WindowsError> {
  let src_pszfile = to_wide(&format!("{}", src.as_ref().display()));
  let dst_pszfile = to_wide(&format!("{}", dst.as_ref().display()));

  unsafe {
    CoInitialize(None).ok()?;

    let psl = CoCreateInstance::<_, IShellLinkW>(&ShellLink, None, CLSCTX_INPROC_SERVER)?;
    psl.SetPath(PCWSTR::from_raw(src_pszfile.as_ptr()))?;

    let ppf = psl.cast::<IPersistFile>()?;
    ppf.Save(PCWSTR::from_raw(dst_pszfile.as_ptr()), true)?;

    CoUninitialize();
  }

  Ok(())
}

/// Fetch the list of system font family names for the given locale.
pub fn system_fonts(locale: &str) -> Result<Vec<String>, WindowsError> {
  let pszlocale = to_wide(locale);
  let lplocale = PCWSTR::from_raw(pszlocale.as_ptr());

  unsafe {
    CoInitializeEx(None, COINIT_APARTMENTTHREADED | COINIT_DISABLE_OLE1DDE).ok()?;

    let factory = DWriteCreateFactory::<IDWriteFactory>(DWRITE_FACTORY_TYPE_SHARED)?;
    let mut font_collection = None;
    factory.GetSystemFontCollection(&mut font_collection, false)?;

    let fonts = if let Some(font_collection) = font_collection {
      let family_count = font_collection.GetFontFamilyCount();
      let mut fonts = Vec::with_capacity(family_count as usize);

      for i in 0..family_count {
        let font_family = font_collection.GetFontFamily(i)?;
        let family_names = font_family.GetFamilyNames()?;
        let names_count = family_names.GetCount();

        let mut index = 0;
        let mut exists = BOOL::default();
        family_names.FindLocaleName(lplocale, &mut index, &mut exists)?;

        let j = if exists.as_bool() {
          index
        } else if names_count > 0 {
          0
        } else {
          continue;
        };

        let str_len = family_names.GetStringLength(j)?;
        let mut buffer = vec![0u16; str_len as usize + 1];
        family_names.GetString(j, &mut buffer)?;

        let font_name = String::from_utf16_lossy(&buffer);
        let font_name = font_name.trim_end_matches('\0').to_owned();
        fonts.push(font_name);
      }

      fonts.sort();
      fonts
    } else {
      vec![]
    };

    CoUninitialize();
    Ok(fonts)
  }
}

/// Flash the window until it is focused to notify the user. If `hwnd` is None, it will use the current window.
pub fn flash_window(hwnd: Option<HWND>) -> BOOL {
  let Some(hwnd) = hwnd.or_else(window_hwnd) else {
    return false.into();
  };

  let pfwi = FLASHWINFO {
    cbSize: mem::size_of::<FLASHWINFO>() as u32,
    hwnd,
    dwFlags: FLASHW_ALL | FLASHW_TIMERNOFG,
    uCount: 0,
    dwTimeout: 0,
  };

  unsafe { FlashWindowEx(&pfwi) }
}

// region: Webview

pub mod webview {
  use std::mem::MaybeUninit;
  use std::string::FromUtf16Error;

  use tauri::webview::PlatformWebview;
  use webview2_com::Microsoft::Web::WebView2::Win32::{ICoreWebView2_2, ICoreWebView2Settings4};
  use windows::core::{Error as WindowsError, Interface, PWSTR};

  /// Enable or disable the webview accelerator keys.
  pub fn set_accelerator_keys_enabled(
    webview: &PlatformWebview,
    value: bool,
  ) -> Result<(), WindowsError> {
    let controller = webview.controller();
    let webview2 = unsafe { controller.CoreWebView2() }?;
    let settings = unsafe { webview2.Settings() }?.cast::<ICoreWebView2Settings4>()?;
    unsafe { settings.SetAreBrowserAcceleratorKeysEnabled(value) }
  }

  /// Enable or disable the webview default context menus.
  pub fn set_default_context_menus_enabled(
    webview: &PlatformWebview,
    value: bool,
  ) -> Result<(), WindowsError> {
    let controller = webview.controller();
    let webview2 = unsafe { controller.CoreWebView2() }?;
    let settings = unsafe { webview2.Settings() }?;
    unsafe { settings.SetAreDefaultContextMenusEnabled(value) }
  }

  /// Get the WebView2 browser version string.
  pub fn version(
    webview: &PlatformWebview,
  ) -> Result<Result<String, FromUtf16Error>, WindowsError> {
    let controller = webview.controller();
    let webview2 = unsafe { controller.CoreWebView2() }?.cast::<ICoreWebView2_2>()?;
    let environment = unsafe { webview2.Environment() }?;

    let mut value = MaybeUninit::<PWSTR>::uninit();
    unsafe { environment.BrowserVersionString(value.as_mut_ptr()) }?;

    let value = unsafe { value.assume_init().to_string() };
    Ok(value)
  }
}

// endregion

// region: Async File Dialog

pub mod rfd {
  use std::ffi::c_void;
  use std::num::NonZeroIsize;

  use raw_window_handle::{
    DisplayHandle, HandleError, HasDisplayHandle, HasWindowHandle, RawWindowHandle,
    Win32WindowHandle, WindowHandle,
  };
  use rfd::AsyncFileDialog;
  use windows::Win32::Foundation::HWND;

  struct MyWindowHandle(isize);

  impl HasWindowHandle for MyWindowHandle {
    fn window_handle(&self) -> Result<WindowHandle<'_>, HandleError> {
      let hwnd = NonZeroIsize::new(self.0).unwrap();
      let raw = RawWindowHandle::Win32(Win32WindowHandle::new(hwnd));
      let wrapper = unsafe { WindowHandle::borrow_raw(raw) };
      Ok(wrapper)
    }
  }

  impl HasDisplayHandle for MyWindowHandle {
    fn display_handle(&self) -> Result<DisplayHandle<'_>, HandleError> {
      Ok(DisplayHandle::windows())
    }
  }

  pub fn new(hwnd: Option<isize>) -> AsyncFileDialog {
    let mut rfd = AsyncFileDialog::new();

    if let Some(hwnd) = hwnd
      .map(|ptr| HWND(ptr as *mut c_void))
      .or_else(super::window_hwnd)
    {
      rfd = rfd.set_parent(&MyWindowHandle(hwnd.0 as isize));
    }

    rfd
  }
}

// endregion
