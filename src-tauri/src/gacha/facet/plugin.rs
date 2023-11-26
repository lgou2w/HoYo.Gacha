use tauri::plugin::{Builder as TauriPluginBuilder, TauriPlugin};
use tauri::{generate_handler, Wry};

pub struct GachaFacetPluginBuilder;

impl GachaFacetPluginBuilder {
  const PLUGIN_NAME: &'static str = "hg_gacha_facet";

  pub fn new() -> Self {
    Self
  }

  pub fn build(self) -> TauriPlugin<Wry> {
    TauriPluginBuilder::new(Self::PLUGIN_NAME)
      .invoke_handler(generate_handler![
        handler::find_data_dir,
        handler::find_data_dirs,
        handler::find_gacha_urls,
        handler::fetch_gacha_url_metadata,
        handler::create_account_gacha_records_fetcher_channel,
      ])
      .build()
  }
}

mod handler {
  use tauri::Window;

  use crate::database::{AccountFacet, DatabaseGachaRecordAdditions, DatabasePluginState};
  use crate::gacha::facet::{
    create_gacha_records_fetcher_channel, DataDirectory, GachaFacet, GachaFacetError,
    GachaRecordsFetcherChannelFragment, GachaUrl, GachaUrlMetadata,
  };

  #[cfg(windows)]
  use crate::utilities::windows::{set_progress_bar, ProgressState};

  #[tauri::command]
  pub async fn find_data_dir(
    facet: AccountFacet,
    is_oversea: bool,
  ) -> Result<Option<DataDirectory>, GachaFacetError> {
    GachaFacet::ref_by(&facet).find_data_dir(is_oversea)
  }

  #[tauri::command]
  pub async fn find_data_dirs(facet: AccountFacet) -> Result<Vec<DataDirectory>, GachaFacetError> {
    GachaFacet::ref_by(&facet).find_data_dirs()
  }

  #[tauri::command]
  pub async fn find_gacha_urls(
    facet: AccountFacet,
    data_directory: DataDirectory,
    skip_expired: bool,
  ) -> Result<Option<Vec<GachaUrl>>, GachaFacetError> {
    GachaFacet::ref_by(&facet).find_gacha_urls(&data_directory, skip_expired)
  }

  #[tauri::command]
  pub async fn fetch_gacha_url_metadata(
    facet: AccountFacet,
    gacha_url: String,
  ) -> Result<Option<GachaUrlMetadata>, GachaFacetError> {
    GachaFacet::ref_by(&facet)
      .fetch_gacha_url_metadata(&gacha_url)
      .await
  }

  #[tauri::command]
  #[allow(clippy::too_many_arguments)]
  pub async fn create_account_gacha_records_fetcher_channel(
    window: Window,
    database: DatabasePluginState<'_>,
    facet: AccountFacet,
    #[allow(unused)] uid: u32, // explained below ↓
    gacha_url: String,
    gacha_type_and_last_end_id_mappings: Vec<(String, Option<String>)>,
    event_channel: Option<String>,
    save_to_database: Option<bool>,
    #[cfg(windows)] sync_taskbar_progress: Option<bool>,
  ) -> Result<(), GachaFacetError> {
    #[cfg(windows)]
    let sync_taskbar_progress = sync_taskbar_progress.unwrap_or(false);

    let save_to_database = save_to_database.unwrap_or(false);
    let event_channel = event_channel.unwrap_or_default();
    let event_emit = !event_channel.is_empty();

    // TODO: Validate uid and gacha_url consistency?
    // There's no way to know it's uid owner with just a gacha url.
    // But validation is optional. Because the final record inserted into
    // the database has nothing to do with the uid provided.

    #[cfg(windows)]
    if sync_taskbar_progress {
      set_progress_bar(&window, ProgressState::Indeterminate, None);
    }

    let result = create_gacha_records_fetcher_channel(
      GachaFacet::ref_by(&facet),
      gacha_url,
      gacha_type_and_last_end_id_mappings,
      |fragment| async {
        if event_emit {
          window.emit(&event_channel, &fragment)?;
        }

        #[cfg(windows)]
        if sync_taskbar_progress {
          if let GachaRecordsFetcherChannelFragment::Progress(progress) = &fragment {
            set_progress_bar(&window, ProgressState::Normal, Some(*progress as u64));
          }
        }

        if save_to_database {
          if let GachaRecordsFetcherChannelFragment::Data(records) = fragment {
            database.save_gacha_records(records).await?;
          }
        }

        Ok(())
      },
    )
    .await;

    #[cfg(windows)]
    if sync_taskbar_progress {
      set_progress_bar(&window, ProgressState::None, None);
    }

    result
  }
}
