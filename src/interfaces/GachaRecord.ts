import { Business, Businesses, GenshinImpact, HonkaiStarRail, ZenlessZoneZero } from './Business'

// GachaRecord
//   See: src-tauri/src/models/gacha_record.rs

export type GachaRecord<T extends Business> = {
  business: T
  uid: number
  id: string
  gachaType:
      T extends GenshinImpact ? 100 | 200 | 301 | 400 | 302 | 500
    : T extends HonkaiStarRail ? 1 | 2 | 11 | 12
    : T extends ZenlessZoneZero ? 1 | 2 | 3 | 5
    : never
  gachaId:
      T extends GenshinImpact ? null
    : T extends HonkaiStarRail | ZenlessZoneZero ? number
    : never
  rankType:
      T extends GenshinImpact | HonkaiStarRail ? 3 | 4 | 5
    : T extends ZenlessZoneZero ? 2 | 3 | 4
    : never
  count: number
  time: string
  lang: string
  name: string
  itemType: string
  itemId: string | null
}

export type GenshinImpactGachaRecord = GachaRecord<GenshinImpact>
export type HonkaiStarRailGachaRecord = GachaRecord<HonkaiStarRail>
export type ZenlessZoneZeroGachaRecord = GachaRecord<ZenlessZoneZero>

// Utilities

export function isGenshinImpactGachaRecord (record: GachaRecord<Business>): record is GenshinImpactGachaRecord {
  return record.business === Businesses.GenshinImpact
}

export function isHonkaiStarRailGachaRecord (record: GachaRecord<Business>): record is HonkaiStarRailGachaRecord {
  return record.business === Businesses.HonkaiStarRail
}

export function isZenlessZoneZeroGachaRecord (record: GachaRecord<Business>): record is ZenlessZoneZeroGachaRecord {
  return record.business === Businesses.ZenlessZoneZero
}

export function sortGachaRecordById<T extends Business> (a: GachaRecord<T>, b: GachaRecord<T>): number {
  return a.id.localeCompare(b.id)
}

const FasterBusinessRankMappings: Record<
  Business,
  Partial<Record<
    GachaRecord<Business>['rankType'],
    Partial<Record<'Blue' | 'Purple' | 'Orange', true>>
  >>
> = {
  [Businesses.GenshinImpact]: { 3: { Blue: true }, 4: { Purple: true }, 5: { Orange: true } },
  [Businesses.HonkaiStarRail]: { 3: { Blue: true }, 4: { Purple: true }, 5: { Orange: true } },
  [Businesses.ZenlessZoneZero]: { 2: { Blue: true }, 3: { Purple: true }, 4: { Orange: true } },
}

export function isRankBlueGachaRecord<T extends Business> (record: GachaRecord<T>): boolean {
  return !!FasterBusinessRankMappings[record.business]?.[record.rankType]?.Blue
}

export function isRankPurpleGachaRecord<T extends Business> (record: GachaRecord<T>): boolean {
  return !!FasterBusinessRankMappings[record.business]?.[record.rankType]?.Purple
}

export function isRankOrangeGachaRecord<T extends Business> (record: GachaRecord<T>): boolean {
  return !!FasterBusinessRankMappings[record.business]?.[record.rankType]?.Orange
}
