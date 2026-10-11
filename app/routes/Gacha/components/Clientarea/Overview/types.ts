import { AccountBusiness } from '@/api/Account'
import { LanguageMetadata } from '@/i18n'
import { AggregatedStats, BannerCategory, BannerStats, Rarity, StatsRecord, UsedPity } from '@/routes/Gacha/api/stats'

export const Aggregated = 'Aggregated'
export type Aggregated = typeof Aggregated

export type GridItemId = BannerCategory | Aggregated

/**
 * Default banner order. `Aggregated` is always last and cannot be dragged.
 */
export const DefaultBannerOrders: GridItemId[] = [
  BannerCategory.Character,
  BannerCategory.Weapon,
  BannerCategory.CollabCharacter,
  BannerCategory.CollabWeapon,
  BannerCategory.ChronicledAndLightrace,
  BannerCategory.Permanent,
  BannerCategory.Bangboo,
  BannerCategory.Beginner,
  BannerCategory.PermanentOde,
  BannerCategory.EventOde,
  BannerCategory.ExclusiveRescreening,
  BannerCategory.WEngineReverberation,
  Aggregated,
]

export type GridItemDataset
  = | BannerStats<AccountBusiness>
    | AggregatedStats

interface GridItemDerivedBase {
  isBeginner: boolean
  isPermanent: boolean
  isChronicledAndLightrace: boolean
  isBangboo: boolean
  isPermanentOde: boolean
  isEventOde: boolean

  timeRange: string | null
  [Rarity.Golden]: BannerStats<AccountBusiness>['rarity'][Rarity.Golden]
  [Rarity.Purple]: BannerStats<AccountBusiness>['rarity'][Rarity.Purple]
  hasUp: boolean
  total: number
  sum: number
  usedPitySum: number
  average: number
  percentage: number
  nextPity: UsedPity
  up: GridItemDerivedBase[Rarity.Golden]['up'] | null
  showcase: StatsRecord | null
  showcaseRarity: Rarity
}

export interface BannerGridItemDerived extends GridItemDerivedBase {
  isBanner: true
  isAggregated: false
  category: BannerCategory
}

export interface AggregatedGridItemDerived extends GridItemDerivedBase {
  isBanner: false
  isAggregated: true
  category: Aggregated
}

export type GridItemDerived = BannerGridItemDerived | AggregatedGridItemDerived

export function deriveGridItem (
  dataset: GridItemDataset,
  dayjs: LanguageMetadata['dayjs'],
): GridItemDerived {
  const isBanner = 'category' in dataset
  const category: GridItemId = isBanner ? dataset.category : Aggregated

  const isBeginner = category === BannerCategory.Beginner
  const isPermanent = category === BannerCategory.Permanent
  const isChronicledAndLightrace = category === BannerCategory.ChronicledAndLightrace
  const isBangboo = category === BannerCategory.Bangboo
  const isPermanentOde = category === BannerCategory.PermanentOde
  const isEventOde = category === BannerCategory.EventOde

  let timeRange: string | null = null
  if (dataset.startTime && dataset.endTime) {
    const start = dayjs(dataset.startTime).format('L')
    const end = dayjs(dataset.endTime).format('L')
    timeRange = `${start} - ${end}`.replace(/\//g, '.')
  }

  const golden = dataset.rarity[Rarity.Golden]
  const purple = dataset.rarity[Rarity.Purple]

  const hasUp
    = !isBeginner
      && !isPermanent
      && !isChronicledAndLightrace
      && !isBangboo
      && !isPermanentOde
      && !isEventOde

  const total = dataset.total
  const sum = (isPermanentOde ? purple : golden).sum
  const usedPitySum = (isPermanentOde ? purple : golden).usedPitySum
  const nextPity = (isPermanentOde ? purple : golden).nextPity

  let average: number
  if (isPermanentOde || isEventOde) {
    average = (isPermanentOde ? purple.average : golden.average) * 160
    // Round to 2 decimal places
    average = Math.round((average + Number.EPSILON) * 100) / 100
  } else {
    average = golden.average
  }

  const percentage = (isPermanentOde ? purple : golden).percentage
  const up = hasUp ? golden.up : null
  const [showcase, showcaseRarity]: [StatsRecord | null, Rarity]
    = isPermanentOde
      ? [purple.values[purple.values.length - 1] ?? null, Rarity.Purple]
      : [golden.values[golden.values.length - 1] ?? null, Rarity.Golden]

  const base = {
    isBeginner,
    isPermanent,
    isChronicledAndLightrace,
    isBangboo,
    isPermanentOde,
    isEventOde,
    timeRange,
    [Rarity.Golden]: golden,
    [Rarity.Purple]: purple,
    hasUp,
    total,
    sum,
    usedPitySum,
    average,
    percentage,
    nextPity,
    up,
    showcase,
    showcaseRarity,
  }

  if (isBanner) {
    return {
      ...base,
      isBanner: true,
      isAggregated: false,
      category: category as BannerCategory,
    }
  } else {
    return {
      ...base,
      isBanner: false,
      isAggregated: true,
      category: Aggregated,
    }
  }
}
