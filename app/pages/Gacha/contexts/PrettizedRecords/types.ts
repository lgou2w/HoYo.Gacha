import { Account, AccountBusiness, MiliastraWonderland } from '@/api/schemas/Account'
import { GachaRecord, GachaType } from '@/api/schemas/GachaRecord'

// See: tauri/src/business/prettized_records.rs

export enum ItemCategory {
  Character = 'Character',
  Weapon = 'Weapon',
  Bangboo = 'Bangboo',
  InteractiveActions = 'InteractiveActions',
  InteractiveExpressions = 'InteractiveExpressions',
  CosmeticComponent = 'CosmeticComponent',
  CosmeticSet = 'CosmeticSet',
  CosmeticCatalog = 'CosmeticCatalog',
}

export interface UsedPity {
  value: number
  progress: number
}

export interface PrettizedRecord extends Pick<
  GachaRecord<AccountBusiness>,
  | 'id'
  | 'time'
  | 'itemId'
  | 'itemName'
> {
  // See above
  itemCategory?: ItemCategory | null

  // 'Purple' and 'Golden' only
  usedPity?: UsedPity | null
  isUp?: boolean | null
  //

  // Game version: 1.0, 2.1
  version?: string | null

  // 'Genshin Impact' Character only, Distinguish Character and Character-2
  genshinImpactCharacter2?: boolean | null

  // 'Genshin Impact: Miliastra Wonderland' EventOde only,
  // Distinguish EventOde-1_1, EventOde-1_2, EventOde-2_1, EventOde-2_2
  miliastraWonderlandEventOde?: Exclude<GachaType<MiliastraWonderland>, 1000> | null
}

export enum PrettizedCategory {
  // All
  Permanent = 'Permanent',
  Character = 'Character',
  Weapon = 'Weapon',

  // 'Genshin Impact' and 'Honkai: Star Rail' only
  Beginner = 'Beginner',
  //

  // 'Genshin Impact' only
  Chronicled = 'Chronicled',
  //

  // 'Honkai: Star Rail' only
  CollaborationCharacter = 'CollaborationCharacter',
  CollaborationWeapon = 'CollaborationWeapon',
  //

  // 'Zenless Zone Zero' only
  Bangboo = 'Bangboo',
  //

  // 'Genshin Impact: Miliastra Wonderland' only
  PermanentOde = 'PermanentOde',
  EventOde = 'EventOde',
  //
}

export const Aggregated = 'Aggregated' as const
export type Aggregated = typeof Aggregated

export interface PrettizedRecords<T extends AccountBusiness> {
  business: T
  uid: Account['uid']
  total: number
  startTime?: string | null
  endTime?: string | null
  gachaTypeCategories: Record<GachaRecord<T>['gachaType'], PrettizedCategory>
  categorizeds: Record<PrettizedCategory, CategorizedRecords<T> | null>
  aggregated: T extends MiliastraWonderland
    ? never
    : AggregatedRecords
}

export interface CategorizedRecords<T extends AccountBusiness> {
  category: PrettizedCategory
  gachaType: GachaRecord<T>['gachaType']
  total: number
  startTime?: string | null
  endTime?: string | null
  lastEndId?: GachaRecord<T>['id'] | null
  rankings: CategorizedRecordsRankings
}

export enum CategorizedRecordsRanking {
  Green = 'green',
  Blue = 'blue',
  Purple = 'purple',
  Golden = 'golden',
}

export interface CategorizedRecordsRankings {
  [CategorizedRecordsRanking.Green]: CategorizedRecordsGreenRanking | null
  [CategorizedRecordsRanking.Blue]: CategorizedRecordsBlueRanking
  [CategorizedRecordsRanking.Purple]: CategorizedRecordsPurpleRanking
  [CategorizedRecordsRanking.Golden]: CategorizedRecordsGoldenRanking
}

export interface CategorizedRecordsGreenRanking {
  values: PrettizedRecord[]
  sum: number
  percentage: number
}

export interface CategorizedRecordsBlueRanking
  extends CategorizedRecordsGreenRanking {
  average: number
  nextPity: UsedPity
}

export interface CategorizedRecordsPurpleRanking
  extends CategorizedRecordsBlueRanking {
  up: {
    sum: number
    average: number
    percentage: number
  }
}

export interface CategorizedRecordsGoldenRanking
  extends CategorizedRecordsPurpleRanking {
  upWin: {
    sum: number
    percentage: number
  }
}

export interface AggregatedRecords {
  total: number
  startTime?: string | null
  endTime?: string | null
  rankings: CategorizedRecordsRankings
  tags: AggregatedGoldenTags
}

export interface AggregatedGoldenTags {
  luck?: PrettizedRecord | null
  unluck?: PrettizedRecord | null
  relation?: [PrettizedRecord, number] | null
  crazy?: [number /* Unix timestamp in seconds */, number] | null
  recent?: [number /* Unix timestamp in seconds */, number] | null
}
