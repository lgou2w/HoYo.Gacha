import { describe, expect, it } from 'vitest'
import { AccountBusiness } from '@/api/Account'
import { AggregatedStats, BannerCategory, BannerStats, PityRarityStats, Rarity, UpRarityStats, UpWinRarityStats } from '@/routes/Gacha/api/stats'
import { Aggregated, deriveGridItem } from '@/routes/Gacha/components/Clientarea/Overview/types'
import dayjs from '@/utilities/dayjs'

// `deriveGridItem` only needs `.format('L')`, so use the real localized dayjs.
const dayjsFactory = (...args: Parameters<typeof dayjs>) => dayjs(...args)

const goldenStats = (overrides: Partial<UpWinRarityStats> = {}): UpWinRarityStats => ({
  sum: 2,
  usedPitySum: 150,
  percentage: 2,
  average: 75,
  nextPity: { value: 30, progress: 33 },
  values: [
    { id: '1', time: '2024-01-01T00:00:00Z', itemId: 1, itemName: 'Foo' },
    { id: '2', time: '2024-01-15T00:00:00Z', itemId: 2, itemName: 'Bar' },
  ],
  up: { sum: 1, usedPitySum: 70, average: 70, percentage: 1 },
  upWin: { sum: 1, usedPitySum: 70, percentage: 100 },
  ...overrides,
})

const purpleStats = (overrides: Partial<UpRarityStats> = {}): UpRarityStats => ({
  sum: 10,
  usedPitySum: 100,
  percentage: 10,
  average: 10,
  nextPity: { value: 5, progress: 50 },
  values: [],
  up: { sum: 5, usedPitySum: 50, average: 10, percentage: 5 },
  ...overrides,
})

const blueStats = (overrides: Partial<PityRarityStats> = {}): PityRarityStats => ({
  sum: 88,
  usedPitySum: 0,
  percentage: 88,
  average: 0,
  nextPity: { value: 0, progress: 0 },
  values: null,
  ...overrides,
})

const bannerFixture = (overrides: Partial<BannerStats<AccountBusiness>> = {}): BannerStats<AccountBusiness> => ({
  category: BannerCategory.Character,
  gachaType: 301,
  total: 100,
  startTime: '2024-01-01T00:00:00Z',
  endTime: '2024-02-01T00:00:00Z',
  lastEndId: '99',
  rarity: {
    [Rarity.Green]: null,
    [Rarity.Blue]: blueStats(),
    [Rarity.Purple]: purpleStats(),
    [Rarity.Golden]: goldenStats(),
  },
  ...overrides,
})

const aggregatedFixture = (overrides: Partial<AggregatedStats> = {}): AggregatedStats => ({
  total: 300,
  startTime: '2024-01-01T00:00:00Z',
  endTime: '2024-03-01T00:00:00Z',
  rarity: {
    [Rarity.Green]: null,
    [Rarity.Blue]: blueStats(),
    [Rarity.Purple]: purpleStats(),
    [Rarity.Golden]: goldenStats(),
  },
  tags: { luck: null, unluck: null, relation: null, crazy: null, recent: null },
  ...overrides,
})

describe('deriveGridItem — banner', () => {
  it('discriminates as a banner and forwards category', () => {
    const d = deriveGridItem(bannerFixture(), dayjsFactory)
    expect(d.isBanner).toBe(true)
    expect(d.isAggregated).toBe(false)
    expect(d.category).toBe(BannerCategory.Character)
  })

  it('computes UP for a banner with UP', () => {
    const d = deriveGridItem(bannerFixture(), dayjsFactory)
    expect(d.hasUp).toBe(true)
    expect(d.up).toEqual({ sum: 1, usedPitySum: 70, average: 70, percentage: 1 })
  })

  it('drops UP for a banner without UP', () => {
    const d = deriveGridItem(bannerFixture({ category: BannerCategory.Permanent }), dayjsFactory)
    expect(d.hasUp).toBe(false)
    expect(d.up).toBeNull()
  })

  it('formats timeRange with dots instead of slashes', () => {
    const d = deriveGridItem(bannerFixture(), dayjsFactory)
    expect(d.timeRange).not.toBeNull()
    expect(d.timeRange).not.toContain('/')
  })

  it('returns null timeRange when a boundary is missing', () => {
    expect(deriveGridItem(bannerFixture({ startTime: null }), dayjsFactory).timeRange)
      .toBeNull()
    expect(deriveGridItem(bannerFixture({ endTime: null }), dayjsFactory).timeRange)
      .toBeNull()
  })

  it('uses Golden rarity by default', () => {
    const d = deriveGridItem(bannerFixture(), dayjsFactory)
    expect(d.rarityContext).toBe(Rarity.Golden)
    expect(d.sum).toBe(2)
    expect(d.average).toBe(75)
    expect(d.percentage).toBe(2)
  })

  it('uses Purple rarity for PermanentOde and multiplies average by 160', () => {
    const d = deriveGridItem(bannerFixture({ category: BannerCategory.PermanentOde }), dayjsFactory)
    expect(d.rarityContext).toBe(Rarity.Purple)
    expect(d.sum).toBe(10)
    expect(d.average).toBe(1600) // 10 * 160
    expect(d.percentage).toBe(10)
  })

  it('picks the latest golden record as showcase', () => {
    const d = deriveGridItem(bannerFixture(), dayjsFactory)
    expect(d.showcase?.itemName).toBe('Bar')
  })

  it('picks the latest purple record as showcase for PermanentOde', () => {
    const d = deriveGridItem(bannerFixture({
      category: BannerCategory.PermanentOde,
      rarity: {
        [Rarity.Green]: null,
        [Rarity.Blue]: blueStats(),
        [Rarity.Purple]: purpleStats({
          values: [
            { id: 'p1', time: '2024-01-01T00:00:00Z', itemId: 100, itemName: 'P1' },
            { id: 'p2', time: '2024-01-02T00:00:00Z', itemId: 101, itemName: 'P2' },
          ],
        }),
        [Rarity.Golden]: goldenStats(),
      },
    }), dayjsFactory)
    expect(d.showcase?.itemName).toBe('P2')
  })
})

describe('deriveGridItem — aggregated', () => {
  it('discriminates as aggregated', () => {
    const d = deriveGridItem(aggregatedFixture(), dayjsFactory)
    expect(d.isBanner).toBe(false)
    expect(d.isAggregated).toBe(true)
    expect(d.category).toBe(Aggregated)
  })

  it('has no UP for aggregated', () => {
    const d = deriveGridItem(aggregatedFixture(), dayjsFactory)
    expect(d.hasUp).toBe(false)
    expect(d.up).toBeNull()
  })
})
