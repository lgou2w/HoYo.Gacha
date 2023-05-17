import { Account, AccountFacet } from '@/interfaces/account'
import { GenshinGachaRecord, StarRailGachaRecord } from '@/interfaces/gacha'
import invoke from '@/utilities/invoke'

export async function findGameDataDirectories (facet: AccountFacet): Promise<string[]> {
  return invoke('plugin:gacha|find_game_data_directories', { facet })
}

export async function findGachaUrl (
  facet: AccountFacet,
  uid: Account['uid'],
  gameDataDir: string
): Promise<string> {
  return invoke('plugin:gacha|find_gacha_url', { facet, uid, gameDataDir })
}

export async function pullAllGachaRecords (
  facet: AccountFacet,
  uid: Account['uid'],
  payload: {
    gachaUrl: string
    gachaTypeAndLastEndIdMappings: Record<
      GenshinGachaRecord['gacha_type'] | StarRailGachaRecord['gacha_type'],
      GenshinGachaRecord['id'] | StarRailGachaRecord['id'] | null
    >
    eventChannel: string
    saveToStorage?: boolean
  }
): Promise<void> {
  return invoke('plugin:gacha|pull_all_gacha_records', {
    facet,
    uid,
    ...payload
  })
}

const PluginGacha = Object.freeze({
  findGameDataDirectories,
  findGachaUrl,
  pullAllGachaRecords
})

export default PluginGacha