import { Business, Businesses, GenshinImpact, HonkaiStarRail, ZenlessZoneZero } from './Business'

// Account
//   See: src-tauri/src/models/account.rs

export interface KnownAccountProperties {
  displayName?: string | null
  gachaUrl?: string | null
  gachaUrlCreationTime?: string | null
  lastGachaRecordsUpdated?: string | null
  avatarId?: string | null
}

export interface Account<T extends Business = Business> {
  business: T
  uid: number
  dataFolder: string
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
