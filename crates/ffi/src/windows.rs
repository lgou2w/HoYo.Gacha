use std::ffi::OsString;
use std::mem::MaybeUninit;
use std::os::windows::ffi::OsStringExt;
use std::path::{Path, PathBuf};
use std::string::FromUtf16Error;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, AtomicIsize, Ordering};
use std::thread::{self, JoinHandle};

use rfd::AsyncFileDialog;
use tauri::webview::PlatformWebview;
use tauri::window::{Effect, EffectsBuilder};
use tauri::{Error as TauriError, Theme, WebviewWindow};
use webview2_com::Microsoft::Web::WebView2::Win32::{
  COREWEBVIEW2_PREFERRED_COLOR_SCHEME_DARK, COREWEBVIEW2_PREFERRED_COLOR_SCHEME_LIGHT,
  ICoreWebView2_2, ICoreWebView2_13, ICoreWebView2Settings4,
};
use windows::Win32::Foundation::{
  CloseHandle, HANDLE, HWND, WAIT_EVENT, WAIT_FAILED, WAIT_OBJECT_0,
};
use windows::Win32::Globalization::{GetUserPreferredUILanguages, MUI_LANGUAGE_NAME};
use windows::Win32::Graphics::DirectWrite::{
  DWRITE_FACTORY_TYPE_SHARED, DWriteCreateFactory, IDWriteFactory,
};
use windows::Win32::System::Com::{
  CLSCTX_INPROC_SERVER, COINIT_APARTMENTTHREADED, COINIT_DISABLE_OLE1DDE, CoCreateInstance,
  CoInitialize, CoInitializeEx, CoTaskMemFree, CoUninitialize, IPersistFile,
};
use windows::Win32::System::Console::{ATTACH_PARENT_PROCESS, AttachConsole};
use windows::Win32::System::Registry::{
  HKEY, HKEY_CURRENT_USER, KEY_NOTIFY, KEY_READ, REG_NOTIFY_CHANGE_LAST_SET, REG_SAM_FLAGS,
  RegCloseKey, RegNotifyChangeKeyValue, RegOpenKeyExA, RegQueryValueExA,
};
use windows::Win32::System::Threading::{CreateEventA, INFINITE, SetEvent, WaitForMultipleObjects};
use windows::Win32::UI::Shell::{
  FOLDERID_Desktop, FOLDERID_LocalAppData, FOLDERID_LocalAppDataLow, FOLDERID_Profile, IShellLinkW,
  KF_FLAG_DEFAULT, SHGetKnownFolderPath, ShellLink,
};
use windows::Win32::UI::WindowsAndMessaging::{
  IDYES, MB_DEFBUTTON1, MB_ICONERROR, MB_YESNO, MessageBoxW,
};
use windows::core::{BOOL, Error as WindowsError, GUID, Interface, PCWSTR, PWSTR, s, w};

/// The current window HWND stored as an atomic isize. (Pointer)
static CURRENT_WINDOW_HWND: AtomicIsize = AtomicIsize::new(0);

/// Get the current window HWND as an Option<HWND>.
#[inline]
fn current_window_hwnd_t() -> Option<HWND> {
  let val = current_window_hwnd();
  if val == 0 { None } else { Some(HWND(val as _)) }
}

/// Get the current window HWND. (Pointer)
#[inline]
pub fn current_window_hwnd() -> isize {
  CURRENT_WINDOW_HWND.load(Ordering::Relaxed)
}

