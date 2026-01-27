use std::path::PathBuf;

use cfg_if::cfg_if;
use tauri::{Error as TauriError, Theme, WebviewWindow};

use crate::bootstrap::{TauriAppState, TauriEnvironmentState};
use crate::bootstrap::{TauriMetadataState, resolve_theme_or_system};
use crate::constants;

#[cfg(debug_assertions)]
#[tauri::command]
pub fn panic() {
  panic!("Intentional panic triggered from frontend for testing purposes");
}

#[tauri::command]
pub fn environment(environment: TauriEnvironmentState) -> serde_json::Value {
  environment.to_json()
}

#[tauri::command]
#[tracing::instrument(skip(state, window))]
pub fn change_color_scheme(
  state: TauriAppState,
  window: WebviewWindow,
  value: Option<Theme>,
) -> Result<(), TauriError> {
  let theme = resolve_theme_or_system(&state, value);
  hg_ffi::apply_window_color_scheme(&window, theme)
}

#[tauri::command]
pub fn create_app_lnk() -> Result<(), String> {
  let desktop = hg_ffi::desktop_dir().map_err(|err| format!("{err:?}"))?;
  let dst = desktop.join(format!("{}.lnk", constants::APP_NAME));
  if dst.is_file() {
    Ok(())
  } else {
    hg_ffi::create_lnk(&*constants::EXE_PATH, dst).map_err(|err| format!("{err:?}"))
  }
}

#[tauri::command]
pub fn system_fonts() -> Result<Vec<String>, String> {
  hg_ffi::system_fonts(&constants::LOCALE).map_err(|err| format!("{err:?}"))
}

#[tauri::command]
pub async fn pick_file(
  title: Option<String>,
  directory: Option<PathBuf>,
  filters: Option<Vec<(String, Vec<String>)>>,
) -> Option<PathBuf> {
  let mut rfd = hg_ffi::file_dialog(None)
    .set_title(title.unwrap_or_default())
    .set_directory(directory.unwrap_or_default());

  if let Some(filters) = filters {
    for (name, extensions) in filters {
      rfd = rfd.add_filter(name, &extensions);
    }
  }

  rfd.pick_file().await.map(Into::into)
}

#[tauri::command]
pub async fn pick_folder(title: Option<String>, directory: Option<PathBuf>) -> Option<PathBuf> {
  hg_ffi::file_dialog(None)
    .set_title(title.unwrap_or_default())
    .set_directory(directory.unwrap_or_default())
    .pick_folder()
    .await
    .map(Into::into)
}

#[tauri::command]
pub async fn metadata_hash(state: TauriMetadataState<'_>) -> Result<String, ()> {
  Ok(state.hash().await)
}

cfg_if! {if #[cfg(not(feature = "disable-metadata-updater"))] {
  use std::sync::Arc;

  use crate::error::AppError;
  use crate::business::metadata::{MetadataUpdateKind, MetadataUpdateError};

  #[tauri::command]
  pub fn metadata_is_updating(state: TauriMetadataState) -> bool {
    state.is_updating()
  }

  #[tauri::command]
  #[tracing::instrument(skip(state))]
  pub async fn metadata_update(
    state: TauriMetadataState<'_>,
    max_attempts: Option<u8>,
  ) -> Result<MetadataUpdateKind, AppError<MetadataUpdateError>> {
    Arc::clone(state.inner())
      .update_with_retry(max_attempts)
      .await
      .expect("Failed join metadata update task")
      .map_err(AppError::from)
  }
} else {
  // Feature disabled

  #[tauri::command]
  pub fn metadata_is_updating() -> bool { false }

  #[tauri::command]
  pub fn metadata_update() {}
}}
