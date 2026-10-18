/* eslint-disable import-x/order */

import { describe, expect, it, vi } from 'vitest'
import { BannerCategory } from '@/routes/Gacha/api/stats'

vi.mock('@/assets/images/BusinessImages', () => ({
  default: {
    GenshinImpact: {
      IconGachaTicket01: 'GI_Ticket1',
      IconGachaTicket02: 'GI_Ticket2',
      IconGachaTicket03: 'GI_Ticket3',
      IconCurrency01: 'GI_Currency1',
      IconCurrency02: 'GI_Currency2',
    },
    ZenlessZoneZero: {
      IconGachaTicket01: 'ZZZ_Ticket1',
      IconGachaTicket02: 'ZZZ_Ticket2',
      IconGachaTicket03: 'ZZZ_Ticket3',
      IconCurrency01: 'ZZZ_Currency1',
      IconCurrency02: 'ZZZ_Currency2',
    },
  },
}))

import { currencySrc, hasUpBanner, ticketSrc } from '@/routes/Gacha/components/types'

describe('ticketSrc', () => {
  it('uses IconGachaTicket01 for Beginner / Permanent / PermanentOde', () => {
    expect(ticketSrc('GenshinImpact', BannerCategory.Beginner))
      .toBe('GI_Ticket1')
    expect(ticketSrc('GenshinImpact', BannerCategory.Permanent))
      .toBe('GI_Ticket1')
    expect(ticketSrc('GenshinImpact', BannerCategory.PermanentOde))
      .toBe('GI_Ticket1')
  })

  it('uses IconGachaTicket03 for Bangboo', () => {
    expect(ticketSrc('ZenlessZoneZero', BannerCategory.Bangboo))
      .toBe('ZZZ_Ticket3')
  })

  it('uses IconGachaTicket02 as default', () => {
    expect(ticketSrc('GenshinImpact', BannerCategory.Character))
      .toBe('GI_Ticket2')
    expect(ticketSrc('GenshinImpact', BannerCategory.Weapon))
      .toBe('GI_Ticket2')
    expect(ticketSrc('ZenlessZoneZero', BannerCategory.Character))
      .toBe('ZZZ_Ticket2')
  })

  it('uses IconGachaTicket02 when category is undefined', () => {
    expect(ticketSrc('GenshinImpact'))
      .toBe('GI_Ticket2')
    expect(ticketSrc('GenshinImpact', undefined))
      .toBe('GI_Ticket2')
  })
})

describe('currencySrc', () => {
  it('maps PermanentOde to ticket01 regardless of variant', () => {
    expect(currencySrc('GenshinImpact', BannerCategory.PermanentOde, '01'))
      .toBe('GI_Ticket1')
    expect(currencySrc('GenshinImpact', BannerCategory.PermanentOde, '02'))
      .toBe('GI_Ticket1')
  })

  it('maps EventOde to ticket02 regardless of variant', () => {
    expect(currencySrc('GenshinImpact', BannerCategory.EventOde, '01'))
      .toBe('GI_Ticket2')
    expect(currencySrc('GenshinImpact', BannerCategory.EventOde, '02'))
      .toBe('GI_Ticket2')
  })

  it('falls back to the currency icon by variant', () => {
    expect(currencySrc('GenshinImpact', BannerCategory.Character, '01'))
      .toBe('GI_Currency1')
    expect(currencySrc('GenshinImpact', BannerCategory.Character, '02'))
      .toBe('GI_Currency2')
    expect(currencySrc('GenshinImpact', undefined, '01'))
      .toBe('GI_Currency1')
    expect(currencySrc('GenshinImpact', undefined, '02'))
      .toBe('GI_Currency2')
  })
})

describe('hasUpBanner', () => {
  it('returns false for banners without UP', () => {
    for (const c of [
      BannerCategory.Beginner,
      BannerCategory.Permanent,
      BannerCategory.ChronicledAndLightrace,
      BannerCategory.Bangboo,
      BannerCategory.PermanentOde,
      BannerCategory.EventOde,
    ]) {
      expect(hasUpBanner(c))
        .toBe(false)
    }
  })

  it('returns true for banners with UP', () => {
    for (const c of [
      BannerCategory.Character,
      BannerCategory.Weapon,
      BannerCategory.CollabCharacter,
      BannerCategory.CollabWeapon,
      BannerCategory.ExclusiveRescreening,
      BannerCategory.WEngineReverberation,
    ]) {
      expect(hasUpBanner(c))
        .toBe(true)
    }
  })
})
