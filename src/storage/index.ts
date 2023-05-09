import { invoke } from '@tauri-apps/api'
import { AccountFacet, Account } from '@/interfaces/account'
import { GenshinGachaRecord, StarRailGachaRecord } from '@/interfaces/gacha'

export type AccountUid = Account['uid']
export type CreateAccountPayload = Omit<Account, 'id'>

export type FindGachaRecordsPayload = {
  uid: AccountUid
  gachaType?: GenshinGachaRecord['gachaType'] | StarRailGachaRecord['gachaType']
  limit?: number
}

const invokeProxy: typeof invoke = import.meta.env.DEV
  ? (...args) => {
      console.debug('invoke', ...args)
      return invoke(...args)
    }
  : invoke

export async function createAccount (payload: CreateAccountPayload): Promise<Account> {
  return invokeProxy('plugin:storage|create_account', payload)
}

export async function findAccounts (facet?: AccountFacet): Promise<Array<Account>> {
  return invokeProxy('plugin:storage|find_accounts', { facet })
}

export async function findAccount (facet: AccountFacet, uid: AccountUid): Promise<Account | never> {
  return invokeProxy('plugin:storage|find_account', { facet, uid })
}

export async function updateAccountGameDataDir (
  facet: AccountFacet,
  uid: AccountUid,
  gameDataDir: Account['gameDataDir']
): Promise<Account> {
  return invokeProxy('plugin:storage|update_account_game_data_dir', { facet, uid, gameDataDir })
}

export async function updateAccountGachaUrl (
  facet: AccountFacet,
  uid: AccountUid,
  gachaUrl: Account['gachaUrl']
): Promise<Account> {
  return invokeProxy('plugin:storage|update_account_gacha_url', { facet, uid, gachaUrl })
}

export async function updateAccountProperties (
  facet: AccountFacet,
  uid: AccountUid,
  properties: Account['properties']
): Promise<Account> {
  return invokeProxy('plugin:storage|update_account_properties', { facet, uid, properties })
}

export async function deleteAccount (facet: AccountFacet, uid: AccountUid): Promise<void> {
  return invokeProxy('plugin:storage|delete_account', { facet, uid })
}

export async function findGachaRecords (
  facet: AccountFacet,
  payload: FindGachaRecordsPayload
): Promise<Array<GenshinGachaRecord>>
export async function findGachaRecords (
  facet: AccountFacet,
  payload: FindGachaRecordsPayload
): Promise<Array<StarRailGachaRecord>>
export async function findGachaRecords (
  facet: AccountFacet,
  payload: FindGachaRecordsPayload
): Promise<Array<GenshinGachaRecord | StarRailGachaRecord>> {
  return invokeProxy(`plugin:storage|find_${facet}_gacha_records`, payload)
}

export async function saveGachaRecords (
  facet: AccountFacet.Genshin,
  records: Array<GenshinGachaRecord>
): Promise<number>
export async function saveGachaRecords (
  facet: AccountFacet.StarRail,
  records: Array<StarRailGachaRecord>
): Promise<number>
export async function saveGachaRecords (
  facet: AccountFacet,
  records: Array<GenshinGachaRecord | StarRailGachaRecord>
): Promise<number> {
  return invokeProxy(`plugin:storage|save_${facet}_gacha_records`, { records })
}

const Storage = Object.freeze({
  createAccount,
  findAccounts,
  findAccount,
  updateAccountGameDataDir,
  updateAccountGachaUrl,
  updateAccountProperties,
  deleteAccount,
  findGachaRecords,
  saveGachaRecords
})

export default Storage
