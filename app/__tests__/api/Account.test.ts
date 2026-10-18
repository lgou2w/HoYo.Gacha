import { describe, expect, it } from 'vitest'
import { AccountBusiness, AccountBusinessKeys } from '@/api/Account'

describe('AccountBusiness', () => {
  it('matches the numeric ids the backend stores', () => {
    expect(AccountBusiness.GenshinImpact).toBe(0)
    expect(AccountBusiness.HonkaiStarRail).toBe(1)
    expect(AccountBusiness.ZenlessZoneZero).toBe(2)
    expect(AccountBusiness.MiliastraWonderland).toBe(3)
  })
})

describe('AccountBusinessKeys', () => {
  it('lists the string keys in declaration order (numeric reverse-keys filtered out)', () => {
    expect(AccountBusinessKeys).toEqual([
      'GenshinImpact',
      'MiliastraWonderland',
      'HonkaiStarRail',
      'ZenlessZoneZero',
    ])
  })
})
