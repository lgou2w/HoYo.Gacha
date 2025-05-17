import { DetailedError, isDetailedError } from '@/api/error'
import { Account } from '@/interfaces/Account'
import { Business, BusinessRegion, GenshinImpact } from '@/interfaces/Business'
import { GachaRecord, GachaTypeAndLastEndIdMappings, PrettizedGachaRecords, PrettyCategory } from '@/interfaces/GachaRecord'
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
  kind: string // too many
  message: string
}

// #region: Data Folder

const NamedDataFolderError = 'DataFolderError' as const

export enum DataFolderErrorKind {
  Invalid = 'Invalid',
  UnityLogFileNotFound = 'UnityLogFileNotFound',
  OpenUnityLogFile = 'OpenUnityLogFile',
  Vacant = 'Vacant',
}

export type DataFolderError = DetailedError<typeof NamedDataFolderError,
  | { kind: DataFolderErrorKind.Invalid }
  | { kind: DataFolderErrorKind.UnityLogFileNotFound, path: string }
  | { kind: DataFolderErrorKind.OpenUnityLogFile, path: string, cause: NativeIOError }
  | { kind: DataFolderErrorKind.Vacant }
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

export type LocateDataFolder = <T extends Business>(args: LocateDataFolderArgs<T>) => Promise<DataFolder<T>>
export const locateDataFolder: LocateDataFolder = declareCommand('business_locate_data_folder')

// #endregion

// #region: Gacha Url

const NamedGachaUrlError = 'GachaUrlError' as const

export enum GachaUrlErrorKind {
  WebCachesNotFound = 'WebCachesNotFound',
  OpenWebCaches = 'OpenWebCaches',
  ReadDiskCache = 'ReadDiskCache',
  EmptyData = 'EmptyData',
  NotFound = 'NotFound',
  Illegal = 'Illegal',
  IllegalBiz = 'IllegalBiz',
  InvalidParams = 'InvalidParams',
  Parse = 'Parse',
  Reqwest = 'Reqwest',
  AuthkeyTimeout = 'AuthkeyTimeout',
  VisitTooFrequently = 'VisitTooFrequently',
  UnexpectedResponse = 'UnexpectedResponse',
  InconsistentUid = 'InconsistentUid'
}

export type GachaUrlError = DetailedError<typeof NamedGachaUrlError,
  | { kind: GachaUrlErrorKind.WebCachesNotFound, path: string }
  | { kind: GachaUrlErrorKind.OpenWebCaches, path: string, cause: NativeIOError }
  | { kind: GachaUrlErrorKind.ReadDiskCache, cause: NativeIOError }
  | { kind: GachaUrlErrorKind.EmptyData }
  | { kind: GachaUrlErrorKind.NotFound }
  | { kind: GachaUrlErrorKind.Illegal, url: string }
  | { kind: GachaUrlErrorKind.IllegalBiz, url: string, expected: string, actual: string }
  | { kind: GachaUrlErrorKind.InvalidParams, params: string[] }
  | { kind: GachaUrlErrorKind.Parse, cause: string }
  | { kind: GachaUrlErrorKind.Reqwest, cause: string }
  | { kind: GachaUrlErrorKind.AuthkeyTimeout }
  | { kind: GachaUrlErrorKind.VisitTooFrequently }
  | { kind: GachaUrlErrorKind.UnexpectedResponse, retcode: number, message: string }
  | { kind: GachaUrlErrorKind.InconsistentUid, expected: Account['uid'], actuals: Array<Account['uid']> }
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

export type FromWebCachesGachaUrl = <T extends Business>(args: FromWebCachesGachaUrlArgs<T>) => Promise<GachaUrl<T>>
export const fromWebCachesGachaUrl: FromWebCachesGachaUrl = declareCommand('business_from_webcaches_gacha_url')

export type FromDirtyGachaUrlArgs<T extends Business> = NonNullable<{
  business: T
  region: BusinessRegion
  dirtyUrl: string
  expectedUid: Account['uid']
}>

export type FromDirtyGachaUrl = <T extends Business>(args: FromDirtyGachaUrlArgs<T>) => Promise<GachaUrl<T>>
export const fromDirtyGachaUrl: FromDirtyGachaUrl = declareCommand('business_from_dirty_gacha_url')

