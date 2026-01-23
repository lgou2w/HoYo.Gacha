import { declareCommand } from '@/api/command'
import { AccountBusiness, GenshinImpact, HonkaiStarRail, MiliastraWonderland, ZenlessZoneZero } from './Account'
import { JsonProperties } from './shared'

// See: tauri/src/database/schemas/gacha_record.rs

export type GachaType<T extends AccountBusiness>
  = T extends GenshinImpact ? 100 | 200 | 301 | 400 | 302 | 500
    : T extends HonkaiStarRail ? 1 | 2 | 11 | 12 | 21 | 22
      : T extends ZenlessZoneZero ? 1 | 2 | 3 | 5 | 102 | 103
        : T extends MiliastraWonderland ? 1000 | 20011 | 20021 | 20012 | 20022
          : never

export type GachaId<T extends AccountBusiness>
  = T extends GenshinImpact | MiliastraWonderland ? null
    : T extends HonkaiStarRail | ZenlessZoneZero ? number
      : never

export type RankType<T extends AccountBusiness>
  = T extends GenshinImpact | HonkaiStarRail ? 3 | 4 | 5
    : T extends ZenlessZoneZero ? 2 | 3 | 4
      : T extends MiliastraWonderland ? 2 | 3 | 4 | 5
        : never

export interface GachaRecord<T extends AccountBusiness> {
  business: T
  uid: number
  id: string
  gachaType: GachaType<T>
  gachaId: GachaId<T>
  rankType: RankType<T>
  count: number
  lang: string
  time: string
  itemName: string
  itemType: string
  itemId: number
  properties?: JsonProperties | null
}

export type FindGachaRecordsWithLimitArgs<T extends AccountBusiness>
  = & Pick<GachaRecord<T>, 'business' | 'uid'>
    & { limit: number }

export type FindGachaRecordsWithLimit
  = <T extends AccountBusiness> (args: FindGachaRecordsWithLimitArgs<T>) => Promise<GachaRecord<T>[]>

export type DeleteGachaRecordsArgs<T extends AccountBusiness>
  = Pick<GachaRecord<T>, 'business' | 'uid'>

export type DeleteGachaRecords
  = <T extends AccountBusiness> (args: DeleteGachaRecordsArgs<T>) => Promise<number>

// commands

export const GachaRecordCommands = {
  /** @throws `DatabaseError` */
  findWithLimit:
    declareCommand('database_find_gacha_records_with_limit') as FindGachaRecordsWithLimit,

  /** @throws `DatabaseError` */
  delete:
    declareCommand('database_delete_gacha_records') as DeleteGachaRecords,
} as const

Object.freeze(GachaRecordCommands)
