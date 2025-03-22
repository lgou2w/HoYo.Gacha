import { DetailedError, isDetailedError } from '@/api/error'
import { InvokeOptions } from '@/api/invoke'
import { Account } from '@/interfaces/Account'
import { Business, BusinessRegion, GenshinImpact } from '@/interfaces/Business'
import { GachaRecord, GachaTypeAndLastEndIdMappings, PrettizedGachaRecords } from '@/interfaces/GachaRecord'
import { FindGachaRecordsByBusinessAndUidArgs, SqlxDatabaseError, SqlxError } from './database'
import { declareCommand } from '.'

// See:
//   src-tauri/src/business/mod.rs
//   src-tauri/src/business/data_folder_locator.rs
//   src-tauri/src/business/gacha_convert.rs
//   src-tauri/src/business/gacha_fetcher.rs
//   src-tauri/src/business/gacha_metadata.rs
//   src-tauri/src/business/gacha_prettied.rs
//   src-tauri/src/business/gacha_url.rs

// See: https://doc.rust-lang.org/std/io/struct.Error.html
export interface NativeIOError {
  kind: string
  message: string
}

// Data Folder

const NamedDataFolderError = 'DataFolderError' as const

export type DataFolderError = DetailedError<typeof NamedDataFolderError,
  | { kind: 'Invalid' }
  | { kind: 'UnityLogFileNotFound', path: string }
  | { kind: 'OpenUnityLogFile', path: string, cause: NativeIOError }
  | { kind: 'Vacant' }
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

export type LocateDataFolderFactory =
  | { UnityLog: null }
  | { Manual: { title: string } }
  | { Registry: null } // HACK: only Windows

export type LocateDataFolderArgs<T extends Business> = NonNullable<{
  business: T
  region: BusinessRegion
  factory: LocateDataFolderFactory
}>

export type LocateDataFolder = <T extends Business>(args: LocateDataFolderArgs<T>, options?: InvokeOptions) => Promise<DataFolder<T>>
export const locateDataFolder: LocateDataFolder = declareCommand('business_locate_data_folder')

// Gacha Url

const NamedGachaUrlError = 'GachaUrlError' as const

export type GachaUrlError = DetailedError<typeof NamedGachaUrlError,
  | { kind: 'WebCachesNotFound', path: string }
  | { kind: 'OpenWebCaches', cause: NativeIOError }
  | { kind: 'ReadDiskCache', cause: NativeIOError }
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

const NamedLegacyUigfGachaRecordsWriteError = 'LegacyUigfGachaRecordsWriteError' as const

export type LegacyUigfGachaRecordsWriteError = DetailedError<typeof NamedLegacyUigfGachaRecordsWriteError,
  | { kind: 'IncompatibleRecordBusiness', business: Business, id: string, name: string }
  | { kind: 'IncompatibleRecordOwner', expected: Account['uid'], actual: Account['uid'] }
  | { kind: 'IncompatibleRecordLocale', expected: string, actual: string }
  | { kind: 'FailedMappingGachaType', value: GachaRecord<GenshinImpact>['gachaType'] }
  | { kind: 'CreateOutput', path: string, cause: NativeIOError }
  | { kind: 'Serialize', cause: string }
>

export function isLegacyUigfGachaRecordsWriteError (error: unknown): error is LegacyUigfGachaRecordsWriteError {
  return isDetailedError(error) &&
    error.name === NamedLegacyUigfGachaRecordsWriteError
}

const NamedLegacyUigfGachaRecordsReadError = 'LegacyUigfGachaRecordsReadError' as const

export type LegacyUigfGachaRecordsReadError = DetailedError<typeof NamedLegacyUigfGachaRecordsReadError,
  | { kind: 'OpenInput', path: string, cause: NativeIOError }
  | { kind: 'InvalidInput', cause: string }
  | { kind: 'InvalidVersion', version: string }
  | { kind: 'UnsupportedVersion', version: string, allowed: string }
  | { kind: 'InconsistentUid', expected: Account['uid'], actual: Account['uid'] }
  | { kind: 'RequiredField', field: string }
  | { kind: 'MissingMetadataEntry', business: Business, locale: string, key: string, val: string }
>

export function isLegacyUigfGachaRecordsReadError (error: unknown): error is LegacyUigfGachaRecordsReadError {
  return isDetailedError(error) &&
    error.name === NamedLegacyUigfGachaRecordsReadError
}

const NamedUigfGachaRecordsWriteError = 'UigfGachaRecordsWriteError' as const

export type UigfGachaRecordsWriteError = DetailedError<typeof NamedUigfGachaRecordsWriteError,
  | { kind: 'MissingAccountInfo', uid: Account['uid'] }
  | { kind: 'MissingMetadataEntry', business: Business, locale: string, key: string, val: string }
  | { kind: 'FailedMappingGachaType', value: GachaRecord<GenshinImpact>['gachaType'] }
  | { kind: 'CreateOutput', path: string, cause: NativeIOError }
  | { kind: 'Serialize', cause: string }
>

export function isUigfGachaRecordsWriteError (error: unknown): error is UigfGachaRecordsWriteError {
  return isDetailedError(error) &&
    error.name === NamedUigfGachaRecordsWriteError
}

