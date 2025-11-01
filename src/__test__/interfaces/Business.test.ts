import { Businesses, ServerRegion, detectUidServerRegion } from '@/interfaces/Business'

const itGI = detectUidServerRegion.bind(null, Businesses.GenshinImpact)
const isGIMW = detectUidServerRegion.bind(null, Businesses.MiliastraWonderland)
const itHSR = detectUidServerRegion.bind(null, Businesses.HonkaiStarRail)
const itZZZ = detectUidServerRegion.bind(null, Businesses.ZenlessZoneZero)

describe('detectUidServerRegion - Genshin Impact & Miliastra Wonderland & Honkai: Star Rail', () => {
  test.each([
    [[1_0000_0000, 2_0000_0000, 3_0000_0000, 4_0000_0000], ServerRegion.Official],
    [[5_0000_0000, 15_0000_0000], ServerRegion.Channel],
    [[6_0000_0000, 16_0000_0000], ServerRegion.America],
    [[7_0000_0000, 17_0000_0000], ServerRegion.Europe],
    [[8_0000_0000, 18_0000_0000], ServerRegion.Asia],
    [[9_0000_0000, 19_0000_0000], ServerRegion.Cht],
  ])(
    'each uid %s should return %s',
    (uids, expected) => {
      for (const uid of uids) {
        expect(itGI(uid)).toBe(expected)
        expect(isGIMW(uid)).toBe(expected)
        expect(itHSR(uid)).toBe(expected)
      }
    })
})

describe('detectUidServerRegion - Zenless Zone Zero', () => {
  test.each([
    [[1000_0000, 2000_0000, 3000_0000, 4000_0000], ServerRegion.Official],
    [[10_0000_0000], ServerRegion.America],
    [[13_0000_0000], ServerRegion.Asia],
    [[15_0000_0000], ServerRegion.Europe],
    [[17_0000_0000], ServerRegion.Cht],
  ])(
    'each uid %s should return %s',
    (uids, expected) => {
      for (const uid of uids) {
        expect(itZZZ(uid)).toBe(expected)
      }
    })
})

describe('detectUidServerRegion - Invalid UIDs', () => {
  test.each([
    [0, null],
    [-1, null],
    [1.1, null],
    [NaN, null],
    [Infinity, null],
    ['abc', null],
    ['12345678901', null],
  ])(
    'each uid %s should return %s',
    (uid, expected) => {
      expect(itGI(uid)).toBe(expected)
      expect(isGIMW(uid)).toBe(expected)
      expect(itHSR(uid)).toBe(expected)
      expect(itZZZ(uid)).toBe(expected)
    })
})
