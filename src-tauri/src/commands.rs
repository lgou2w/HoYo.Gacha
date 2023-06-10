extern crate futures;
extern crate reqwest;
extern crate serde;
extern crate tauri;

use crate::constants;
use crate::error::Result;
use reqwest::Client as Reqwest;
use serde::{Deserialize, Serialize};
use tauri::{Invoke, Runtime};

pub fn get_handlers<R: Runtime>() -> Box<dyn Fn(Invoke<R>) + Send + Sync> {
    Box::new(tauri::generate_handler![
        get_version,
        get_latest_version,
        update_app
    ])
}

#[derive(Debug, Serialize)]
struct Version {
    version: String, // x.y.z
    commit_hash: String,
    commit_tag: Option<String>,
    date: String,
}

#[tauri::command]
fn get_version() -> Version {
    let commit_tag = constants::COMMIT_TAG;
    Version {
        version: constants::VERSION.to_owned(),
        commit_hash: constants::COMMIT_HASH[0..7].to_owned(),
        commit_tag: if commit_tag.is_empty() {
            None
        } else {
            Some(commit_tag.to_owned())
        },
        date: constants::COMMIT_DATE.to_owned(),
    }
}

#[derive(Debug, Deserialize, Serialize)]
struct Asset {
    name: String,
    size: u64,
    download_url: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct LatestVersion {
    id: u32,
    tag_name: String,
    prerelease: bool,
    created_at: String,
    asset: Asset,
}

#[tauri::command]
async fn get_latest_version() -> Result<LatestVersion> {
    Ok(Reqwest::builder()
        .build()?
        .get("https://raw.githubusercontent.com/WxWatch/gacha-tracker/main/manifest.json")
        .send()
        .await?
        .json::<LatestVersion>()
        .await?)
}

#[tauri::command]
async fn update_app(latest_version: LatestVersion) -> Result<()> {
    use futures::stream::TryStreamExt;
    use std::env::current_exe;
    use std::fs::{remove_file, rename, File};
    use std::io::Write;
    use std::path::PathBuf;

    let current_exe = dbg!(current_exe()?);
    let current_dir = current_exe.parent().unwrap();

    // download
    let out_file = PathBuf::from(current_dir).join(latest_version.asset.name);
    let mut out_file = File::create(out_file)?;

    let response = Reqwest::builder()
        .build()?
        .get("https://hoyo-gacha.lgou2w.com/release/download")
        .query(&[("id", latest_version.id.to_string())])
        .send()
        .await?
        .error_for_status()?;

    let mut stream = response.bytes_stream();
    while let Some(v) = stream.try_next().await? {
        out_file.write_all(&v)?;
    }

    // delete old bak and rename current exe to bak
    let dest_bak = current_dir
        .join(constants::NAME.replace('.', "_"))
        .with_extension("bak");
    if dest_bak.exists() {
        remove_file(&dest_bak)?;
    }

    rename(&current_exe, &dest_bak)?;

    // TODO: exit app ?
    // app_handle.exit(0);

    Ok(())
}
