use std::io;
use std::process::Command;

fn main() {
  tauri_build::build();

  // Embedded Environment Variables
  {
    // Allows building without git
    let git_info = git_info().unwrap_or_default();
    println!("cargo:rustc-env=GIT_COMMIT_HASH={}", git_info.commit_hash);
    println!("cargo:rustc-env=GIT_COMMIT_DATE={}", git_info.commit_date);
    println!("cargo:rustc-env=GIT_REMOTE_URL={}", git_info.remote_url);
  }
}

struct GitInfo {
  commit_hash: String,
  commit_date: String,
  remote_url: String,
}

impl Default for GitInfo {
  fn default() -> Self {
    const NA: &str = "NA";

    Self {
      commit_hash: NA.into(),
      commit_date: NA.into(),
      remote_url: NA.into(),
    }
  }
}

fn git_info() -> io::Result<GitInfo> {
  #[inline]
  fn git(args: &[&str]) -> io::Result<String> {
    Ok(String::from_utf8(Command::new("git").args(args).output()?.stdout).unwrap())
  }

  let commit_hash = git(&["rev-parse", "HEAD"])?;
  let commit_date = git(&["show", "--no-patch", "--format=%ci"])?;
  let remote_url = git(&["remote", "get-url", "origin"])?;

  Ok(GitInfo {
    commit_hash,
    commit_date,
    remote_url,
  })
}
