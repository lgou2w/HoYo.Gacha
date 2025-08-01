use std::io;
use std::process::Command;

fn main() {
  tauri_build::build();

  // Embedded Environment Variables
  {
    const NA: &str = "N/A";

    // Allows building without git
    let (git_commit_hash, git_commit_date) = git_commit().unwrap_or((NA.into(), NA.into()));
    println!("cargo:rustc-env=GIT_COMMIT_HASH={git_commit_hash}");
    println!("cargo:rustc-env=GIT_COMMIT_DATE={git_commit_date}");
  }
}

fn git_commit() -> io::Result<(String, String)> {
  let hash = String::from_utf8(
    Command::new("git")
      .args(["rev-parse", "HEAD"])
      .output()?
      .stdout,
  )
  .unwrap();

  let date = String::from_utf8(
    Command::new("git")
      .args(["show", "--no-patch", "--format=%ci"])
      .output()?
      .stdout,
  )
  .unwrap();

  Ok((hash, date))
}
