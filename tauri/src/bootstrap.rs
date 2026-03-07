mod context;
mod environment;
mod handlers;
mod panic_hook;
mod state;
mod tauri;
mod tracing;

pub(crate) use tauri::prelude::*;

#[cfg(test)]
pub(crate) use tracing::init_tracing;

use crate::constants;

// Bootstrap the application
pub async fn start() -> ! {
  hg_ffi::attach_console();

  println!(
    r"
   _   _    __   __     ____            _
  | | | | __\ \ / /__  / ___| __ _  ___| |__   __ _
  | |_| |/ _ \ V / _ \| |  _ / _` |/ __| '_ \ / _` |
  |  _  | (_) | | (_) | |_| | (_| | (__| | | | (_| |
  |_| |_|\___/|_|\___(_)____|\__,_|\___|_| |_|\__,_| {version}

  {description}

  - Authors: {authors}
  - Homepage: {homepage}
  ",
    description = constants::DESCRIPTION,
    version = constants::VERSION_WITH_PREFIX,
    authors = constants::AUTHORS,
    homepage = constants::HOMEPAGE,
  );

  // Install panic hook
  panic_hook::install();

  // Create application context and run Tauri
  let context = context::Context::new().await;
  tauri::run(context).await;
}
