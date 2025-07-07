// Account
//   See: src-tauri/src/models/business.rs

export type GenshinImpact = 0
export const GenshinImpact = 0

export type HonkaiStarRail = 1
export const HonkaiStarRail = 1

export type ZenlessZoneZero = 2
export const ZenlessZoneZero = 2

export const Businesses = {
  GenshinImpact: 0 as GenshinImpact,
  HonkaiStarRail: 1 as HonkaiStarRail,
  ZenlessZoneZero: 2 as ZenlessZoneZero,
} as const

export type KeyofBusinesses = keyof typeof Businesses
export type Business = typeof Businesses[KeyofBusinesses]

export const ReversedBusinesses: Readonly<Record<Business, KeyofBusinesses>> =
  Object
    .entries(Businesses)
    .reduce((acc, [key, value]) => {
      acc[value] = key as KeyofBusinesses
      return acc
    }, {} as Record<Business, KeyofBusinesses>)

export enum BusinessRegion {
  Official = 'Official',
  Global = 'Global',
}

export enum ServerRegion {
  /**
   * Official: CN, PRODCN
   */
  Official = 'Official',
  /**
   * Official: CN, Channel
   * @version - Genshin Impact & Honkai: Star Rail only
   */
  Channel = 'Channel',
  /**
   * Global: Asia
   */
  Asia = 'Asia',
  /**
   * Global: Europe
   */
  Europe = 'Europe',
  /**
   * Global: America
   */
  America = 'America',
  /**
   * Global: TW, HK, MO
   */
  Cht = 'Cht',
}

export function detectUidServerRegion (business: Business, uid: number | string): ServerRegion | null {
  if (!Number.isSafeInteger(
    typeof uid === 'string'
      ? uid = parseInt(uid)
      : uid,
  ) || uid === 0) {
    return null
  }

  const digits = Math.floor(Math.log10(uid)) + 1

  if ((business === Businesses.GenshinImpact ||
    business === Businesses.HonkaiStarRail) &&
    (digits === 9 || digits === 10)
  ) {
    const serverDigit = Math.floor(uid / Math.pow(10, 9 - 1)) % 10
    switch (serverDigit) {
      case 1:
      case 2:
      case 3:
      case 4:
        return ServerRegion.Official
      case 5: return ServerRegion.Channel
      case 6: return ServerRegion.America
      case 7: return ServerRegion.Europe
      case 8: return ServerRegion.Asia
      case 9: return ServerRegion.Cht
    }
  } else if (business === Businesses.ZenlessZoneZero) {
    if (digits === 8) {
      // FIXME: Maybe the 9-digit uid is also official. Unable to determine at
      //   this time, as the 8-digit limit has not yet been reached.

      // There are no Channel servers, all are official server.
      return ServerRegion.Official
    } else if (digits === 10) {
      const serverDigit = Math.floor(uid / Math.pow(10, 9 - 1)) % 10
      switch (serverDigit) {
        case 0: return ServerRegion.America
        case 3: return ServerRegion.Asia
        case 5: return ServerRegion.Europe
        case 7: return ServerRegion.Cht
      }
    }
  }

  return null
}

export function detectUidBusinessRegion (business: Business, uid: number | string): BusinessRegion | null {
  const serverRegion = detectUidServerRegion(business, uid)
  switch (serverRegion) {
    case ServerRegion.Official:
    case ServerRegion.Channel:
      return BusinessRegion.Official
    case ServerRegion.Asia:
    case ServerRegion.Europe:
    case ServerRegion.America:
    case ServerRegion.Cht:
      return BusinessRegion.Global
    default:
      return null
  }
}
