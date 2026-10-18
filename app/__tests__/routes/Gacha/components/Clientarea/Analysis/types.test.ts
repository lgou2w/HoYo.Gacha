import { describe, expect, it } from 'vitest'
import { AccountBusiness } from '@/api/Account'
import { BannerCategory, BannerStats, PityRarityStats, Rarity, UpRarityStats, UpWinRarityStats } from '@/routes/Gacha/api/stats'
import { deriveColumnItem } from '@/routes/Gacha/components/Clientarea/Analysis/types'
import dayjs from '@/utilities/dayjs'

const goldenStats = (overrides: Partial<UpWinRarityStats> = {}): UpWinRarityStats => ({
  sum: 2,
  usedPitySum: 150,
  percentage: 2,
  average: 75,
  nextPity: { value: 30, progress: 33 },
  values: [],
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

describe('deriveColumnItem', () => {
  it('extracts category, total and hasUp', () => {
    const d = deriveColumnItem(bannerFixture(), dayjs)
    expect(d.category).toBe(BannerCategory.Character)
    expect(d.total).toBe(100)
    expect(d.hasUp).toBe(true)
  })

  it('sets hasUp=false for banners without UP', () => {
    const d = deriveColumnItem(bannerFixture({ category: BannerCategory.Permanent }), dayjs)
    expect(d.hasUp).toBe(false)
  })

  it('flags PermanentOde / EventOde', () => {
    const p = deriveColumnItem(bannerFixture({ category: BannerCategory.PermanentOde }), dayjs)
    expect(p.isPermanentOde).toBe(true)
    expect(p.isEventOde).toBe(false)

    const e = deriveColumnItem(bannerFixture({ category: BannerCategory.EventOde }), dayjs)
    expect(e.isPermanentOde).toBe(false)
    expect(e.isEventOde).toBe(true)
  })

  it('flags the other known banner categories', () => {
    const f = (c: BannerCategory) => deriveColumnItem(bannerFixture({ category: c }), dayjs)
    expect(f(BannerCategory.Beginner).isBeginner).toBe(true)
    expect(f(BannerCategory.Permanent).isPermanent).toBe(true)
    expect(f(BannerCategory.ChronicledAndLightrace).isChronicledAndLightrace).toBe(true)
    expect(f(BannerCategory.Bangboo).isBangboo).toBe(true)
  })

  it('formats timeRange, or null when a boundary is missing', () => {
    const d = deriveColumnItem(bannerFixture(), dayjs)
    expect(d.timeRange).not.toBeNull()
    expect(d.timeRange).not.toContain('/')

    expect(deriveColumnItem(bannerFixture({ startTime: null }), dayjs).timeRange)
      .toBeNull()
    expect(deriveColumnItem(bannerFixture({ endTime: null }), dayjs).timeRange)
      .toBeNull()
  })

  it('forwards the rarity buckets verbatim', () => {
    const dataset = bannerFixture()
    const d = deriveColumnItem(dataset, dayjs)
    expect(d.golden).toBe(dataset.rarity[Rarity.Golden])
    expect(d.purple).toBe(dataset.rarity[Rarity.Purple])
    expect(d.blue).toBe(dataset.rarity[Rarity.Blue])
    expect(d.green).toBe(dataset.rarity[Rarity.Green])
  })
})
