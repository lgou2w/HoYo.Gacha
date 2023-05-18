extern crate shadow_rs;
extern crate tauri_build;

fn main() {
  shadow_rs::new().ok();
  tauri_build::build();
}
