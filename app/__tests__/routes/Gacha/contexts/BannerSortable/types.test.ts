import { describe, expect, it } from 'vitest'
import { AccountBusiness } from '@/api/Account'
import { BannerCategory } from '@/routes/Gacha/api/stats'
import { defaultHiddenFor, defaultOrderFor, requiredBannersFor } from '@/routes/Gacha/contexts/BannerSortable/types'

describe('defaultOrderFor', () => {
  it('Genshin Impact', () => {
    expect(defaultOrderFor(AccountBusiness.GenshinImpact)).toEqual([
      BannerCategory.Character,
      BannerCategory.Weapon,
      BannerCategory.ChronicledAndLightrace,
      BannerCategory.Permanent,
      BannerCategory.Beginner,
    ])
  })

  it('Honkai: Star Rail', () => {
    expect(defaultOrderFor(AccountBusiness.HonkaiStarRail)).toEqual([
      BannerCategory.Character,
      BannerCategory.Weapon,
      BannerCategory.CollabCharacter,
      BannerCategory.CollabWeapon,
      BannerCategory.Permanent,
      BannerCategory.Beginner,
    ])
  })

  it('Zenless Zone Zero', () => {
    expect(defaultOrderFor(AccountBusiness.ZenlessZoneZero)).toEqual([
      BannerCategory.Character,
      BannerCategory.Weapon,
      BannerCategory.Permanent,
      BannerCategory.Bangboo,
      BannerCategory.ExclusiveRescreening,
      BannerCategory.WEngineReverberation,
    ])
  })

  it('Miliastra Wonderland', () => {
    expect(defaultOrderFor(AccountBusiness.MiliastraWonderland)).toEqual([
      BannerCategory.PermanentOde,
      BannerCategory.EventOde,
    ])
  })

  it('falls back to an empty array for unknown businesses', () => {
    expect(defaultOrderFor(99 as never))
      .toEqual([])
  })
})

describe('defaultHiddenFor', () => {
  it('hides Beginner for Genshin Impact and Honkai: Star Rail', () => {
    expect(defaultHiddenFor(AccountBusiness.GenshinImpact))
      .toEqual([BannerCategory.Beginner])
    expect(defaultHiddenFor(AccountBusiness.HonkaiStarRail))
      .toEqual([BannerCategory.Beginner])
  })

  it('hides nothing for Zenless Zone Zero and Miliastra Wonderland', () => {
    expect(defaultHiddenFor(AccountBusiness.ZenlessZoneZero))
      .toEqual([])
    expect(defaultHiddenFor(AccountBusiness.MiliastraWonderland))
      .toEqual([])
  })
})

describe('requiredBannersFor', () => {
  it('Genshin Impact requires ChronicledAndLightrace', () => {
    expect(requiredBannersFor(AccountBusiness.GenshinImpact).has(BannerCategory.ChronicledAndLightrace))
      .toBe(true)
  })

  it('Honkai: Star Rail requires collab banners', () => {
    const s = requiredBannersFor(AccountBusiness.HonkaiStarRail)
    expect(s.has(BannerCategory.CollabCharacter))
      .toBe(true)
    expect(s.has(BannerCategory.CollabWeapon))
      .toBe(true)
  })

  it('Zenless Zone Zero requires rescreening / reverberation', () => {
    const s = requiredBannersFor(AccountBusiness.ZenlessZoneZero)
    expect(s.has(BannerCategory.ExclusiveRescreening))
      .toBe(true)
    expect(s.has(BannerCategory.WEngineReverberation))
      .toBe(true)
  })

  it('Miliastra Wonderland requires nothing', () => {
    expect(requiredBannersFor(AccountBusiness.MiliastraWonderland).size)
      .toBe(0)
  })
})
