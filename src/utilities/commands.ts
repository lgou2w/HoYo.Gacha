import { invoke } from '@tauri-apps/api'
import { GameDirectory, GachaUrl, GachaLogItem } from '@/interfaces/models'

interface InvocableCommand<R = unknown> {
  (args?: Record<string, unknown> | undefined): R extends Promise<unknown> ? R : Promise<R>
}

function declareInvocableCommand<R = unknown> (cmd: string): InvocableCommand<R> {
  return invoke.bind(undefined, cmd) as InvocableCommand<R>
}

/** Commands */

const Commands = Object.freeze({
  findAvailableGameDirectories: declareInvocableCommand<GameDirectory[]>('cmd_find_available_game_directories'),
  findRecentGachaUrl: declareInvocableCommand<GachaUrl>('cmd_find_recent_gacha_url'),
  crateGachaLogFetcherChannel: declareInvocableCommand<void>('cmd_crate_gacha_log_fetcher_channel'),
  findGachaLogsByUID: declareInvocableCommand<GachaLogItem[]>('cmd_find_gacha_logs_by_uid'),
  exportGachaLogsByUID: declareInvocableCommand<void>('cmd_export_gacha_logs_by_uid')
})

export default Commands
