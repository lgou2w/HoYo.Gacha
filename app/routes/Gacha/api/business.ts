import { Account, AccountBusiness } from '@/api/Account'
import { declareCommand } from '@/api/command'
import { LanguageMetadata } from '@/i18n'
import { GachaStats, StatsRecord } from './stats'

export interface ResolveImageArgs extends Record<string, unknown> {
  business: AccountBusiness
  itemCategory: NonNullable<StatsRecord['itemCategory']>
  itemId: NonNullable<StatsRecord['itemId']>
  online?: boolean | null
}

export type ResolveImage
  = (args: ResolveImageArgs) => Promise<Uint8Array>

export type CustomLocale = LanguageMetadata['constants']['gacha']

export interface AnalyzeRecordsArgs<T extends AccountBusiness> extends Record<string, unknown> {
  business: T
  uid: Account['uid']
  customLocale?: CustomLocale | null
}

export type AnalyzeRecords
  = <T extends AccountBusiness> (args: AnalyzeRecordsArgs<T>) => Promise<GachaStats<T>>

export enum SaveToDatabase {
  No = 'No',
  Yes = 'Yes',
  FullUpdate = 'FullUpdate',
}

export enum SaveOnConflict {
  Nothing = 'Nothing',
  Update = 'Update',
}

// commands
export const BusinessCommands = {
  resolveImage:
    declareCommand('business_resolve_image') as ResolveImage,

  /** @throws `DatabaseError` */
  analyzeRecords:
    declareCommand('business_analyze_records') as AnalyzeRecords,
} as const

Object.freeze(BusinessCommands)

declare global {
  /**
   * @deprecated For devtools only, do not use in code.
   */
  var __BUSINESS_COMMANDS__: typeof BusinessCommands
}

if (!globalThis.__BUSINESS_COMMANDS__) {
  globalThis.__BUSINESS_COMMANDS__ = BusinessCommands
}