// #endregion

// #region: LegacyUigf

const NamedLegacyUigfGachaRecordsWriteError = 'LegacyUigfGachaRecordsWriteError' as const

export enum LegacyUigfGachaRecordsWriteErrorKind {
  InvalidUid = 'InvalidUid',
  IncompatibleRecordBusiness = 'IncompatibleRecordBusiness',
  IncompatibleRecordOwner = 'IncompatibleRecordOwner',
  IncompatibleRecordLocale = 'IncompatibleRecordLocale',
  FailedMappingGachaType = 'FailedMappingGachaType',
  CreateOutput = 'CreateOutput',
  Serialize = 'Serialize'
}

export type LegacyUigfGachaRecordsWriteError = DetailedError<typeof NamedLegacyUigfGachaRecordsWriteError,
  | {
      kind: LegacyUigfGachaRecordsWriteErrorKind.InvalidUid
      uid: Account['uid']
    }
  | {
      kind: LegacyUigfGachaRecordsWriteErrorKind.IncompatibleRecordBusiness
      business: Business
      id: string
      name: string
      cursor: number
    }
  | {
      kind: LegacyUigfGachaRecordsWriteErrorKind.IncompatibleRecordOwner
      expected: Account['uid']
      actual: Account['uid']
      cursor: number
    }
  | {
      kind: LegacyUigfGachaRecordsWriteErrorKind.IncompatibleRecordLocale
      expected: string
      actual: string
      cursor: number
    }
  | {
      kind: LegacyUigfGachaRecordsWriteErrorKind.FailedMappingGachaType
      value: GachaRecord<GenshinImpact>['gachaType']
      cursor: number
    }
  | {
      kind: LegacyUigfGachaRecordsWriteErrorKind.CreateOutput
      path: string
      cause: NativeIOError
    }
  | {
      kind: LegacyUigfGachaRecordsWriteErrorKind.Serialize
      cause: string
    }
>

export function isLegacyUigfGachaRecordsWriteError (error: unknown): error is LegacyUigfGachaRecordsWriteError {
  return isDetailedError(error) &&
    error.name === NamedLegacyUigfGachaRecordsWriteError
}

const NamedLegacyUigfGachaRecordsReadError = 'LegacyUigfGachaRecordsReadError' as const

export enum LegacyUigfGachaRecordsReadErrorKind {
  OpenInput = 'OpenInput',
  InvalidInput = 'InvalidInput',
  InvalidVersion = 'InvalidVersion',
  UnsupportedVersion = 'UnsupportedVersion',
  InconsistentUid = 'InconsistentUid',
  InvalidUid = 'InvalidUid',
  InvalidRegionTimeZone = 'InvalidRegionTimeZone',
  RequiredField = 'RequiredField',
  MissingMetadataLocale = 'MissingMetadataLocale',
  MissingMetadataEntry = 'MissingMetadataEntry'
}

export type LegacyUigfGachaRecordsReadError = DetailedError<typeof NamedLegacyUigfGachaRecordsReadError,
  | {
      kind: LegacyUigfGachaRecordsReadErrorKind.OpenInput
      path: string
      cause: NativeIOError
    }
  | {
      kind: LegacyUigfGachaRecordsReadErrorKind.InvalidInput
      cause: string
    }
  | {
      kind: LegacyUigfGachaRecordsReadErrorKind.InvalidVersion
      version: string
    }
  | {
      kind: LegacyUigfGachaRecordsReadErrorKind.UnsupportedVersion
      version: string
      allowed: string[]
    }
  | {
      kind: LegacyUigfGachaRecordsReadErrorKind.InconsistentUid
      expected: Account['uid']
      actual: Account['uid']
      cursor: number // When it is 0, the info data is incorrect
    }
  | {
      kind: LegacyUigfGachaRecordsReadErrorKind.InvalidUid
      uid: Account['uid']
    }
  | {
      kind: LegacyUigfGachaRecordsReadErrorKind.InvalidRegionTimeZone
      value: number
    }
  | {
      kind: LegacyUigfGachaRecordsReadErrorKind.RequiredField
      field: string
      cursor: number // When it is 0, the info data is incorrect
    }
  | {
      kind: LegacyUigfGachaRecordsReadErrorKind.MissingMetadataLocale
      locale: string
      cursor: number
    }
  | {
      kind: LegacyUigfGachaRecordsReadErrorKind.MissingMetadataEntry
      locale: string
      key: string
      val: string
      cursor: number
    }
