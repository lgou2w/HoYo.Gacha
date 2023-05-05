import { invoke } from '@tauri-apps/api'
import { GenshinGachaRecord, StarRailGachaRecord } from '@/interfaces/gacha'

export enum GachaFacet {
  Genshin = 'genshin',
  StarRail = 'starrail'
}

export async function findGachaRecords (
  facet: GachaFacet.Genshin,
  uid: string,
  gachaType?: string,
  limit?: number
): Promise<Array<GenshinGachaRecord>>
export async function findGachaRecords (
  facet: GachaFacet.StarRail,
  uid: string,
  gachaType?: string,
  limit?: number
): Promise<Array<StarRailGachaRecord>>
export async function findGachaRecords (
  facet: GachaFacet,
  uid: string,
  gachaType?: string,
  limit?: number
): Promise<Array<GenshinGachaRecord | StarRailGachaRecord>> {
  return invoke(`plugin:storage-gacha|find_${facet}_gacha_records`, {
    uid,
    gachaType,
    limit
  })
}

export async function saveGachaRecords (
  facet: GachaFacet.Genshin,
  uid: string,
  records: Array<GenshinGachaRecord>
): Promise<number>
export async function saveGachaRecords (
  facet: GachaFacet.StarRail,
  uid: string,
  records: Array<StarRailGachaRecord>
): Promise<number>
export async function saveGachaRecords (
  facet: GachaFacet,
  uid: string,
  records: Array<GenshinGachaRecord | StarRailGachaRecord>
): Promise<number> {
  return invoke(`plugin:storage-gacha|save_${facet}_gacha_records`, {
    uid,
    records
  })
}