const NamedUigfGachaRecordsReadError = 'UigfGachaRecordsReadError' as const

export type UigfGachaRecordsReadError = DetailedError<typeof NamedUigfGachaRecordsReadError,
  | { kind: 'OpenInput', path: string, cause: NativeIOError }
  | { kind: 'InvalidInput', cause: string }
  | { kind: 'InvalidVersion', version: string }
  | { kind: 'UnsupportedVersion', version: string, allowed: string }
  | { kind: 'MissingMetadataEntry', business: Business, locale: string, key: string, val: string }
>

export function isUigfGachaRecordsReadError (error: unknown): error is UigfGachaRecordsReadError {
  return isDetailedError(error) &&
    error.name === NamedUigfGachaRecordsReadError
}

const NamedSrgfGachaRecordsWriteError = 'SrgfGachaRecordsWriteError' as const

export type SrgfGachaRecordsWriteError = DetailedError<typeof NamedSrgfGachaRecordsWriteError,
  | { kind: 'IncompatibleRecordBusiness', business: Business, id: string, name: string }
  | { kind: 'IncompatibleRecordOwner', expected: Account['uid'], actual: Account['uid'] }
  | { kind: 'IncompatibleRecordLocale', expected: string, actual: string }
  | { kind: 'CreateOutput', path: string, cause: NativeIOError }
  | { kind: 'Serialize', cause: string }
>

export function isSrgfGachaRecordsWriteError (error: unknown): error is SrgfGachaRecordsWriteError {
  return isDetailedError(error) &&
    error.name === NamedSrgfGachaRecordsWriteError
}

const NamedSrgfGachaRecordsReadError = 'SrgfGachaRecordsReadError' as const

export type SrgfGachaRecordsReadError = DetailedError<typeof NamedSrgfGachaRecordsReadError,
  | { kind: 'OpenInput', path: string, cause: NativeIOError }
  | { kind: 'InvalidInput', cause: string }
  | { kind: 'InvalidVersion', version: string }
  | { kind: 'UnsupportedVersion', version: string, allowed: string }
  | { kind: 'InconsistentUid', expected: Account['uid'], actual: Account['uid'] }
  | { kind: 'MissingMetadataEntry', business: Business, locale: string, key: string, val: string }
>

export function isSrgfGachaRecordsReadError (error: unknown): error is SrgfGachaRecordsReadError {
  return isDetailedError(error) &&
    error.name === NamedSrgfGachaRecordsReadError
}

export type ImportGachaRecordsError =
  // Because it needs to be inserted into the database
  | SqlxError
  | SqlxDatabaseError
  // These errors are based on the type of importer
  | LegacyUigfGachaRecordsReadError
  | UigfGachaRecordsReadError
  | SrgfGachaRecordsReadError

export type ExportGachaRecordsError =
  // Because it needs to be fetched from the database
  | SqlxError
  | SqlxDatabaseError
  // These errors are based on the type of exporter
  | LegacyUigfGachaRecordsWriteError
  | UigfGachaRecordsWriteError
  | SrgfGachaRecordsWriteError

// Business Advanced

export type CreateGachaRecordsFetcherChannelArgs<T extends Business> = NonNullable<{
  business: T
  region: BusinessRegion
  uid: Account['uid']
  gachaUrl: string
  gachaTypeAndLastEndIdMappings: GachaTypeAndLastEndIdMappings<T>
  eventChannel?: string
  saveToDatabase?: 'No' | 'Yes' | 'FullUpdate'
  saveOnConflict?: 'Nothing' | 'Update'
}>

export type CreateGachaRecordsFetcherChannel = <T extends Business>(args: CreateGachaRecordsFetcherChannelArgs<T>, options?: InvokeOptions) => Promise<number>
export const createGachaRecordsFetcherChannel: CreateGachaRecordsFetcherChannel = declareCommand('business_create_gacha_records_fetcher_channel')

export type GachaRecordsFetcherChannelFragment<T extends Business> =
  | 'Sleeping'
  | { Ready: GachaRecord<T>['gachaType'] }
  | { Pagination: number }
  | { DataRef: number }
  | { Data: GachaRecord<T>[] }
  | { Completed: GachaRecord<T>['gachaType'] }
  | 'Finished'

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

const NamedPrettyGachaRecordsError = 'PrettyGachaRecordsError' as const

export type PrettyGachaRecordsError = DetailedError<typeof NamedPrettyGachaRecordsError,
  | { kind: 'MissingMetadataEntry', business: Business, locale: string, name: string, itemId: string }
>

export function isPrettyGachaRecordsError (error: unknown): error is PrettyGachaRecordsError {
  return isDetailedError(error) &&
    error.name === NamedPrettyGachaRecordsError
}

export type FindAndPrettyGachaRecordsArgs<T extends Business> = FindGachaRecordsByBusinessAndUidArgs<T>

export type FindAndPrettyGachaRecords = <T extends Business>(args: FindAndPrettyGachaRecordsArgs<T>, options?: InvokeOptions) => Promise<PrettizedGachaRecords<T>>
export const findAndPrettyGachaRecords: FindAndPrettyGachaRecords = declareCommand('business_find_and_pretty_gacha_records')
