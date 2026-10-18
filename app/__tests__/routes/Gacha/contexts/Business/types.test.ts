import { describe, expect, it } from 'vitest'
import { AccountBusiness } from '@/api/Account'
import { BusinessContextValue } from '@/routes/Gacha/contexts/Business/types'

describe('BusinessContextValue', () => {
  it('stores value and keyof', () => {
    const b = new BusinessContextValue(AccountBusiness.GenshinImpact)
    expect(b.value).toBe(AccountBusiness.GenshinImpact)
    expect(b.keyof).toBe('GenshinImpact')
  })

  it('resolves each business to its keyof', () => {
    expect(new BusinessContextValue(AccountBusiness.HonkaiStarRail).keyof)
      .toBe('HonkaiStarRail')
    expect(new BusinessContextValue(AccountBusiness.ZenlessZoneZero).keyof)
      .toBe('ZenlessZoneZero')
    expect(new BusinessContextValue(AccountBusiness.MiliastraWonderland).keyof)
      .toBe('MiliastraWonderland')
  })

  it('rejects unknown business values', () => {
    expect(() => new BusinessContextValue(42 as never))
      .toThrow(/Invalid account business/)
    expect(() => new BusinessContextValue(999 as never))
      .toThrow(/Invalid account business/)
  })

  it('toBe compares identity', () => {
    const b = new BusinessContextValue(AccountBusiness.GenshinImpact)
    expect(b.toBe(AccountBusiness.GenshinImpact))
      .toBe(true)
    expect(b.toBe(AccountBusiness.HonkaiStarRail))
      .toBe(false)
  })

  it('toMatches checks membership', () => {
    const b = new BusinessContextValue(AccountBusiness.ZenlessZoneZero)
    expect(b.toMatches(AccountBusiness.ZenlessZoneZero))
      .toBe(true)
    expect(b.toMatches(AccountBusiness.GenshinImpact, AccountBusiness.ZenlessZoneZero))
      .toBe(true)
    expect(b.toMatches()).toBe(false)
    expect(b.toMatches(AccountBusiness.GenshinImpact))
      .toBe(false)
  })
})
