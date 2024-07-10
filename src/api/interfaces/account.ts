// Account
//   See: src-tauri/src/models/account.rs

// Declares

export type GenshinImpact = 0
export type HonkaiStarRail = 1
export type ZenlessZoneZero = 2
export const Businesses = {
  GenshinImpact: 0,
  HonkaiStarRail: 1,
  ZenlessZoneZero: 2
} as const

export type KeyofBusinesses = keyof typeof Businesses
export type Business = typeof Businesses[KeyofBusinesses]

export const ReversedBusinesses: Readonly<Record<Business, KeyofBusinesses>> =
  Object.entries(Businesses).reduce((acc, [key, value]) => {
    acc[value] = key as KeyofBusinesses
    return acc
  }, {} as Record<Business, KeyofBusinesses>)

export interface KnownAccountProperties {
  displayName: string | null
}

export interface Account {
  id: number
  business: Business
  uid: number
  gameDataDir: string
  gachaUrl: string | null
  gachaUrlUpdatedAt: string | null
  properties: KnownAccountProperties & Record<string, unknown> | null
  createdAt: string
}

// Utilities

export function isGenshinImpactAccount (account: Account): boolean {
  return account.business === Businesses.GenshinImpact
}

export function isHonkaiStarRailAccount (account: Account): boolean {
  return account.business === Businesses.HonkaiStarRail
}

export function isZenlessZoneZeroAccount (account: Account): boolean {
  return account.business === Businesses.ZenlessZoneZero
}

export function isCorrectUid (business: Business, uid: number | string): boolean {
  switch (business) {
    case Businesses.GenshinImpact:
    case Businesses.HonkaiStarRail:
      if (typeof uid === 'string') {
        return /^[1-9][0-9]{8}$/.test(uid)
      } else if (typeof uid === 'number') {
        return uid >= 100_000_000 && uid <= 999_999_999
      } else {
        return false
      }
    case Businesses.ZenlessZoneZero:
      return +uid >= 10_000_000
  }
}

export type DataRegion = 'Official' | 'Oversea'
export function detectUidDataRegion (business: Business, uid: number | string): DataRegion | null {
  if (!isCorrectUid(business, uid)) return null

  switch (business) {
    case Businesses.GenshinImpact:
    case Businesses.HonkaiStarRail:
      return +uid < 600_000_000
        ? 'Official'
        : 'Oversea'
    case Businesses.ZenlessZoneZero:
      return +uid < 100_000_000
        ? 'Official'
        : 'Oversea'
  }
}

export type AccountServer = 'Official' | 'Channel' | 'USA' | 'Euro' | 'Asia' | 'Cht'
export function detectUidServer (business: Business, uid: string | number): AccountServer | null {
  if (!isCorrectUid(business, uid)) return null

  switch (business) {
    case Businesses.GenshinImpact:
    case Businesses.HonkaiStarRail:
      switch (Math.floor(+uid / 100_000_000) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) {
        case 1:
        case 2:
        case 3:
        case 4:
          return 'Official'
        case 5:
          return 'Channel'
        case 6:
          return 'USA'
        case 7:
          return 'Euro'
        case 8:
          return 'Asia'
        case 9:
          return 'Cht'
      }
      break
    case Businesses.ZenlessZoneZero:
      return 'Official'
  }
}
