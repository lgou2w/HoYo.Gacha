extern crate reqwest;
extern crate tauri;
extern crate time;

use super::srgf;
use super::uigf;
use super::utilities::{create_default_reqwest, find_gacha_url_and_validate_consistency};
use super::{
    create_fetcher_channel, GachaRecordFetcherChannelFragment, GachaUrlFinder,
    GameDataDirectoryFinder, GenshinGacha, StarRailGacha,
};
use crate::constants;
use crate::error::{Error, Result};
use crate::storage::entity_account::AccountFacet;
use crate::storage::Storage;
use std::collections::BTreeMap;
use std::fs::File;
use std::path::PathBuf;
use tauri::plugin::{Builder as TauriPluginBuilder, TauriPlugin};
use time::format_description;
use time::{OffsetDateTime, UtcOffset};
use tracing::debug;

/// Tauri commands

#[tauri::command]
async fn find_game_data_directories(facet: AccountFacet) -> Result<Vec<PathBuf>> {
    match facet {
        AccountFacet::Genshin => GenshinGacha.find_game_data_directories(),
        AccountFacet::StarRail => StarRailGacha.find_game_data_directories(),
    }
}

#[tauri::command]
async fn find_gacha_url(
    facet: AccountFacet,
    uid: String,
    game_data_dir: PathBuf,
) -> Result<String> {
    let gacha_url = match facet {
        AccountFacet::Genshin => {
            let gacha_urls = GenshinGacha.find_gacha_urls(game_data_dir)?;
            find_gacha_url_and_validate_consistency(&GenshinGacha, &facet, &uid, &gacha_urls)
                .await?
        }
        AccountFacet::StarRail => {
            let gacha_urls = StarRailGacha.find_gacha_urls(game_data_dir)?;
            find_gacha_url_and_validate_consistency(&StarRailGacha, &facet, &uid, &gacha_urls)
                .await?
        }
    };

    debug!("{}", gacha_url.to_string());

    Ok(gacha_url.to_string())
}

#[allow(clippy::too_many_arguments)]
#[tauri::command]
async fn pull_all_gacha_records(
    window: tauri::Window,
    storage: tauri::State<'_, Storage>,
    facet: AccountFacet,
    #[allow(unused)] uid: String,
    gacha_url: String,
    gacha_type_and_last_end_id_mappings: BTreeMap<String, Option<String>>,
    event_channel: String,
    save_to_storage: Option<bool>,
) -> Result<()> {
    let reqwest = create_default_reqwest()?;
    let save_to_storage = save_to_storage.unwrap_or(false);

    // TODO: validate uid and gacha_url consistency ?

    match facet {
        AccountFacet::Genshin => {
            create_fetcher_channel(
                GenshinGacha,
                reqwest,
                GenshinGacha,
                gacha_url,
                gacha_type_and_last_end_id_mappings,
                |fragment| async {
                    window.emit(&event_channel, &fragment)?;
                    if save_to_storage {
                        if let GachaRecordFetcherChannelFragment::Data(data) = fragment {
                            storage.save_genshin_gacha_records(&data).await?;
                        }
                    }
                    Ok(())
                },
            )
            .await?
        }
        AccountFacet::StarRail => {
            create_fetcher_channel(
                StarRailGacha,
                reqwest,
                StarRailGacha,
                gacha_url,
                gacha_type_and_last_end_id_mappings,
                |fragment| async {
                    window.emit(&event_channel, &fragment)?;
                    if save_to_storage {
                        if let GachaRecordFetcherChannelFragment::Data(data) = fragment {
                            storage.save_starrail_gacha_records(&data).await?;
                        }
                    }
                    Ok(())
                },
            )
            .await?
        }
    }

    Ok(())
}

#[tauri::command]
async fn import_gacha_records(
    storage: tauri::State<'_, Storage>,
    facet: AccountFacet,
    uid: String,
    file: String,
) -> Result<u64> {
    let file = File::open(file)?;

    match facet {
        AccountFacet::Genshin => {
            let mut uigf = uigf::UIGF::from_reader(file)?;
            if uigf.info.uid != uid {
                return Err(Error::UIGFOrSRGFMismatchedUID {
                    expected: uid,
                    actual: uigf.info.uid,
                });
            }

            let gacha_records = uigf::convert_uigf_to_offical(&mut uigf)?;
            storage.save_genshin_gacha_records(&gacha_records).await
        }
        AccountFacet::StarRail => {
            let mut srgf = srgf::SRGF::from_reader(file)?;
            if srgf.info.uid != uid {
                return Err(Error::UIGFOrSRGFMismatchedUID {
                    expected: uid,
                    actual: srgf.info.uid,
                });
            }

            let gacha_records = srgf::convert_srgf_to_offical(&mut srgf)?;
            storage.save_starrail_gacha_records(&gacha_records).await
        }
    }
}

#[tauri::command]
async fn export_gacha_records(
    storage: tauri::State<'_, Storage>,
    facet: AccountFacet,
    uid: String,
    directory: String,
) -> Result<PathBuf> {
    let locale_offset = UtcOffset::current_local_offset().map_err(time::Error::from)?;
    let now = OffsetDateTime::now_utc().to_offset(locale_offset);

    let directory = PathBuf::from(directory);
    if !directory.exists() {
        std::fs::create_dir(&directory)?;
    }

    // output file
    let format = format_description::parse("[year][month][day]_[hour][minute][second]")
        .map_err(time::Error::from)?;
    let time = now.format(&format).map_err(time::Error::from)?;

    let (primary, format) = match facet {
        AccountFacet::Genshin => ("Original God Prayer Record", "UIGF"),
        AccountFacet::StarRail => ("Star Dome Railway Jump Record", "SRGF"),
    };
    let filename = format!(
        "{}_{}_{}_{uid}_{time}.json",
        constants::NAME,
        primary,
        format
    );
    let filename = directory.join(filename);
    let writer = File::create(&filename)?;

    match facet {
        AccountFacet::Genshin => {
            let gacha_records = storage.find_genshin_gacha_records(&uid, None, None).await?;
            let lang = gacha_records
                .first()
                .map(|v| v.lang.clone())
                .unwrap_or("zh-cn".to_owned());

            // convert to uigf and write
            let uigf_list = uigf::convert_offical_to_uigf(&gacha_records)?;
            let uigf = uigf::UIGF::new(uid, lang, &now, uigf_list)?;
            uigf.to_writer(writer, false)?;
        }
        AccountFacet::StarRail => {
            let gacha_records = storage
                .find_starrail_gacha_records(&uid, None, None)
                .await?;
            let lang = gacha_records
                .first()
                .map(|v| v.lang.clone())
                .unwrap_or("en-us".to_owned());
            let time_zone = 8; // TODO: export time zone

            // convert to srgf and write
            let srgf_list = srgf::convert_offical_to_srgf(&gacha_records)?;
            let srgf = srgf::SRGF::new(uid, lang, time_zone, &now, srgf_list)?;
            srgf.to_writer(writer, false)?;
        }
    }

    Ok(filename)
}

/// Tauri plugin

#[derive(Default)]
pub struct GachaPluginBuilder {}

impl GachaPluginBuilder {
    const PLUGIN_NAME: &str = "gacha";

    pub fn new() -> Self {
        Self::default()
    }

    pub fn build(self) -> TauriPlugin<tauri::Wry> {
        TauriPluginBuilder::new(Self::PLUGIN_NAME)
            .invoke_handler(tauri::generate_handler![
                find_game_data_directories,
                find_gacha_url,
                pull_all_gacha_records,
                import_gacha_records,
                export_gacha_records
            ])
            .build()
    }
}
