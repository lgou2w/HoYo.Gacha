extern crate tauri;

use super::enka_network;
use crate::utils::ResultExt;

#[tauri::command]
pub async fn cmd_third_party_enka_network_fetch_player_info(
  uid: u32
) -> Result<enka_network::PlayerInfo, String> {
  enka_network::fetch_player_info(uid)
    .await
    .map_err_to_string()
}