/// Set the current window HWND. (Pointer)
#[inline]
pub fn set_current_window_hwnd(value: isize) {
  CURRENT_WINDOW_HWND.store(value, Ordering::Relaxed);
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

/// Set the webview color scheme (dark or light).
pub fn set_webview_color_scheme(
  webview: &PlatformWebview,
  value: Theme,
) -> Result<(), WindowsError> {
  let value = match value {
    Theme::Dark => COREWEBVIEW2_PREFERRED_COLOR_SCHEME_DARK,
    Theme::Light => COREWEBVIEW2_PREFERRED_COLOR_SCHEME_LIGHT,
    _ => unreachable!(),
  };

  let controller = webview.controller();
  let webview2 = unsafe { controller.CoreWebView2() }?.cast::<ICoreWebView2_13>()?;
  unsafe { webview2.Profile()?.SetPreferredColorScheme(value) }
}

/// Enable or disable the webview accelerator keys.
pub fn set_webview_accelerator_keys_enabled(
  webview: &PlatformWebview,
  value: bool,
) -> Result<(), WindowsError> {
  let controller = webview.controller();
  let webview2 = unsafe { controller.CoreWebView2() }?;
  let settings = unsafe { webview2.Settings() }?.cast::<ICoreWebView2Settings4>()?;
  unsafe { settings.SetAreBrowserAcceleratorKeysEnabled(value) }
}

/// Get the Webview2 browser version string.
pub fn webview_version(
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

pub fn apply_window_color_scheme(window: &WebviewWindow, value: Theme) -> Result<(), TauriError> {
  let effect = match value {
    Theme::Dark => Effect::MicaDark,
    Theme::Light => Effect::MicaLight,
    _ => unreachable!(),
  };

  window.set_effects(EffectsBuilder::new().effect(effect).build())?;
  window.with_webview(move |webview| {
    let _ = set_webview_color_scheme(&webview, value);
  })?;

  Ok(())
}

/// Get the current Windows theme (dark or light).
#[inline]
pub fn apps_use_theme() -> Result<Theme, WindowsError> {
  AppsUseThemeKey::new(KEY_READ)?.read()
}

struct AppsUseThemeKey(HKEY);

// SAFETY: HKEY is safe to send and share between threads.
unsafe impl Send for AppsUseThemeKey {}
unsafe impl Sync for AppsUseThemeKey {}

impl AppsUseThemeKey {
  fn as_raw(&self) -> &HKEY {
    &self.0
  }
}

impl Drop for AppsUseThemeKey {
  fn drop(&mut self) {
    if !self.0.is_invalid() {
      let _ = unsafe { RegCloseKey(self.0) };
    }
  }
}

impl AppsUseThemeKey {
  fn new(samdesired: REG_SAM_FLAGS) -> Result<Self, WindowsError> {
    let mut hkey = HKEY::default();
    unsafe {
      RegOpenKeyExA(
        HKEY_CURRENT_USER,
        s!(r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize"),
        None,
        samdesired,
        &mut hkey,
      )
    }
    .ok()?;

    Ok(Self(hkey))
  }

  fn read(&self) -> Result<Theme, WindowsError> {
    let bytes = &mut [0; 4];
    let mut len = bytes.len().try_into()?;
    unsafe {
      RegQueryValueExA(
        self.0,
        s!("AppsUseLightTheme"),
        None,
        None,
        Some(bytes.as_mut_ptr()),
        Some(&mut len),
      )
    }
    .ok()?;

    Ok(if u32::from_le_bytes(*bytes) != 0 {
      Theme::Light
    } else {
      Theme::Dark
    })
  }
}

struct EventHandle(HANDLE);

// SAFETY: HANDLE is safe to send and share between threads.
unsafe impl Send for EventHandle {}
unsafe impl Sync for EventHandle {}

impl Drop for EventHandle {
  fn drop(&mut self) {
    if !self.0.is_invalid() {
      let _ = unsafe { CloseHandle(self.0) };
    }
  }
}

impl EventHandle {
  fn new(bmanualreset: bool, binitialstate: bool) -> Result<Self, WindowsError> {
    let h = unsafe { CreateEventA(None, bmanualreset, binitialstate, None) }?;
    Ok(Self(h))
  }

  /// Set the event to the signaled state.
  fn set(&self) -> Result<(), WindowsError> {
    unsafe { SetEvent(self.0) }
  }
}

pub struct AppsUseThemeMonitor {
  running: Arc<AtomicBool>,
  hshutdown: EventHandle,
  thread: Option<JoinHandle<()>>,
}

impl AppsUseThemeMonitor {
  pub fn new<V>(visitor: V) -> Result<Self, WindowsError>
  where
    V: Fn(Result<Theme, WindowsError>) + Send + 'static,
  {
    let hshutdown = EventHandle::new(true, false)?;
    let htheme = AppsUseThemeKey::new(KEY_READ | KEY_NOTIFY)?;
    let running = Arc::new(AtomicBool::new(true));

    let mut last_theme = htheme.read()?;
    let visitor_boxed = Box::new(visitor);
    let running_cloned = Arc::clone(&running);

    // SAFETY: Get the raw handle as isize. (Used for async `Send` + `Sync`)
    // See: https://github.com/microsoft/windows-rs/issues/3169#issuecomment-2489378071
    let hshutdown_ptr = hshutdown.0.0 as isize;

    let thread = thread::spawn(move || {
      while running_cloned.load(Ordering::Relaxed) {
        // Used to wait for either a registry change event
        let hevent = match EventHandle::new(true, false) {
          Ok(h) => h,
          Err(err) => {
            // Notify error and exit the loop
            visitor_boxed(Err(err));
            break;
          }
        };

        // Set up registry change notification
        if let Err(err) = unsafe {
          RegNotifyChangeKeyValue(
            *htheme.as_raw(),
            false,
            REG_NOTIFY_CHANGE_LAST_SET,
            Some(hevent.0),
            true,
          )
        }
        .ok()
        {
          // Notify error and exit the loop
          visitor_boxed(Err(err));
          break;
        }

        // Wait for either the registry change or shutdown events.
        // Blocking until one of the events is signaled
        let handles = [hevent.0, HANDLE(hshutdown_ptr as _)];
        let wait_event = unsafe { WaitForMultipleObjects(&handles, false, INFINITE) };
        drop(hevent);

        // Check which event was signaled
        match wait_event {
          // Registry change event signaled
          WAIT_OBJECT_0 => match htheme.read() {
            Err(err) => visitor_boxed(Err(err)),
            Ok(new_theme) => {
              // Notify only if the theme has changed
              if last_theme != new_theme {
                last_theme = new_theme;
                visitor_boxed(Ok(new_theme));
              }
            }
          },
          // Shutdown event signaled
          WAIT_EVENT(1) => break,
          // Function failed
          WAIT_FAILED => {
            let err = WindowsError::from_win32();
            visitor_boxed(Err(err));
            break;
          }
          // Other errors
          _ => break,
        }
      }

      // Automatically drop the theme key handle
      // drop(htheme);
    });

    Ok(Self {
      running,
      hshutdown,
      thread: Some(thread),
    })
  }

  /// Stop monitoring and join the thread.
  pub fn stop(mut self) {
    if self.running.swap(false, Ordering::Relaxed) {
      // Signal the shutdown event
      let _ = self.hshutdown.set();

      // Wait for the thread to finish
      if let Some(h) = self.thread.take() {
        let _ = h.join();
      }
    }
  }
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

/// Show a crash message box with the given message. (Used for `panic_hook`)
pub fn crash_msgbox(message: &str) -> bool {
  let lptext = to_wide(message);
  let lptext = PCWSTR::from_raw(lptext.as_ptr());
  let hwnd = current_window_hwnd_t();

  IDYES
    == unsafe {
      MessageBoxW(
        hwnd,
        lptext,
        w!("Application crash"),
        MB_ICONERROR | MB_YESNO | MB_DEFBUTTON1,
      )
    }
}

pub fn file_dialog(hwnd: Option<isize>) -> AsyncFileDialog {
  let mut rfd = AsyncFileDialog::new();

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

  let hwnd = hwnd.unwrap_or(current_window_hwnd());
  if hwnd != 0 {
    rfd = rfd.set_parent(&MyWindowHandle(hwnd));
  }

  rfd
}

#[cfg(test)]
mod tests {
  use super::*;

  #[cfg(windows)]
  #[test]
  #[ignore = "Monitoring thread"]
  fn test_apps_use_theme_monitor() {
    let monitor = AppsUseThemeMonitor::new(|result| match result {
      Err(err) => eprintln!("Error monitoring theme changes: {err:?}"),
      Ok(theme) => println!("Theme changed to: {theme:?}"),
    })
    .unwrap();

    thread::sleep(std::time::Duration::from_secs(10));
    monitor.stop();
  }
}
