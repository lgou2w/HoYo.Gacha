use std::env::var;
use std::path::PathBuf;

macro_rules! user_dirs {
  ($($os:literal -> $home:literal { $($fn:ident => $inner:literal),* }),*) => {
    $(
      #[allow(unused)]
      #[cfg(target_os = $os)]
      pub fn home() -> PathBuf {
        var($home)
          .map(PathBuf::from)
          .unwrap_or_else(|e| panic!("Failed to get environment variable: {}", $home))
      }

      $(
        #[allow(unused)]
        #[cfg(target_os = $os)]
        pub fn $fn() -> PathBuf {
          home().join($inner)
        }
      )*
    )*
  };
}

user_dirs!(
  "windows" -> "USERPROFILE" {
    appdata           => "AppData",
    appdata_local     => r"AppData\Local",
    appdata_local_low => r"AppData\LocalLow",
    appdata_roaming   => r"AppData\Roaming"
  },
  "macos" -> "HOME" {
    appdata           => "Library",
    appdata_local     => "Library/Caches",
    appdata_local_low => "Library/Caches",
    appdata_roaming   => "Library/Application Support"
  }
);
