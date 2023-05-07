import { invoke } from '@tauri-apps/api'
import { AccountFacet, Account } from '@/interfaces/account'
import { GenshinGachaRecord, StarRailGachaRecord } from '@/interfaces/gacha'

type AccountUid = Account['uid']
type GachaType = GenshinGachaRecord['gachaType'] | StarRailGachaRecord['gachaType']

const invokeProxy: typeof invoke = import.meta.env.DEV
  ? (...args) => {
      console.debug('invoke', ...args)
      return invoke(...args)
    }
  : invoke

export async function upsertAccount (
  active: Partial<Account>
): Promise<Account> {
  return invokeProxy('plugin:storage|upsert_account', {
    active
  })
}

export async function findAccounts (
  facet?: AccountFacet
): Promise<Array<Account>> {
  return invokeProxy('plugin:storage|find_accounts', {
    facet
  })
}

export async function findAccount (
  facet: AccountFacet,
  uid: AccountUid
): Promise<Account | never> {
  return invokeProxy('plugin:storage|find_account', {
    facet,
    uid
  })
}

export async function removeAccount (
  facet: AccountFacet,
  uid: AccountUid
): Promise<number> {
  return invokeProxy('plugin:storage|remove_account', {
    facet,
    uid
  })
}

export async function findGachaRecords (
  facet: AccountFacet.Genshin,
  uid: AccountUid,
  gachaType?: GachaType,
  limit?: number
): Promise<Array<GenshinGachaRecord>>
export async function findGachaRecords (
  facet: AccountFacet.StarRail,
  uid: AccountUid,
  gachaType?: GachaType,
  limit?: number
): Promise<Array<StarRailGachaRecord>>
export async function findGachaRecords (
  facet: AccountFacet,
  uid: AccountUid,
  gachaType?: GachaType,
  limit?: number
): Promise<Array<GenshinGachaRecord | StarRailGachaRecord>> {
  return invokeProxy(`plugin:storage|find_${facet}_gacha_records`, {
    uid,
    gachaType,
    limit
  })
}

export async function saveGachaRecords (
  facet: AccountFacet.Genshin,
  uid: AccountUid,
  records: Array<GenshinGachaRecord>
): Promise<number>
export async function saveGachaRecords (
  facet: AccountFacet.StarRail,
  uid: AccountUid,
  records: Array<StarRailGachaRecord>
): Promise<number>
export async function saveGachaRecords (
  facet: AccountFacet,
  uid: AccountUid,
  records: Array<GenshinGachaRecord | StarRailGachaRecord>
): Promise<number> {
  return invokeProxy(`plugin:storage|save_${facet}_gacha_records`, {
    uid,
    records
  })
}

const Storage = Object.freeze({
  upsertAccount,
  findAccounts,
  findAccount,
  removeAccount,
  findGachaRecords,
  saveGachaRecords
})

export default Storage
