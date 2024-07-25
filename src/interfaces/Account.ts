// Account
//   See: src-tauri/src/models/account.rs

// Declares

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

export interface KnownAccountProperties {
  displayName: string | null
}

export interface Account {
  business: Business
  uid: number
  dataDir: string
  gachaUrl: string | null
  properties: KnownAccountProperties & Record<string, unknown> | null
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

export function isCorrectAccountUid (business: Business, uid: number | string): boolean {
  switch (business) {
    // HACK: They range between 100_000_000 and 999_999_999
    case Businesses.GenshinImpact:
    case Businesses.HonkaiStarRail:
      if (typeof uid === 'string') {
        return /^[1-9][0-9]{8}$/.test(uid)
      } else if (typeof uid === 'number') {
        return uid >= 100_000_000 && uid <= 999_999_999
      } else {
        return false
      }
    // HACK: It has a minimum of 10 million and an unknown maximum
    case Businesses.ZenlessZoneZero:
      return +uid >= 10_000_000
  }
}

export type AccountServer = 'Official' | 'Channel' | 'USA' | 'Euro' | 'Asia' | 'Cht'
export function detectAccountUidServer (business: Business, uid: string | number): AccountServer | null {
  if (!isCorrectAccountUid(business, uid)) return null

  switch (business) {
    // HACK: They're based on the first digit of the uid
    case Businesses.GenshinImpact:
    case Businesses.HonkaiStarRail:
      switch (Math.floor(+uid / 100_000_000) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) {
        case 1:
        case 2:
        case 3:
        case 4:
          return 'Official'
        case 5: return 'Channel'
        case 6: return 'USA'
        case 7: return 'Euro'
        case 8: return 'Asia'
        case 9: return 'Cht'
      }
      break
    // HACK: It's only one
    case Businesses.ZenlessZoneZero:
      return 'Official'
  }
}
