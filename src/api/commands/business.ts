import { DetailedError, isDetailedError } from '@/api/error'
import { InvokeOptions } from '@/api/invoke'
import { Account } from '@/interfaces/Account'
import { Business, BusinessRegion } from '@/interfaces/Business'
import { GachaRecord } from '@/interfaces/GachaRecord'
import { declareCommand } from '.'

// See:
//   src-tauri/src/business/mod.rs
//   src-tauri/src/business/data_folder_locator.rs
//   src-tauri/src/business/gacha_url.rs

// Data Folder

const NamedDataFolderError = 'DataFolderError' as const

export type DataFolderError = DetailedError<typeof NamedDataFolderError,
  | { kind: 'Invalid' }
  | { kind: 'UnityLogFileNotFound', path: string }
  | { kind: 'OpenUnityLogFile', path: string, cause: { kind: string, message: string } }
>

export function isDataFolderError (error: unknown): error is DataFolderError {
  return isDetailedError(error) &&
    error.name === NamedDataFolderError
}

export interface DataFolder<T extends Business> {
  business: T
  region: BusinessRegion
  value: string
}

export type LocateDataFolderArgs<T extends Business> = NonNullable<{
  business: T
  region: BusinessRegion
  factory: 'UnityLog' | 'Manual' | 'Registry'
}>

export type LocateDataFolder = <T extends Business>(args: LocateDataFolderArgs<T>, options?: InvokeOptions) => Promise<DataFolder<T> | null>
export const locateDataFolder: LocateDataFolder = declareCommand('business_locate_data_folder')

// Gacha Url

const NamedGachaUrlError = 'GachaUrlError' as const

export type GachaUrlError = DetailedError<typeof NamedGachaUrlError,
  | { kind: 'WebCachesNotFound', path: string }
  | { kind: 'OpenWebCaches', cause: { kind: string, message: string } }
  | { kind: 'ReadDiskCache', cause: { kind: string, message: string } }
  | { kind: 'EmptyData' }
  | { kind: 'NotFound' }
  | { kind: 'Illegal', url: string }
  | { kind: 'IllegalBiz', url: string, expected: string, actual: string }
  | { kind: 'InvalidParams', params: string[] }
  | { kind: 'Parse', cause: string }
  | { kind: 'Reqwest', cause: string }
  | { kind: 'AuthkeyTimeout' }
  | { kind: 'VisitTooFrequently' }
  | { kind: 'UnexpectedResponse', retcode: number, message: string }
  | { kind: 'InconsistentUid', expected: Account['uid'], actual: Array<Account['uid']> }
>

export function isGachaUrlError (error: unknown): error is GachaUrlError {
  return isDetailedError(error) &&
    error.name === NamedGachaUrlError
}

export interface GachaUrl<T extends Business> {
  business: T
  region: BusinessRegion
  ownerUid: Account['uid']
  creationTime: string | null
  paramGameBiz: string
  paramRegion: string
  paramLang: string
  paramAuthkey: string
  value: string
}

export type FromWebCachesGachaUrlArgs<T extends Business> = NonNullable<{
  business: T
  region: BusinessRegion
  dataFolder: string
  expectedUid: Account['uid']
}>

export type FromWebCachesGachaUrl = <T extends Business>(args: FromWebCachesGachaUrlArgs<T>, options?: InvokeOptions) => Promise<GachaUrl<T>>
export const fromWebCachesGachaUrl: FromWebCachesGachaUrl = declareCommand('business_from_webcaches_gacha_url')

export type FromDirtyGachaUrlArgs<T extends Business> = NonNullable<{
  business: T
  region: BusinessRegion
  dirtyUrl: string
  expectedUid: Account['uid']
}>

export type FromDirtyGachaUrl = <T extends Business>(args: FromDirtyGachaUrlArgs<T>, options?: InvokeOptions) => Promise<GachaUrl<T>>
export const fromDirtyGachaUrl: FromDirtyGachaUrl = declareCommand('business_from_dirty_gacha_url')

// Gacha Convert

// Business Advanced

export type CreateGachaRecordsFetcherChannelArgs<T extends Business> = NonNullable<{
  business: T
  region: BusinessRegion
  uid: Account['uid']
  gachaUrl: string
  gachaTypeAndLastEndIdMappings: Array<[GachaRecord<T>['gachaType'], GachaRecord<T>['id'] | null]>
  options?: {
    eventChannel?: string
    saveToDatabase?: boolean
    saveOnConflict?: 'Nothing' | 'Update'
  }
}>

export type CreateGachaRecordsFetcherChannel = <T extends Business>(args: CreateGachaRecordsFetcherChannelArgs<T>, options?: InvokeOptions) => Promise<void>
export const createGachaRecordsFetcherChannel: CreateGachaRecordsFetcherChannel = declareCommand('business_create_gacha_records_fetcher_channel')

export type ImportGachaRecordsArgs = NonNullable<{
  input: string
  importer:
    | { LegacyUigf: {
      expectedLocale: string,
      expectedUid: Account['uid']
    } }
    | { Uigf: {
      businesses?: Business[],
      accounts?: Account['uid'][]
    } }
    | { Srgf: {
      expectedLocale: string,
      expectedUid: Account['uid']
    } }
  saveOnConflict?: 'Nothing' | 'Update'
  progressChannel?: string
}>

export const importGachaRecords = declareCommand<ImportGachaRecordsArgs, number>('business_import_gacha_records')

export type ExportGachaRecordsArgs = NonNullable<{
  output: string
  exporter:
    | { LegacyUigf: {
      uigfVersion: 'v2.2' | 'v2.3' | 'v2.4' | 'v3.0'
      accountLocale: string
      accountUid: Account['uid']
      exportTime: string | Date
      regionTimeZone: number
    } }
    | { Uigf: {
      businesses?: Business[],
      accounts: Record<Account['uid'], [number, string]> // uid: [timezone, locale]
      exportTime: string | Date
    } }
    | { Srgf: {
      srgfVersion: 'v1.0'
      accountLocale: string
      accountUid: Account['uid']
      exportTime: string | Date
      regionTimeZone: number
    } }
}>

export const exportGachaRecords = declareCommand<ExportGachaRecordsArgs, void>('business_export_gacha_records')
