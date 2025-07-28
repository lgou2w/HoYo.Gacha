use std::process::Command;

fn main() {
  tauri_build::build();

  // Embedded Environment Variables
  {
    let git_commit_hash = String::from_utf8(
      Command::new("git")
        .args(["rev-parse", "HEAD"])
        .output()
        .unwrap()
        .stdout,
    )
    .unwrap();

    let git_commit_date = String::from_utf8(
      Command::new("git")
        .args(["show", "--no-patch", "--format=%ci"])
        .output()
        .unwrap()
        .stdout,
    )
    .unwrap();

    println!("cargo:rustc-env=GIT_COMMIT_HASH={git_commit_hash}");
    println!("cargo:rustc-env=GIT_COMMIT_DATE={git_commit_date}");
  }
}
