use std::env;
use std::mem::{self, MaybeUninit};
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;

use tauri::{Theme, WebviewWindow};
use webview2_com::Microsoft::Web::WebView2::Win32::{
  COREWEBVIEW2_PREFERRED_COLOR_SCHEME_DARK, COREWEBVIEW2_PREFERRED_COLOR_SCHEME_LIGHT,
  ICoreWebView2Settings4,
};
use webview2_com::Microsoft::Web::WebView2::Win32::{ICoreWebView2_2, ICoreWebView2_13};
use windows::Win32::Foundation::{
  CloseHandle, FALSE, HANDLE, TRUE, WAIT_EVENT, WAIT_FAILED, WAIT_OBJECT_0,
};
use windows::Win32::Graphics::DirectWrite::{
  DWRITE_FACTORY_TYPE_SHARED, DWriteCreateFactory, IDWriteFactory,
};
use windows::Win32::Graphics::Dwm::{
  DWM_SYSTEMBACKDROP_TYPE, DWMSBT_MAINWINDOW, DWMWA_SYSTEMBACKDROP_TYPE,
  DWMWA_USE_IMMERSIVE_DARK_MODE, DWMWINDOWATTRIBUTE, DwmExtendFrameIntoClientArea,
  DwmSetWindowAttribute,
};
use windows::Win32::System::Com::{
  CLSCTX_INPROC_SERVER, COINIT_APARTMENTTHREADED, COINIT_DISABLE_OLE1DDE, CoCreateInstance,
  CoInitialize, CoInitializeEx, CoUninitialize, IPersistFile,
};
use windows::Win32::System::Console::{ATTACH_PARENT_PROCESS, AttachConsole};
use windows::Win32::System::Registry::{
  HKEY, HKEY_CURRENT_USER, KEY_NOTIFY, REG_NOTIFY_CHANGE_LAST_SET, RegCloseKey,
  RegNotifyChangeKeyValue, RegOpenKeyExA,
};
use windows::Win32::System::Threading::{CreateEventA, INFINITE, SetEvent, WaitForMultipleObjects};
use windows::Win32::UI::Controls::MARGINS;
use windows::Win32::UI::Shell::{IShellLinkW, ShellLink};
use windows::Win32::UI::WindowsAndMessaging::SetPropW;
use windows::core::{BOOL, Interface, PCWSTR, PWSTR, s, w};

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

#[inline]
pub fn is_supported_window_vibrancy() -> bool {
  consts::WINDOWS.is_21h2_and_higher
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
        Some(HANDLE(&mut dark as *mut _ as _)),
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

pub fn set_webview_accelerator_keys_enabled(
  window: &WebviewWindow,
  enable: bool,
) -> tauri::Result<()> {
  window.with_webview(move |webview| unsafe {
    let _ = webview
      .controller()
      .CoreWebView2()
      .unwrap()
      .Settings()
      .unwrap()
      .cast::<ICoreWebView2Settings4>()
      .unwrap()
      .SetAreBrowserAcceleratorKeysEnabled(enable);
  })
}

pub fn webview_version<F: FnOnce(String) + Send + 'static>(
  window: &WebviewWindow,
  consumer: F,
) -> tauri::Result<()> {
  window.with_webview(move |webview| unsafe {
    let mut version = MaybeUninit::<PWSTR>::uninit();
    let _ = webview
      .controller()
      .CoreWebView2()
      .unwrap()
      .cast::<ICoreWebView2_2>()
      .unwrap()
      .Environment()
      .unwrap()
      .BrowserVersionString(version.as_mut_ptr());

    let version = version.assume_init();
    if !version.is_empty() {
      consumer(version.to_string().unwrap())
    }
  })
}

// Get the current system theme
//   HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize
//   AppsUseLightTheme
//   SystemUsesLightTheme
pub fn apps_use_theme() -> Theme {
  fn apps_use_light_theme() -> windows_registry::Result<bool> {
    windows_registry::CURRENT_USER
      .create("Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize")?
      .get_u32("AppsUseLightTheme")
      .map(|val| val != 0)
  }

  match apps_use_light_theme() {
    Err(error) => {
      tracing::error!("Error reading system registry: {error:?}");
      Theme::Light
    }
    Ok(light) => {
      let theme = if light { Theme::Light } else { Theme::Dark };
      tracing::info!("Read registry AppsUseLightTheme: {theme}");
      theme
    }
  }
}

