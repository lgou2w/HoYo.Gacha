import { AccountBusiness } from '@/api/Account'
import { LanguageMetadata } from '@/i18n'
import { BannerCategory, BannerStats, Rarity } from '@/routes/Gacha/api/stats'
import { hasUpBanner } from '@/routes/Gacha/components/types'

export interface ColumnItemDerived {
  category: BannerCategory

  isBeginner: boolean
  isPermanent: boolean
  isChronicledAndLightrace: boolean
  isBangboo: boolean
  isPermanentOde: boolean
  isEventOde: boolean

  total: number
  hasUp: boolean
  timeRange: string | null
  [Rarity.Golden]: BannerStats<AccountBusiness>['rarity'][Rarity.Golden]
  [Rarity.Purple]: BannerStats<AccountBusiness>['rarity'][Rarity.Purple]
  [Rarity.Blue]: BannerStats<AccountBusiness>['rarity'][Rarity.Blue]
  [Rarity.Green]: BannerStats<AccountBusiness>['rarity'][Rarity.Green]
}

export function deriveColumnItem (
  dataset: BannerStats<AccountBusiness>,
  dayjs: LanguageMetadata['dayjs'],
): ColumnItemDerived {
  const category = dataset.category

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

  const total = dataset.total
  const hasUp = hasUpBanner(category)

  return {
    category,
    isBeginner,
    isPermanent,
    isChronicledAndLightrace,
    isBangboo,
    isPermanentOde,
    isEventOde,
    total,
    hasUp,
    timeRange,
    golden: dataset.rarity[Rarity.Golden],
    purple: dataset.rarity[Rarity.Purple],
    blue: dataset.rarity[Rarity.Blue],
    green: dataset.rarity[Rarity.Green],
  }
}
