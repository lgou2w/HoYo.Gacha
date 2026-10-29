import { Channel } from '@tauri-apps/api/core'
import { Account, AccountBusiness } from '@/api/Account'
import { GachaRecord, GachaType } from '@/api/GachaRecord'
import { Command, declareCommand } from '@/api/command'
import { LanguageMetadata } from '@/i18n'
import { BannerCategory, GachaStats, StatsRecord } from './stats'

export type ValidateUidArgs
  = Pick<Account, 'business' | 'uid'>

export type ValidateUid
  = Command<ValidateUidArgs, 'official' | 'oversea' | null>

export interface DataFolder<T extends AccountBusiness = AccountBusiness> {
  business: T
  value: string
}

export enum DataFolderLocatorFactoryKind {
  UnityLog = 'UnityLog',
  Manual = 'Manual',
}

export type DataFolderLocatorFactory
  = | { [DataFolderLocatorFactoryKind.UnityLog]: null }
    | { [DataFolderLocatorFactoryKind.Manual]: { title: string } }

export interface LocateDataFolderArgs<T extends AccountBusiness> extends Record<string, unknown> {
  business: T
  uid: Account['uid']
  factory: DataFolderLocatorFactory
}

export type LocateDataFolder
  = <T extends AccountBusiness> (args: LocateDataFolderArgs<T>) => Promise<DataFolder<T> | null>

export interface GachaUrl<T extends AccountBusiness = AccountBusiness> {
  business: T
  owner: Account['uid']
  creationTime?: string | null
  value: string
}

export interface FromWebcachesGachaUrlArgs<T extends AccountBusiness> extends Record<string, unknown> {
  business: T
  uid: Account['uid']
  dataFolder: Account['dataFolder']
}

export type FromWebcachesGachaUrl
  = <T extends AccountBusiness> (args: FromWebcachesGachaUrlArgs<T>) => Promise<GachaUrl<T> | null>

export interface FromDirtyGachaUrlArgs<T extends AccountBusiness> extends Record<string, unknown> {
  business: T
  uid: Account['uid']
  dirty: string
}

export type FromDirtyGachaUrl
  = <T extends AccountBusiness> (args: FromDirtyGachaUrlArgs<T>) => Promise<GachaUrl<T> | null>

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

export enum FetchRecordsEventKind {
  Sleeping = 'Sleeping',
  Ready = 'Ready',
  Pagination = 'Pagination',
  Data = 'Data',
  Completed = 'Completed',
  Finished = 'Finished',
}

export type FetchRecordsEvent
  = | FetchRecordsEventKind.Sleeping
    | { [FetchRecordsEventKind.Ready]: BannerCategory | null }
    | { [FetchRecordsEventKind.Pagination]: number }
    | { [FetchRecordsEventKind.Data]: number }
    | { [FetchRecordsEventKind.Completed]: BannerCategory | null }
    | FetchRecordsEventKind.Finished

export interface FetchRecordsOptions<T extends AccountBusiness> {
  business: T
  uid: Account['uid']
  gachaUrl: string
  gachaRanges: [GachaType<T>, GachaRecord<T>['id'] | null | undefined][]
  saveToDatabase?: SaveToDatabase | null
  saveOnConflict?: SaveOnConflict | null
}

export interface FetchRecordsArgs<T extends AccountBusiness> extends Record<string, unknown> {
  eventChannel: Channel<FetchRecordsEvent>
  options: FetchRecordsOptions<T>
}

export type FetchRecords
  = <T extends AccountBusiness> (args: FetchRecordsArgs<T>) => Promise<number>

// commands
export const BusinessCommands = {
  validateUid:
    declareCommand('business_validate_uid') as ValidateUid,

  /**
   * @throws `DataFolderLocateError`
   */
  locateDataFolder:
    declareCommand('business_locate_data_folder') as LocateDataFolder,

  /**
   * @throws `GachaUrlError`
   */
  fromWebcachesGachaUrl:
    declareCommand('business_from_webcaches_gacha_url') as FromWebcachesGachaUrl,

  /**
   * @throws `GachaUrlError`
   */
  fromDirtyGachaUrl:
    declareCommand('business_from_dirty_gacha_url') as FromDirtyGachaUrl,

  resolveImage:
    declareCommand('business_resolve_image') as ResolveImage,

  /** @throws `DatabaseError` */
  analyzeRecords:
    declareCommand('business_analyze_records') as AnalyzeRecords,

  /**
   * @throws `GachaFetchError`
   */
  fetchRecords:
    declareCommand('business_fetch_records') as FetchRecords,
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
