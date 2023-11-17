import { Account, AccountFacets } from '@/api/interfaces/account'
import { GachaRecord, GenshinGachaRecord, StarRailGachaRecord } from '@/api/interfaces/gacha'
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

// Plugin

const Plugin = {
  name: PluginName,
  // Declared commands
  findAccounts: bind<void, Account[]>('find_accounts'),
  findAccountsByFacet: bind<Pick<Account, 'facet'>, Account[]>('find_accounts_by_facet'),
  findAccountById: bind<Pick<Account, 'id'>, Account | null>('find_account_by_id'),
  findAccountByFacetAndUid: bind<Pick<Account, 'facet' | 'uid'>, Account | null>('find_account_by_facet_and_uid'),
  createAccount: bind<Pick<Account, 'facet' | 'uid' | 'gameDataDir'>, Account | null>('create_account'),
  deleteAccount: bind<Pick<Account, 'id'>, Account | null>('delete_account'),
  updateAccountGameDataDir: bind<Pick<Account, 'gameDataDir' | 'id'>, Account | null>('update_account_game_data_dir'),
  updateAccountGachaUrl: bind<Pick<Account, 'gachaUrl' | 'gachaUrlUpdatedAt' | 'id'>, Account | null>('update_account_gacha_url'),
  updateAccountProperties: bind<Pick<Account, 'properties' | 'id'>, Account | null>('update_account_properties'),
  findGachaRecordsByFacetAndUid: bind<Pick<GachaRecord, 'facet' | 'uid'> & Partial<Pick<GachaRecord, 'gachaType'>>, GachaRecord[]>('find_gacha_records_by_facet_and_uid'),
  // Utilities
  findGenshinGachaRecordsByUid (payload: Pick<GachaRecord, 'uid'> & Partial<Pick<GachaRecord, 'gachaType'>>) {
    return Plugin.findGachaRecordsByFacetAndUid({
      ...payload,
      facet: AccountFacets.Genshin
    }) as Promise<GenshinGachaRecord[]>
  },
  findStarRailGachaRecordsByUid (payload: Pick<GachaRecord, 'uid'> & Partial<Pick<GachaRecord, 'gachaType'>>) {
    return Plugin.findGachaRecordsByFacetAndUid({
      ...payload,
      facet: AccountFacets.StarRail
    }) as Promise<StarRailGachaRecord[]>
  }
} as const

export default Plugin
