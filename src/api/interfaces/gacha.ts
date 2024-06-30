import { Business, Businesses } from './account'

// GachaRecord
//   See: src-tauri/src/models/gacha_record.rs

// Declares

export const GachaRecordRanks = {
  Blue: 3,
  Purple: 4,
  Orange: 5
} as const

export type GachaRecordRank = typeof GachaRecordRanks[keyof typeof GachaRecordRanks]

// Stricter type inference based on business
//   ON `business` = 0 -> `gachaType` = 100 | 200 | 301 | 400 | 302
//                     -> `gachaId` === null
//   ON `business` = 1 -> `gachaType` = 1 | 2 | 11 | 12
//                     -> `gachaId` !== null
export type GachaRecord<T = Business> = {
  id: string
  business: T
  uid: number
  gachaType: number
  gachaId: number | null
  rankType: GachaRecordRank
  count: number
  time: string
  lang: string
  name: string
  itemType: string
  itemId: string
} & (
  // Genshin Impact
  T extends 0 ? {
    gachaType: 100 | 200 | 301 | 400 | 302
    gachaId: null
  }
  // Honkai: Star Rail
  : Business extends 1 ? {
    gachaType: 1 | 2 | 11 | 12
    gachaId: number
  }
  // Zenless Zone Zero
  // : Business extends 2 ? {}
  : NonNullable<unknown>
)

export type GenshinImpactGachaRecord = GachaRecord<0>
export type HonkaiStarRailGachaRecord = GachaRecord<1>
// export type ZenlessZoneZeroGachaRecord = GachaRecord<2>

// Utilities

export function isGenshinImpactGachaRecord (record: GachaRecord): record is GenshinImpactGachaRecord {
  return record.business === Businesses.GenshinImpact
}

export function isHonkaiStarRailGachaRecord (record: GachaRecord): record is HonkaiStarRailGachaRecord {
  return record.business === Businesses.HonkaiStarRail
}

// export function isZenlessZoneZeroGachaRecord (record: GachaRecord): record is ZenlessZoneZeroGachaRecord {
//   return record.business === Businesses.ZenlessZoneZero
// }

export function isRankBlueGachaRecord<T> (record: GachaRecord<T>): boolean {
  return record.rankType === GachaRecordRanks.Blue
}

export function isRankPurpleGachaRecord<T> (record: GachaRecord<T>): boolean {
  return record.rankType === GachaRecordRanks.Purple
}

export function isRankOrangeGachaRecord<T> (record: GachaRecord<T>): boolean {
  return record.rankType === GachaRecordRanks.Orange
}

export function sortGachaRecord<T> (a: GachaRecord<T>, b: GachaRecord<T>): number {
  return a.id.localeCompare(b.id)
}
