use std::io;
use std::path::Path;

use tauri::ipc::{IpcResponse, Response};
use tokio::fs::File as TokioFile;
use tokio::io::{AsyncReadExt, BufReader as TokioBufReader};

use crate::constants;
use crate::database::schemas::AccountBusiness;

pub struct ImageResolver;

impl ImageResolver {
  pub const MIME: &str = "image/avif";
  pub const BASE_URL: &str = "https://hoyo-gacha-v1.lgou2w.com";

  #[tracing::instrument]
  pub async fn resolve(
    business: AccountBusiness,
    item_category: String,
    mut item_id: u32,
  ) -> Result<impl IpcResponse, String> {
    // v1 facet
    // static or transform
    // https://docs.netlify.com/image-cdn/overview/

    // FIXME: Genshin Impact: Miliastra Wonderland
    //   Currently, this is how it reuses icon resources.
    let mut item_category = item_category.as_str();
    if business == AccountBusiness::MiliastraWonderland
      && item_category == "CosmeticCatalog"
      && !(275000..=275999).contains(&item_id)
    {
      item_category = "CosmeticComponent";
      item_id -= 10000;
    }

    let url = format!(
      "{base_url}/{keyof}/{item_category}/{item_id}.avif",
      base_url = Self::BASE_URL,
      keyof = business.as_str(),
    );

    // APPDATA/Local/${bundle_identifier}/${CACHES_DIR}/${business}/${category}
    const CACHES_DIR: &str = "GachaImages";
    let image_dir = constants::APP_LOCAL_DATA_DIR
      .join(CACHES_DIR)
      .join(business.as_str())
      .join(item_category);

    if !image_dir.exists() {
      tokio::fs::create_dir_all(&image_dir)
        .await
        .map_err(|err| format!("{err:?}"))?;
    }

    // Validate AVIF header
    // https://aomediacodec.github.io/av1-avif/v1.0.0.html
    async fn validate_avif(path: &Path) -> io::Result<Option<Vec<u8>>> {
      if tokio::fs::metadata(&path)
        .await
        .map(|m| m.is_file() && m.len() > 8)
        .is_err()
      {
        return Ok(None);
      }

      let file = TokioFile::open(&path).await?;
      let mut reader = TokioBufReader::new(file);

      let mut buf = [0u8; 8];
      reader.read_exact(&mut buf).await?;

      let box_size = u32::from_be_bytes([buf[0], buf[1], buf[2], buf[3]]);
      let box_type = &buf[4..8];

      if box_size < 8 || box_type != b"ftyp" {
        tracing::error!(message = "Bad avif image", ?path);
        Ok(None)
      } else {
        drop(reader);

        let data = tokio::fs::read(path).await?;
        Ok(Some(data))
      }
    }

    // First load from local
    let image_file = image_dir.join(format!("{item_id}.avif"));
    if let Some(data) = validate_avif(&image_file)
      .await
      .map_err(|err| format!("{err:?}"))?
    {
      return Ok(Response::new(data));
    }

    #[inline]
    async fn fetch(url: String) -> reqwest::Result<Vec<u8>> {
      Ok(
        reqwest::ClientBuilder::new()
          .user_agent(constants::USER_AGENT)
          .build()?
          .get(url)
          .send()
          .await?
          .error_for_status()?
          .bytes()
          .await?
          .into(),
      )
    }

    let data = fetch(url).await.map_err(|err| format!("{err:?}"))?;

    // Write to local cache
    tokio::fs::write(image_file, &data)
      .await
      .map_err(|err| format!("{err:?}"))?;

    Ok(Response::new(data))
  }
}
