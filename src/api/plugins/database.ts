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
  readonly id: number
  readonly facet: AccountFacet
  readonly uid: number
  readonly gameDataDir: string
  readonly gachaUrl: string | null
  readonly gachaUrlUpdatedAt: string | null
  readonly properties: Record<string, unknown> | null
  readonly createdAt: string
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
  updateAccountGameDataDir: bind<Pick<Account, 'id' | 'gameDataDir'>, Account | null>('update_account_game_data_dir'),
  updateAccountGachaUrl: bind<Pick<Account, 'id' | 'gachaUrl' | 'gachaUrlUpdatedAt'>, Account | null>('update_account_gacha_url'),
  updateAccountProperties: bind<Pick<Account, 'id' | 'properties'>, Account | null>('update_account_properties')
} as const

export default Plugin
