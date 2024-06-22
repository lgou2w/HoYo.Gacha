// Account
//   See: src-tauri/src/models/account.rs

// Declares

export const AccountBusinesses = {
  GenshinImpact: 0,
  HonkaiStarRail: 1
  // ZenlessZoneZero: 2
} as const

export type AccountBusiness = typeof AccountBusinesses[keyof typeof AccountBusinesses]

export const ReversedAccountBusinesses: Readonly<Record<AccountBusiness, keyof typeof AccountBusinesses>> =
  Object.entries(AccountBusinesses).reduce((acc, [key, value]) => {
    acc[value] = key as keyof typeof AccountBusinesses
    return acc
  }, {} as Record<AccountBusiness, keyof typeof AccountBusinesses>)

export interface KnownAccountProperties {
  displayName: string | null
}

export interface Account {
  id: number
  business: AccountBusiness
  uid: number
  gameDataDir: string
  gachaUrl: string | null
  gachaUrlUpdatedAt: string | null
  properties: KnownAccountProperties & Record<string, unknown> | null
  createdAt: string
}

// Utilities

export function isGenshinImpactAccount (account: Account): boolean {
  return account.business === AccountBusinesses.GenshinImpact
}

export function isHonkaiStarRailAccount (account: Account): boolean {
  return account.business === AccountBusinesses.HonkaiStarRail
}

// export function isZenlessZoneZeroAccount (account: Account): boolean {
//   return account.business === AccountBusinesses.ZenlessZoneZero
// }

export enum AccountServer {
  // CN
  Official = 1,
  Channel,
  // OS
  USA = 10,
  Euro,
  Asia,
  Cht
}

export const UidRegex = /^[1-9][0-9]{8}$/
export const UidMinimum = 100_000_000
export const UidMaximum = 999_999_999
export function isCorrectUid (uid: number | string): boolean {
  if (typeof uid === 'string') {
    return UidRegex.test(uid)
  } else if (typeof uid === 'number') {
    return uid >= UidMinimum && uid <= UidMaximum
  } else {
    return false
  }
}

/** Throws an exception if the `uid` is incorrect value. */
export function uidFirstDigit (uid: number | string) {
  if (!isCorrectUid(uid)) {
    throw new Error(`Incorrect account uid: ${uid}`)
  } else {
    typeof uid === 'string' && (uid = parseInt(uid))
    return Math.floor(uid / UidMinimum) as
      1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  }
}

export function detectServer (uid: string | number): AccountServer {
  const first = uidFirstDigit(uid)
  if (first >= 1 && first <= 4) {
    return AccountServer.Official
  } else {
    switch (first as 5 | 6 | 7 | 8 | 9) {
      case 5: return AccountServer.Channel
      case 6: return AccountServer.USA
      case 7: return AccountServer.Euro
      case 8: return AccountServer.Asia
      case 9: return AccountServer.Cht
    }
  }
}

export function isOverseaServer (uid: string | number): boolean {
  return uidFirstDigit(uid) >= 6
}
