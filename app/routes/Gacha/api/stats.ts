import { Account, AccountBusiness, MiliastraWonderland } from '@/api/Account'
import { GachaRecord, GachaType } from '@/api/GachaRecord'

// See: tauri/src/business/stats.rs

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
  progress: number // 0 ~ 100
}

export interface StatsRecord extends Pick<
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

export enum BannerCategory {
  // All
  Permanent = 'Permanent',
  Character = 'Character',
  Weapon = 'Weapon',

  // 'Genshin Impact' and 'Honkai: Star Rail' only
  Beginner = 'Beginner',
  //

  // 'Genshin Impact' only
  ChronicledAndLightrace = 'ChronicledAndLightrace',
  //

  // 'Honkai: Star Rail' only
  CollabCharacter = 'CollabCharacter',
  CollabWeapon = 'CollabWeapon',
  //

  // 'Zenless Zone Zero' only
  Bangboo = 'Bangboo',
  //

  // 'Genshin Impact: Miliastra Wonderland' only
  PermanentOde = 'PermanentOde',
  EventOde = 'EventOde',
  //

  // 'Zenless Zone Zero' only
  ExclusiveRescreening = 'ExclusiveRescreening',
  WEngineReverberation = 'WEngineReverberation',
  //
}

export interface GachaStats<T extends AccountBusiness> {
  business: T
  uid: Account['uid']
  total: number
  startTime?: string | null
  endTime?: string | null
  gachaTypeCategories: Record<GachaRecord<T>['gachaType'], BannerCategory>
  banners: Record<BannerCategory, BannerStats<T> | null>
  aggregated: T extends MiliastraWonderland
    ? never
    : AggregatedStats
  gachaRanges: [GachaType<T>, GachaRecord<T>['id'] | null][]
}

export interface BannerStats<T extends AccountBusiness> {
  category: BannerCategory
  gachaType: GachaRecord<T>['gachaType']
  total: number
  startTime?: string | null
  endTime?: string | null
  lastEndId?: GachaRecord<T>['id'] | null
  rarity: RarityStatsMap
}

export enum Rarity {
  Green = 'green',
  Blue = 'blue',
  Purple = 'purple',
  Golden = 'golden',
}

export interface RarityStatsMap {
  // Only 'Genshin Impact: Miliastra Wonderland' has Green rarity
  [Rarity.Green]: RarityStats | null | undefined
  [Rarity.Blue]: PityRarityStats
  [Rarity.Purple]: UpRarityStats
  [Rarity.Golden]: UpWinRarityStats
}

export interface RarityStats<WithValues = boolean> {
  values: WithValues extends true ? StatsRecord[] : null | undefined
  sum: number
  percentage: number
}

export interface PityRarityStats extends RarityStats {
  usedPitySum: number
  average: number
  nextPity: UsedPity
}

export interface UpRarityStats extends RarityStats<true> {
  usedPitySum: number
  average: number
  nextPity: UsedPity
  up: {
    sum: number
    usedPitySum: number
    average: number
    percentage: number
  }
}

export interface UpWinRarityStats extends UpRarityStats {
  upWin: {
    sum: number
    usedPitySum: number
    percentage: number
  }
}

export interface AggregatedStats {
  total: number
  startTime?: string | null
  endTime?: string | null
  rarity: RarityStatsMap
  tags: AggregatedTags
}

export interface BannerTaggedRecord {
  record: StatsRecord
  category?: BannerCategory | null
}

export interface RelationTag {
  record: StatsRecord
  category?: BannerCategory | null
  count: number
}

export interface DailyTag {
  /** Unix timestamp in seconds (UTC). */
  timestamp: number
  count: number
}

export interface AggregatedTags {
  luck?: BannerTaggedRecord | null
  unluck?: BannerTaggedRecord | null
  relation?: RelationTag | null
  crazy?: DailyTag | null
  recent?: DailyTag | null
}
