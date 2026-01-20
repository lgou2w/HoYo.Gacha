use tauri::ipc::{IpcResponse, Response};
use tracing::debug;

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
      keyof = business.as_str()
    );

    debug!(message = "Resolving image...", ?url);

    // TODO:
    // 1. Write to local caches
    // 2. First load from local

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

    Ok(Response::new(data))
  }
}
