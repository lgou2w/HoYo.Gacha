import { invoke } from '@tauri-apps/api'

export async function findGameDataDir (): Promise<string> {
  return invoke('cmd_find_game_data_dir')
}

export async function findRecentGachaUrl (): Promise<{
  addr: number
  creation_time: string
  url: string
}> {
  return invoke('cmd_find_recent_gacha_url')
}