>

export function isLegacyUigfGachaRecordsReadError (error: unknown): error is LegacyUigfGachaRecordsReadError {
  return isDetailedError(error) &&
    error.name === NamedLegacyUigfGachaRecordsReadError
}

// #endregion

// #region: Uigf

const NamedUigfGachaRecordsWriteError = 'UigfGachaRecordsWriteError' as const

export enum UigfGachaRecordsWriteErrorKind {
  VacantAccount = 'VacantAccount',
  InvalidUid = 'InvalidUid',
  MissingMetadataEntry = 'MissingMetadataEntry',
  FailedMappingGachaType = 'FailedMappingGachaType',
  CreateOutput = 'CreateOutput',
  Serialize = 'Serialize'
}

export type UigfGachaRecordsWriteError = DetailedError<typeof NamedUigfGachaRecordsWriteError,
  | {
      kind: UigfGachaRecordsWriteErrorKind.VacantAccount
      uid: Account['uid']
    }
  | {
      kind: UigfGachaRecordsWriteErrorKind.InvalidUid
      business: Business
      uid: Account['uid']
    }
  | {
      kind: UigfGachaRecordsWriteErrorKind.MissingMetadataEntry
      business: Business
      locale: string
      key: string
      val: string
      cursor: number
    }
  | {
      kind: UigfGachaRecordsWriteErrorKind.FailedMappingGachaType
      value: GachaRecord<GenshinImpact>['gachaType']
      cursor: number
    }
  | {
      kind: UigfGachaRecordsWriteErrorKind.CreateOutput
      path: string
      cause: NativeIOError
    }
  | {
      kind: UigfGachaRecordsWriteErrorKind.Serialize
      cause: string
    }
>

export function isUigfGachaRecordsWriteError (error: unknown): error is UigfGachaRecordsWriteError {
  return isDetailedError(error) &&
    error.name === NamedUigfGachaRecordsWriteError
}

const NamedUigfGachaRecordsReadError = 'UigfGachaRecordsReadError' as const

export enum UigfGachaRecordsReadErrorKind {
  OpenInput = 'OpenInput',
  InvalidInput = 'InvalidInput',
  InvalidVersion = 'InvalidVersion',
  UnsupportedVersion = 'UnsupportedVersion',
  InvalidUid = 'InvalidUid',
  InvalidRegionTimeZone = 'InvalidRegionTimeZone',
  MissingMetadataEntry = 'MissingMetadataEntry'
}

export type UigfGachaRecordsReadError = DetailedError<typeof NamedUigfGachaRecordsReadError,
  | {
      kind: UigfGachaRecordsReadErrorKind.OpenInput
      path: string
      cause: NativeIOError
    }
  | {
      kind: UigfGachaRecordsReadErrorKind.InvalidInput
      cause: string
    }
  | {
      kind: UigfGachaRecordsReadErrorKind.InvalidVersion
      version: string
    }
  | {
      kind: UigfGachaRecordsReadErrorKind.UnsupportedVersion
      version: string
      allowed: string[]
    }
  | {
      kind: UigfGachaRecordsReadErrorKind.InvalidUid
      business: Business
      uid: Account['uid']
    }
  | {
      kind: UigfGachaRecordsReadErrorKind.InvalidRegionTimeZone
      business: Business
      value: number
    }
  | {
      kind: UigfGachaRecordsReadErrorKind.MissingMetadataEntry
      business: Business
      locale: string
      key: string
      val: string
      cursor: number
    }
>

export function isUigfGachaRecordsReadError (error: unknown): error is UigfGachaRecordsReadError {
  return isDetailedError(error) &&
    error.name === NamedUigfGachaRecordsReadError
}

// #endregion

// #region: Srgf

const NamedSrgfGachaRecordsWriteError = 'SrgfGachaRecordsWriteError' as const

