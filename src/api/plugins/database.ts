import { Account, AccountFacets } from '@/api/interfaces/account'
import { GachaRecord, GenshinImpactGachaRecord, HonkaiStarRailGachaRecord } from '@/api/interfaces/gacha'
import { defineCommand } from './declares'

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

// Error

const Identifier = 'DatabaseError' as const

export interface DatabaseError {
  identifier: typeof Identifier
  message: string
  code: string
}

export function isDatabaseError (error: Error | object | unknown): error is DatabaseError {
  return (error instanceof Error || typeof error === 'object') && error !== null &&
    'identifier' in error && error.identifier === Identifier
}

// Plugin

const Plugin = {
  name: PluginName,
  // Declared commands
  findAccounts: bind<void, Account[]>('find_accounts'),
  findAccountsByFacet: bind<Pick<Account, 'facet'>, Account[]>('find_accounts_by_facet'),
  findAccountById: bind<Pick<Account, 'id'>, Account | null>('find_account_by_id'),
  findAccountByFacetAndUid: bind<Pick<Account, 'facet' | 'uid'>, Account | null>('find_account_by_facet_and_uid'),
  createAccount: bind<Pick<Account, 'facet' | 'uid' | 'gameDataDir'>, Account>('create_account'),
  deleteAccount: bind<Pick<Account, 'id'>, Account | null>('delete_account'),
  updateAccountGameDataDir: bind<Pick<Account, 'gameDataDir' | 'id'>, Account | null>('update_account_game_data_dir'),
  updateAccountGachaUrl: bind<Pick<Account, 'gachaUrl' | 'gachaUrlUpdatedAt' | 'id'>, Account | null>('update_account_gacha_url'),
  updateAccountProperties: bind<Pick<Account, 'properties' | 'id'>, Account | null>('update_account_properties'),
  findGachaRecordsByFacetAndUid: bind<Pick<GachaRecord, 'facet' | 'uid'> & Partial<Pick<GachaRecord, 'gachaType'>>, GachaRecord[]>('find_gacha_records_by_facet_and_uid'),
  // Utilities
  findGenshinImpactGachaRecordsByUid (payload: Pick<GachaRecord, 'uid'> & Partial<Pick<GachaRecord, 'gachaType'>>) {
    return Plugin.findGachaRecordsByFacetAndUid({
      ...payload,
      facet: AccountFacets.GenshinImpact
    }) as Promise<GenshinImpactGachaRecord[]>
  },
  findHonkaiStarRailGachaRecordsByUid (payload: Pick<GachaRecord, 'uid'> & Partial<Pick<GachaRecord, 'gachaType'>>) {
    return Plugin.findGachaRecordsByFacetAndUid({
      ...payload,
      facet: AccountFacets.HonkaiStarRail
    }) as Promise<HonkaiStarRailGachaRecord[]>
  }
} as const

export default Plugin
