import { defineCommand } from './index'

// See: src-tauri/src/database/plugin.rs

export const PluginName = 'hg_database'

type Command =
  | 'find_accounts'
  | 'find_accounts_by_facet'
  | 'find_account_by_id'
  | 'find_account_by_facet_and_uid'
  | 'create_account'
  | 'delete_account'
  | 'update_account_game_data_dir'
  | 'update_account_gacha_url'
  | 'update_account_properties'

function bind<Payload = void, Result = void> (command: Command) {
  return defineCommand<Payload, Result>(PluginName, command)
}

// Account
//   See: src-tauri/src/database/entity_account.rs

export type AccountFacet = 0 | 1

export interface Account {
  id: number
  facet: AccountFacet
  uid: number
  gameDataDir: string
  gachaUrl: string | null
  gachaUrlUpdatedAt: string | null
  properties: Record<string, unknown> | null
  createdAt: string
}

// Plugin

const Plugin = {
  name: PluginName,
  findAccounts: bind<void, Account[]>('find_accounts'),
  findAccountsByFacet: bind<Pick<Account, 'facet'>, Account[]>('find_accounts_by_facet'),
  findAccountById: bind<Pick<Account, 'id'>, Account | null>('find_account_by_id'),
  findAccountByFacetAndUid: bind<Pick<Account, 'facet' | 'uid'>, Account | null>('find_account_by_facet_and_uid'),
  createAccount: bind<Pick<Account, 'facet' | 'uid' | 'gameDataDir'>, Account>('create_account'),
  deleteAccount: bind<Pick<Account, 'id'>, Account | null>('delete_account'),
  updateAccountGameDataDir: bind<Pick<Account, 'gameDataDir' | 'id'>, Account | null>('update_account_game_data_dir'),
  updateAccountGachaUrl: bind<Pick<Account, 'gachaUrl' | 'gachaUrlUpdatedAt' | 'id'>, Account | null>('update_account_gacha_url'),
  updateAccountProperties: bind<Pick<Account, 'properties' | 'id'>, Account | null>('update_account_properties')
} as const

export default Plugin
