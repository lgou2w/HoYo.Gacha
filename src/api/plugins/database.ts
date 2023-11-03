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
  | 'find_gacha_records_by_facet_and_uid'

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

// GachaRecord
//   See: src-tauri/src/database/entity_gacha_record.rs

export type GachaRecordRankType = 3 | 4 | 5

// TODO: Stricter type inference based on facet ?
//   ON `facet` = 0 -> `gachaType` = 100 | 200 | 301 | 400 | 401
//                  -> `gachaId` === null
//   ON `facet` = 1 -> `gachaType` = 1 | 2 | 11 | 12
//                  -> `gachaId` !== null
export interface GachaRecord {
  id: string
  facet: AccountFacet
  uid: number
  gachaType: number
  gachaId: number | null
  rankType: GachaRecordRankType
  count: number
  time: string
  lang: string
  name: string
  itemType: string
  itemId: string | null
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
  updateAccountProperties: bind<Pick<Account, 'properties' | 'id'>, Account | null>('update_account_properties'),
  findGachaRecordsByFacetAndUid: bind<Pick<GachaRecord, 'facet' | 'uid'> & Partial<Pick<GachaRecord, 'gachaType'>>, GachaRecord[]>('find_gacha_records_by_facet_and_uid')
} as const

export default Plugin
