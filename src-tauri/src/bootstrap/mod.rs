use crate::{consts, database};

mod ffi;
mod internals;
mod panic_hook;
mod tauri;
mod tracing;

#[cfg(test)] // for Unit test
pub use tracing::Tracing;

pub async fn start() {
  println!(
    r"
   _   _    __   __     ____            _
  | | | | __\ \ / /__  / ___| __ _  ___| |__   __ _
  | |_| |/ _ \ V / _ \| |  _ / _` |/ __| '_ \ / _` |
  |  _  | (_) | | (_) | |_| | (_| | (__| | | | (_| |
  |_| |_|\___/|_|\___(_)____|\__,_|\___|_| |_|\__,_| v{version}

  {description}

  - Authors: {authors}
  - Homepage: {homepage}
  ",
    description = consts::DESCRIPTION,
    version = consts::VERSION,
    authors = consts::AUTHORS,
    homepage = consts::HOMEPAGE,
  );

  panic_hook::install();
  let tracing = tracing::Tracing::initialize();
  let database = database::Database::new().await;
  tauri::Tauri::start(tracing, database).await;
}
