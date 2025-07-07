import { Business, Businesses, GenshinImpact, HonkaiStarRail, ZenlessZoneZero } from './Business'

// GachaRecord
//   See: src-tauri/src/models/gacha_record.rs

export type GachaRecord<T extends Business> = {
  business: T
  uid: number
  id: string
  gachaType:
      T extends GenshinImpact ? 100 | 200 | 301 | 400 | 302 | 500
    : T extends HonkaiStarRail ? 1 | 2 | 11 | 12 | 21 | 22
    : T extends ZenlessZoneZero ? 1 | 2 | 3 | 5
    : never
  gachaId:
      T extends GenshinImpact ? null
    : T extends HonkaiStarRail | ZenlessZoneZero ? number
    : never
  rankType:
      T extends GenshinImpact | HonkaiStarRail ? 3 | 4 | 5
    : T extends ZenlessZoneZero ? 2 | 3 | 4
    : never
  count: number
  time: string
  lang: string
  name: string
  itemType: string
  itemId: string | null
}

export type GenshinImpactGachaRecord = GachaRecord<GenshinImpact>
export type HonkaiStarRailGachaRecord = GachaRecord<HonkaiStarRail>
export type ZenlessZoneZeroGachaRecord = GachaRecord<ZenlessZoneZero>

// Prettized

export interface PrettyGachaRecord {
  id: GachaRecord<Business>['id']
  // See: src-tauri/src/models/gacha_metadata.rs::GachaMetadata::KNOWN_CATEGORIES
  itemCategory: 'Character' | 'Weapon' | 'Bangboo'
  itemId: NonNullable<GachaRecord<Business>['itemId']>
  name: GachaRecord<Business>['name']
  time: GachaRecord<Business>['time']
  usedPity: number | undefined // Purple and Golden only
  limited: boolean | undefined // Golden only
}

export enum PrettyCategory {
  Beginner = 'Beginner', // 'Genshin Impact' and 'Honkai: Star Rail' only
  Permanent = 'Permanent',
  Character = 'Character',
  Weapon = 'Weapon',
  Chronicled = 'Chronicled', // 'Genshin Impact' only
  Bangboo = 'Bangboo', // 'Zenless Zone Zero' only
  CollaborationCharacter = 'CollaborationCharacter', // 'Honkai: Star Rail' only
  CollaborationWeapon = 'CollaborationWeapon', // 'Honkai: Star Rail' only
}

export interface CategorizedMetadataBlueRanking {
  // HACK: The values of 3-star items are not needed for the time being.
  // values: PrettyGachaRecord[]
  sum: number
  percentage: number
}

export interface CategorizedMetadataPurpleRanking
extends CategorizedMetadataBlueRanking {
  values: PrettyGachaRecord[]
  average: number
  nextPity: number
}

export interface CategorizedMetadataGoldenRanking
extends CategorizedMetadataPurpleRanking {
  limitedSum: number
  limitedPercentage: number
  limitedAverage: number
}

export interface CategorizedMetadataRankings {
  blue: CategorizedMetadataBlueRanking
  purple: CategorizedMetadataPurpleRanking
  golden: CategorizedMetadataGoldenRanking
}

export interface CategorizedMetadata<T extends Business> {
  category: PrettyCategory
  total: number
  gachaType: GachaRecord<T>['gachaType']
  startTime: string | null
  endTime: string | null
  lastEndId: GachaRecord<T>['id'] | null
  rankings: CategorizedMetadataRankings
}

export type AggregatedGoldenTag =
  | { Luck: PrettyGachaRecord }
  | { Unluck: PrettyGachaRecord }
  | { Relation: { record: PrettyGachaRecord, sum: number } }
  | { Crazy: { time: string, sum: number } }

export interface AggregatedMetadata {
  total: number
  startTime: string | null
  endTime: string | null
  rankings: CategorizedMetadataRankings
  goldenTags: AggregatedGoldenTag[]
}

export interface PrettizedGachaRecords<T extends Business = Business> {
  business: T,
  uid: number
  total: number
  startTime: string | null
  endTime: string | null
  gachaTypeCategories: Record<GachaRecord<T>['gachaType'], PrettyCategory>
  categorizeds: Record<PrettyCategory, CategorizedMetadata<T> | null>
  aggregated: AggregatedMetadata
}

// Utilities

export type GachaTypeAndLastEndIdMappings<T extends Business = Business>
  = Array<[GachaRecord<T>['gachaType'], GachaRecord<T>['id'] | null]>

export function computeGachaTypeAndLastEndIdMappings<T extends Business = Business> (
  business: Business,
  categorizeds: PrettizedGachaRecords<T>['categorizeds'],
  excludeBeginner: boolean = true,
) {
  const result: GachaTypeAndLastEndIdMappings<T> = []

  for (const category in categorizeds) {
    const categorized = categorizeds[category as PrettyCategory]
    if (!categorized) {
      continue
    }

    const isBeginner = categorized.category === PrettyCategory.Beginner
    if (isBeginner && excludeBeginner) {
      // HACK:
      //   Genshin Impact    : Beginner Gacha Pool = 20 times
      //   Honkai: Star Rail :                     = 50 times
      //   Zenless Zone Zero : Useless
      const exclude =
        (business === Businesses.GenshinImpact && categorized.total >= 20) ||
        (business === Businesses.HonkaiStarRail && categorized.total >= 50)

      if (exclude) {
        console.debug('Exclude beginner banner, because it has reached the limit')
        continue
      }
    }

    result.push([
      categorized.gachaType,
      categorized.lastEndId ?? null,
    ])
  }

  return result
}