export enum SrgfGachaRecordsWriteErrorKind {
  InvalidUid = 'InvalidUid',
  IncompatibleRecordBusiness = 'IncompatibleRecordBusiness',
  IncompatibleRecordOwner = 'IncompatibleRecordOwner',
  IncompatibleRecordLocale = 'IncompatibleRecordLocale',
  CreateOutput = 'CreateOutput',
  Serialize = 'Serialize'
}

export type SrgfGachaRecordsWriteError = DetailedError<typeof NamedSrgfGachaRecordsWriteError,
  | {
      kind: SrgfGachaRecordsWriteErrorKind.InvalidUid
      uid: Account['uid']
    }
  | {
      kind: SrgfGachaRecordsWriteErrorKind.IncompatibleRecordBusiness
      business: Business
      id: string
      name: string
      cursor: number
    }
  | {
      kind: SrgfGachaRecordsWriteErrorKind.IncompatibleRecordOwner
      expected: Account['uid']
      actual: Account['uid']
      cursor: number
    }
  | {
      kind: SrgfGachaRecordsWriteErrorKind.IncompatibleRecordLocale
      expected: string
      actual: string
      cursor: number
    }
  | {
      kind: SrgfGachaRecordsWriteErrorKind.CreateOutput
      path: string
      cause: NativeIOError
    }
  | {
      kind: SrgfGachaRecordsWriteErrorKind.Serialize
      cause: string
    }
>

export function isSrgfGachaRecordsWriteError (error: unknown): error is SrgfGachaRecordsWriteError {
  return isDetailedError(error) &&
    error.name === NamedSrgfGachaRecordsWriteError
}

const NamedSrgfGachaRecordsReadError = 'SrgfGachaRecordsReadError' as const

export enum SrgfGachaRecordsReadErrorKind {
  OpenInput = 'OpenInput',
  InvalidInput = 'InvalidInput',
  InvalidVersion = 'InvalidVersion',
  UnsupportedVersion = 'UnsupportedVersion',
  InconsistentUid = 'InconsistentUid',
  InvalidUid = 'InvalidUid',
  InvalidRegionTimeZone = 'InvalidRegionTimeZone',
  MissingMetadataLocale = 'MissingMetadataLocale',
  MissingMetadataEntry = 'MissingMetadataEntry'
}

export type SrgfGachaRecordsReadError = DetailedError<typeof NamedSrgfGachaRecordsReadError,
  | {
      kind: SrgfGachaRecordsReadErrorKind.OpenInput
      path: string
      cause: NativeIOError
    }
  | {
      kind: SrgfGachaRecordsReadErrorKind.InvalidInput
      cause: string
    }
  | {
      kind: SrgfGachaRecordsReadErrorKind.InvalidVersion
      version: string
    }
  | {
      kind: SrgfGachaRecordsReadErrorKind.UnsupportedVersion
      version: string
      allowed: string[]
    }
  | {
      kind: SrgfGachaRecordsReadErrorKind.InconsistentUid
      expected: Account['uid']
      actual: Account['uid']
      cursor: number // When it is 0, the info data is incorrect
    }
  | {
      kind: SrgfGachaRecordsReadErrorKind.InvalidUid
      uid: Account['uid']
    }
  | {
      kind: SrgfGachaRecordsReadErrorKind.InvalidRegionTimeZone
      value: number
    }
  | {
      kind: SrgfGachaRecordsReadErrorKind.MissingMetadataLocale
      locale: string
      cursor: number
    }
  | {
      kind: SrgfGachaRecordsReadErrorKind.MissingMetadataEntry
      locale: string
      key: string
      val: string
      cursor: number
    }
>

export function isSrgfGachaRecordsReadError (error: unknown): error is SrgfGachaRecordsReadError {
  return isDetailedError(error) &&
    error.name === NamedSrgfGachaRecordsReadError
}

// #endregion

// #region: Gacha Convert

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

