// Account
//   See: src-tauri/src/models/business.rs

export type GenshinImpact = 0
export type HonkaiStarRail = 1
export type ZenlessZoneZero = 2
export const Businesses = {
  GenshinImpact: 0 as GenshinImpact,
  HonkaiStarRail: 1 as HonkaiStarRail,
  ZenlessZoneZero: 2 as ZenlessZoneZero
} as const

export type KeyofBusinesses = keyof typeof Businesses
export type Business = typeof Businesses[KeyofBusinesses]

export const ReversedBusinesses: Readonly<Record<Business, KeyofBusinesses>> =
  Object.entries(Businesses).reduce((acc, [key, value]) => {
    acc[value] = key as KeyofBusinesses
    return acc
  }, {} as Record<Business, KeyofBusinesses>)

export type BusinessRegion = 'Official' | 'Global'
