import { AccountFacet, AccountFacets } from './account'

// GachaRecord
//   See: src-tauri/src/database/entity_gacha_record.rs

// Declares

export const RankTypes = {
  Blue: 3,
  Purple: 4,
  Golden: 5
} as const

export type RankType = typeof RankTypes[keyof typeof RankTypes]

// Stricter type inference based on facet
//   ON `facet` = 0 -> `gachaType` = 100 | 200 | 301 | 400 | 302
//                  -> `gachaId` and `itemId` === null
//   ON `facet` = 1 -> `gachaType` = 1 | 2 | 11 | 12
//                  -> `gachaId` and `itemId` !== null
export type GachaRecord<Facet = AccountFacet> = {
  id: string
  facet: Facet
  uid: number
  gachaType: number
  gachaId: number | null
  rankType: RankType
  count: number
  time: string
  lang: string
  name: string
  itemType: string
  itemId: string | null
} & (
  // Genshin Impact
  Facet extends 0 ? {
    gachaType: 100 | 200 | 301 | 400 | 302
    gachaId: null
    itemId: null
  }
  // Honkai: Star Rail
  : Facet extends 1 ? {
    gachaType: 1 | 2 | 11 | 12
    gachaId: number
    itemId: string
  }
  : NonNullable<unknown>
)

export type GenshinGachaRecord = GachaRecord<0>
export type StarRailGachaRecord = GachaRecord<1>

// Utilities

export function isGenshinGachaRecord (record: GachaRecord): record is GenshinGachaRecord {
  return record.facet === AccountFacets.Genshin
}

export function isStarRailGachaRecord (record: GachaRecord): record is StarRailGachaRecord {
  return record.facet === AccountFacets.StarRail
}

export function isRankBlueGachaRecord (record: GachaRecord): boolean {
  return record.rankType === RankTypes.Blue
}

export function isRankPurpleGachaRecord (record: GachaRecord): boolean {
  return record.rankType === RankTypes.Purple
}

export function isRankGoldenGachaRecord (record: GachaRecord): boolean {
  return record.rankType === RankTypes.Golden
}