export type ImportGachaRecordsArgs = NonNullable<{
  input: string
  importer:
    | { LegacyUigf: {
      expectedLocale: string,
      expectedUid: Account['uid']
    } }
    | { Uigf: {
      businesses?: Business[],
      accounts: Record<Account['uid'], string> // uid: locale
    } }
    | { Srgf: {
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
    } }
    | { Uigf: {
      businesses?: Business[],
      accounts: Record<Account['uid'], string> // uid: locale
      exportTime: string | Date
      minimized?: boolean | null
    } }
    | { Srgf: {
      srgfVersion: 'v1.0'
      accountLocale: string
      accountUid: Account['uid']
      exportTime: string | Date
    } }
}>

export const exportGachaRecords = declareCommand<ExportGachaRecordsArgs, string>('business_export_gacha_records')

// #endregion

// #region: Gacha Records Fetcher

export type CreateGachaRecordsFetcherArgs<T extends Business> = NonNullable<{
  business: T
  region: BusinessRegion
  uid: Account['uid']
  gachaUrl: string
  gachaTypeAndLastEndIdMappings: GachaTypeAndLastEndIdMappings<T>
  eventChannel?: string
  saveToDatabase?: 'No' | 'Yes' | 'FullUpdate'
  saveOnConflict?: 'Nothing' | 'Update'
}>

export type CreateGachaRecordsFetcher = <T extends Business>(args: CreateGachaRecordsFetcherArgs<T>) => Promise<number>
export const createGachaRecordsFetcher: CreateGachaRecordsFetcher = declareCommand('business_create_gacha_records_fetcher')

export enum GachaRecordsFetcherFragmentKind {
  Sleeping = 'Sleeping',
  Ready = 'Ready',
  Pagination = 'Pagination',
  DataRef = 'DataRef',
  Data = 'Data',
  Completed = 'Completed',
  Finished = 'Finished'
}

export type GachaRecordsFetcherFragment<T extends Business> =
  | GachaRecordsFetcherFragmentKind.Sleeping
  | { [GachaRecordsFetcherFragmentKind.Ready]: PrettyCategory }
  | { [GachaRecordsFetcherFragmentKind.Pagination]: number }
  | { [GachaRecordsFetcherFragmentKind.DataRef]: number }
  | { [GachaRecordsFetcherFragmentKind.Data]: GachaRecord<T>[] }
  | { [GachaRecordsFetcherFragmentKind.Completed]: PrettyCategory }
  | GachaRecordsFetcherFragmentKind.Finished

// #endregion

// #region: Prettized Gacha Records

const NamedPrettyGachaRecordsError = 'PrettyGachaRecordsError' as const

export enum PrettyGachaRecordsErrorKind {
  MissingMetadataEntry = 'MissingMetadataEntry'
}

export type PrettyGachaRecordsError = DetailedError<typeof NamedPrettyGachaRecordsError,
  | { kind: PrettyGachaRecordsErrorKind.MissingMetadataEntry, business: Business, locale: string, name: string, itemId: string }
>

export function isPrettyGachaRecordsError (error: unknown): error is PrettyGachaRecordsError {
  return isDetailedError(error) &&
    error.name === NamedPrettyGachaRecordsError
}

export type FindAndPrettyGachaRecordsArgs<T extends Business> = FindGachaRecordsByBusinessAndUidArgs<T>

export type FindAndPrettyGachaRecords = <T extends Business>(args: FindAndPrettyGachaRecordsArgs<T>) => Promise<PrettizedGachaRecords<T>>
export const findAndPrettyGachaRecords: FindAndPrettyGachaRecords = declareCommand('business_find_and_pretty_gacha_records')

// #endregion

// Export

const BusinessCommands = {
  locateDataFolder,
  fromWebCachesGachaUrl,
  fromDirtyGachaUrl,
  createGachaRecordsFetcher,
  importGachaRecords,
  exportGachaRecords,
  findAndPrettyGachaRecords,
} as const

Object.freeze(BusinessCommands)

export default BusinessCommands

declare global {
  /**
   * @deprecated For devtools only, do not use in code.
   */
  // eslint-disable-next-line no-var
  var __APP_COMMANDS_BUSINESS: typeof BusinessCommands
}

// eslint-disable-next-line deprecation/deprecation
if (!globalThis.__APP_COMMANDS_BUSINESS) {
  // eslint-disable-next-line deprecation/deprecation
  globalThis.__APP_COMMANDS_BUSINESS = BusinessCommands
}
