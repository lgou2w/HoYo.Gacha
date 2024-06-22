use tauri::plugin::{Builder as TauriPluginBuilder, TauriPlugin};
use tauri::{generate_handler, Wry};

pub struct GachaBusinessPluginBuilder;

impl GachaBusinessPluginBuilder {
  const PLUGIN_NAME: &'static str = "hg_gacha_business";

  pub fn new() -> Self {
    Self
  }

  pub fn build(self) -> TauriPlugin<Wry> {
    TauriPluginBuilder::new(Self::PLUGIN_NAME)
      .invoke_handler(generate_handler![
        handlers::find_data_dir,
        handlers::find_data_dirs,
        handlers::find_gacha_urls,
        handlers::fetch_gacha_url_metadata,
        handlers::create_account_gacha_records_fetcher_channel,
      ])
      .build()
  }
}

mod handlers {
  use tauri::Window;

  use crate::database::{
    DatabasePluginState, GachaRecordQuestioner, GachaRecordQuestionerAdditions,
  };
  use crate::gacha::business::{
    create_gacha_records_fetcher_channel, DataDirectory, GachaBusiness, GachaBusinessError,
    GachaRecordsFetcherChannelFragment, GachaUrl, GachaUrlMetadata,
  };
  use crate::models::AccountBusiness;

  #[cfg(windows)]
  use crate::utilities::windows::{set_progress_bar, ProgressState};

  #[tauri::command]
  pub async fn find_data_dir(
    business: AccountBusiness,
    is_oversea: bool,
  ) -> Result<Option<DataDirectory>, GachaBusinessError> {
    GachaBusiness::ref_by(&business).find_data_dir(is_oversea)
  }

  #[tauri::command]
  pub async fn find_data_dirs(
    business: AccountBusiness,
  ) -> Result<Vec<DataDirectory>, GachaBusinessError> {
    GachaBusiness::ref_by(&business).find_data_dirs()
  }

  #[tauri::command]
  pub async fn find_gacha_urls(
    business: AccountBusiness,
    data_directory: DataDirectory,
    skip_expired: bool,
  ) -> Result<Option<Vec<GachaUrl>>, GachaBusinessError> {
    GachaBusiness::ref_by(&business).find_gacha_urls(&data_directory, skip_expired)
  }

  #[tauri::command]
  pub async fn fetch_gacha_url_metadata(
    business: AccountBusiness,
    gacha_url: String,
  ) -> Result<Option<GachaUrlMetadata>, GachaBusinessError> {
    GachaBusiness::ref_by(&business)
      .fetch_gacha_url_metadata(&gacha_url)
      .await
  }

  #[tauri::command]
  #[allow(clippy::too_many_arguments)]
  pub async fn create_account_gacha_records_fetcher_channel(
    window: Window,
    database: DatabasePluginState<'_>,
    business: AccountBusiness,
    #[allow(unused)] uid: u32, // explained below ↓
    gacha_url: String,
    gacha_type_and_last_end_id_mappings: Vec<(String, Option<String>)>,
    event_channel: Option<String>,
    save_to_database: Option<bool>,
    #[cfg(windows)] sync_taskbar_progress: Option<bool>,
  ) -> Result<(), GachaBusinessError> {
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
      GachaBusiness::ref_by(&business),
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
            GachaRecordQuestioner::create_gacha_records(database.as_ref(), records).await?;
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
