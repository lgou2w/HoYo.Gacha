import { Business, BusinessRegion, Businesses, GenshinImpact, HonkaiStarRail, ZenlessZoneZero } from './Business'

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

export function isGenshinImpactAccount (account: Account): account is GenshinImpactAccount {
  return account.business === Businesses.GenshinImpact
}

export function isHonkaiStarRailAccount (account: Account): account is HonkaiStarRailAccount {
  return account.business === Businesses.HonkaiStarRail
}

export function isZenlessZoneZeroAccount (account: Account): account is ZenlessZoneZeroAccount {
  return account.business === Businesses.ZenlessZoneZero
}

// Account Uid

export function detectAccountUidRegion (business: Business, uid: number | string): BusinessRegion | null {
  if (!Number.isSafeInteger(
    typeof uid === 'string'
      ? uid = parseInt(uid)
      : uid,
  )) {
    return null
  }

  const digits = Math.log(uid) * Math.LOG10E + 1 | 0

  if ((business === Businesses.GenshinImpact ||
    business === Businesses.HonkaiStarRail) &&
    (digits === 9 || digits === 10)
  ) {
    const serverDigit = Math.floor(uid / Math.pow(10, 9 - 1)) % 10
    switch (serverDigit) {
      case 1:
      case 2:
      case 3:
      case 4: // Official
      case 5: // Channel
        return BusinessRegion.Official
      case 6: // USA
      case 7: // Euro
      case 8: // Asia
      case 9: // Cht
        return BusinessRegion.Global
    }
  } else if (business === Businesses.ZenlessZoneZero) {
    switch (digits) {
      case 8: // Ten million
        return BusinessRegion.Official
      case 9: // Hundred million
        return BusinessRegion.Global
    }
  }

  return null
}