#[inline]
fn to_wide(str: impl AsRef<str>) -> Vec<u16> {
  str
    .as_ref()
    .encode_utf16()
    .chain(std::iter::once(0))
    .collect()
}

pub fn create_app_lnk() -> Result<(), windows::core::Error> {
  let lnk_path = consts::PLATFORM
    .desktop
    .join(format!("{}.lnk", consts::APP_NAME));

  if lnk_path.is_file() {
    return Ok(());
  }

  let pszfile = to_wide(format!("{}", env::current_exe().unwrap().display()));
  let lnk_pszfile = to_wide(format!("{}", lnk_path.display()));

  unsafe {
    CoInitialize(None).ok()?;

    let psl = CoCreateInstance::<_, IShellLinkW>(&ShellLink, None, CLSCTX_INPROC_SERVER)?;
    psl.SetPath(PCWSTR::from_raw(pszfile.as_ptr()))?;

    let ppf = psl.cast::<IPersistFile>()?;
    ppf.Save(PCWSTR::from_raw(lnk_pszfile.as_ptr()), true)?;

    CoUninitialize();
  }

  Ok(())
}

pub fn system_fonts() -> Result<Vec<String>, windows::core::Error> {
  let locale = consts::LOCALE.value.as_deref().unwrap_or("en-US");
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

#[derive(Default)]
pub struct AppsUseThemeMonitor {
  is_running: Arc<AtomicBool>,
  hshutdown: HANDLE,
  hthread: Option<thread::JoinHandle<()>>,
}

impl AppsUseThemeMonitor {
  pub fn start<F>(&mut self, callback: F)
  where
    F: Fn(Theme) + Send + 'static,
  {
    if self.is_running.load(Ordering::Relaxed) {
      return;
    }

    self.is_running.store(true, Ordering::Relaxed);
    self.hshutdown =
      unsafe { CreateEventA(None, true, false, None) }.expect("Shutdown event create failed");

    let initial_theme = apps_use_theme();
    let mut last_theme = initial_theme;

    let callback = Box::new(callback);
    let is_running = Arc::clone(&self.is_running);

    // https://github.com/microsoft/windows-rs/issues/3169#issuecomment-2489378071
    let hshutdown = self.hshutdown.0 as isize;
    let hthread = thread::spawn(move || {
      use tracing::error;

      let mut hkey = HKEY::default();
      if let Err(error) = unsafe {
        RegOpenKeyExA(
          HKEY_CURRENT_USER,
          s!("Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize"),
          None,
          KEY_NOTIFY,
          &mut hkey,
        )
      }
      .ok()
      {
        error!(message = "Open registry key failed", ?error);
        return;
      }

      'monitor: while is_running.load(Ordering::Relaxed) {
        let hevent = match unsafe { CreateEventA(None, true, false, None) } {
          Ok(hevent) => hevent,
          Err(error) => {
            error!("Create event failed: {error:?}");
            break;
          }
        };

        if let Err(error) = unsafe {
          RegNotifyChangeKeyValue(hkey, false, REG_NOTIFY_CHANGE_LAST_SET, Some(hevent), true)
        }
        .ok()
        {
          error!("RegNotifyChangeKeyValue failed: {error:?}");
          let _ = unsafe { CloseHandle(hevent) };
          break;
        }

        let handles = [hevent, HANDLE(hshutdown as _)];
        let wait_event = unsafe { WaitForMultipleObjects(&handles, false, INFINITE) };
        let _ = unsafe { CloseHandle(hevent) };

        match wait_event {
          WAIT_OBJECT_0 => {
            let new_theme = apps_use_theme();
            if new_theme != last_theme {
              last_theme = new_theme;
              callback(new_theme);
            }
          }
          WAIT_EVENT(1) => break 'monitor,
          WAIT_FAILED => {
            error!("WaitForMultipleObjects failed: {wait_event:?}");
            break 'monitor;
          }
          _ => {
            error!("WaitForMultipleObjects unexpected result: {wait_event:?}");
            break 'monitor;
          }
        }
      }

      let _ = unsafe { RegCloseKey(hkey) };
    });

    self.hthread = Some(hthread);
  }

  pub fn stop(&mut self) {
    if !self.is_running.load(Ordering::Relaxed) {
      return;
    }

    self.is_running.store(false, Ordering::Relaxed);

    let _ = unsafe { SetEvent(self.hshutdown) };

    if let Some(hthread) = self.hthread.take() {
      hthread.join().expect("Thread join failed");
    }

    let _ = unsafe { CloseHandle(self.hshutdown) };
  }
}
