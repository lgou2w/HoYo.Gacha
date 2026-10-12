use crate::bootstrap::context::Context;
use crate::constants;

mod context;
mod handlers;
mod tauri;
mod tracing;
mod window_state;

/// Bootstrap application
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

  // Create application context and run Tauri
  let context = Context::new().await;
  tauri::run(context).await
}
