import { Business, Businesses, GenshinImpact, HonkaiStarRail, ZenlessZoneZero } from './Business'

// Account
//   See: src-tauri/src/models/account.rs

export interface KnownAccountProperties {
  displayName: string | null
}

export interface Account<T extends Business = Business> {
  business: T
  uid: number
  dataFolder: string
  gachaUrl: string | null
  properties: KnownAccountProperties & Record<string, unknown> | null
}

export type GenshinImpactAccount = Account<GenshinImpact>
export type HonkaiStarRailAccount = Account<HonkaiStarRail>
export type ZenlessZoneZeroAccount = Account<ZenlessZoneZero>

// Utilities

export function isSamePrimaryKeyAccount (left: Account, right: Account): boolean {
  return left.business === right.business &&
    left.uid === right.uid
}

export function isGenshinImpactAccount (account: Account<Business>): account is GenshinImpactAccount {
  return account.business === Businesses.GenshinImpact
}

export function isHonkaiStarRailAccount (account: Account<Business>): account is HonkaiStarRailAccount {
  return account.business === Businesses.HonkaiStarRail
}

export function isZenlessZoneZeroAccount (account: Account<Business>): account is ZenlessZoneZeroAccount {
  return account.business === Businesses.ZenlessZoneZero
}

// FIXME: Outdated
// export function isCorrectAccountUid (business: Business, uid: number | string): boolean {
//   switch (business) {
//     // They range between 100_000_000 and 999_999_999
//     case Businesses.GenshinImpact:
//     case Businesses.HonkaiStarRail:
//       if (typeof uid === 'string') {
//         return /^[1-9][0-9]{8}$/.test(uid)
//       } else if (typeof uid === 'number') {
//         return uid >= 100_000_000 && uid <= 999_999_999
//       } else {
//         return false
//       }
//     // It has a minimum of 10 million and an unknown maximum
//     case Businesses.ZenlessZoneZero:
//       return +uid >= 10_000_000
//   }
// }
//
// export type AccountServer = 'Official' | 'Channel' | 'USA' | 'Euro' | 'Asia' | 'Cht'
// export function detectAccountUidServer (business: Business, uid: string | number): AccountServer | null {
//   if (!isCorrectAccountUid(business, uid)) return null
//
//   switch (business) {
//     // They're based on the first digit of the uid
//     case Businesses.GenshinImpact:
//     case Businesses.HonkaiStarRail:
//       switch (Math.floor(+uid / 100_000_000) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9) {
//         case 1:
//         case 2:
//         case 3:
//         case 4:
//           return 'Official'
//         case 5: return 'Channel'
//         case 6: return 'USA'
//         case 7: return 'Euro'
//         case 8: return 'Asia'
//         case 9: return 'Cht'
//       }
//       break
//     // It's only one
//     case Businesses.ZenlessZoneZero:
//       return 'Official'
//   }
// }
