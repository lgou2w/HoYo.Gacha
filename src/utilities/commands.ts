import { invoke } from '@tauri-apps/api'
import { Account, AccountManage, GachaUrl, GameDirectory } from '@/interfaces/models'

interface InvocableCommand<R = unknown> {
  (args?: Record<string, unknown> | undefined): R extends Promise<unknown> ? R : Promise<R>
}

function declareInvocableCommand<R = unknown> (cmd: string): InvocableCommand<R> {
  return invoke.bind(undefined, cmd) as InvocableCommand<R>
}

/** Commands */

const Commands = Object.freeze({
  findAvailableGameDirectories: declareInvocableCommand<GameDirectory[]>('cmd_find_available_game_directories'),
  findRecentGachaUrlFromAccount: declareInvocableCommand<GachaUrl | null>('cmd_find_recent_gacha_url_from_account'),
  getAccountMange: declareInvocableCommand<AccountManage>('cmd_get_account_mange'),
  addAccount: declareInvocableCommand<Account>('cmd_add_account'),
  removeAccount: declareInvocableCommand<Account | null>('cmd_remove_account'),
  selectAccount: declareInvocableCommand<Account>('cmd_select_account')
})

export default Commands
