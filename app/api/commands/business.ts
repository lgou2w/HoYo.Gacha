import { Channel } from '@tauri-apps/api/core'
import { Command, declareCommand } from '@/api/command'
import { AppError, isAppError } from '@/api/error'
import { Account, AccountBusiness } from '@/api/schemas/Account'
import { GachaRecord, GachaType } from '@/api/schemas/GachaRecord'
import { PrettizedCategory, PrettizedRecord, PrettizedRecords } from '@/pages/Gacha/contexts/PrettizedRecords/types'
import { PickFileArgs } from './app'

// See: https://doc.rust-lang.org/std/io/struct.Error.html
export interface NativeIOError {
  kind: string // too many
  message: string
}

// #region: Error compat

export const NamedDirtyGachaUrlError = 'DirtyGachaUrlError' as const
export type NamedDirtyGachaUrlError = typeof NamedDirtyGachaUrlError

export enum DirtyGachaUrlErrorKind {
  OpenDiskCache = 'OpenDiskCache',
  ReadDiskCache = 'ReadDiskCache',
  OpenWebcaches = 'OpenWebcaches',
  EmptyWebCaches = 'EmptyWebCaches',
}

export type DirtyGachaUrlError = AppError<NamedDirtyGachaUrlError,
  | {
    kind:
      | DirtyGachaUrlErrorKind.OpenDiskCache
      | DirtyGachaUrlErrorKind.ReadDiskCache
      | DirtyGachaUrlErrorKind.OpenWebcaches
    cause: NativeIOError
  }
  | {
    kind: DirtyGachaUrlErrorKind.EmptyWebCaches
  }
>

export function isDirtyGachaUrlError (error: unknown): error is DirtyGachaUrlError {
  return isAppError(error)
    && error.name === NamedDirtyGachaUrlError
}

export const NamedParsedGachaUrlError = 'ParsedGachaUrlError' as const
export type NamedParsedGachaUrlError = typeof NamedParsedGachaUrlError

export enum ParsedGachaUrlErrorKind {
  InvalidUrl = 'InvalidUrl',
  RequiredParam = 'RequiredParam',
  UnsupportedGameBiz = 'UnsupportedGameBiz',
}

export type ParsedGachaUrlError = AppError<NamedParsedGachaUrlError,
  | {
    kind: ParsedGachaUrlErrorKind.InvalidUrl
  }
  | {
    kind: ParsedGachaUrlErrorKind.RequiredParam
    name: string
  }
  | {
    kind: ParsedGachaUrlErrorKind.UnsupportedGameBiz
    gameBiz: string
    region: string
  }
>

export function isParsedGachaUrlError (error: unknown): error is ParsedGachaUrlError {
  return isAppError(error)
    && error.name === NamedParsedGachaUrlError
}

export const NamedGachaUrlRequestError = 'GachaUrlRequestError' as const
export type NamedGachaUrlRequestError = typeof NamedGachaUrlRequestError

export enum GachaUrlRequestErrorKind {
  UnsupportedEndpoint = 'UnsupportedEndpoint',
  Reqwest = 'Reqwest',
  AuthkeyTimeout = 'AuthkeyTimeout',
  VisitTooFrequently = 'VisitTooFrequently',
  UnexpectedResponse = 'UnexpectedResponse',
  ReachedMaxAttempts = 'ReachedMaxAttempts',
}

export type GachaUrlRequestError = AppError<NamedGachaUrlRequestError,
  | {
    kind: GachaUrlRequestErrorKind.UnsupportedEndpoint
    gameBiz: string
    endpoint: string
  }
  | {
    kind: GachaUrlRequestErrorKind.Reqwest
    cause: string
  }
  | {
    kind: GachaUrlRequestErrorKind.AuthkeyTimeout
  }
  | {
    kind: GachaUrlRequestErrorKind.VisitTooFrequently
  }
  | {
    kind: GachaUrlRequestErrorKind.UnexpectedResponse
    retcode: number
    message: string
  }
  | {
    kind: GachaUrlRequestErrorKind.ReachedMaxAttempts
  }
>

export function isGachaUrlRequestError (error: unknown): error is GachaUrlRequestError {
  return isAppError(error)
    && error.name === NamedGachaUrlRequestError
}

// #endregion

// #region: Validate Uid

export type ValidateUidArgs
  = Pick<Account, 'business' | 'uid'>

export type ValidateUid
  = Command<ValidateUidArgs, 'official' | 'oversea' | null>

// #endregion

// #region: Locate Data Folder

export const NamedLocateDataFolderError = 'LocateDataFolderError' as const
export type NamedLocateDataFolderError = typeof NamedLocateDataFolderError

export enum LocateDataFolderErrorKind {
  InvalidUid = 'InvalidUid',
  UnityLogNotFound = 'UnityLogNotFound',
  OpenUnityLog = 'OpenUnityLog',
  Invalid = 'Invalid',
  Vacant = 'Vacant',
}

export type LocateDataFolderError = AppError<NamedLocateDataFolderError,
  | {
    kind: LocateDataFolderErrorKind.InvalidUid
    business: AccountBusiness
    value: Account['uid']
  }
  | {
    kind: LocateDataFolderErrorKind.UnityLogNotFound
    path: string
  }
  | {
    kind: LocateDataFolderErrorKind.OpenUnityLog
    path: string
    cause: NativeIOError
  }
  | {
    kind: LocateDataFolderErrorKind.Invalid
  }
  | {
    kind: LocateDataFolderErrorKind.Vacant
  }
>

export function isLocateDataFolderError (error: unknown): error is LocateDataFolderError {
  return isAppError(error)
    && error.name === NamedLocateDataFolderError
}

export interface DataFolder<T extends AccountBusiness> {
  business: T
  value: string
}

export enum LocateDataFolderFactoryKind {
  UnityLog = 'UnityLog',
  Manual = 'Manual',
}

export type LocateDataFolderFactory
  = | { [LocateDataFolderFactoryKind.UnityLog]: null }
    | { [LocateDataFolderFactoryKind.Manual]: { title: string } }

export interface LocateDataFolderArgs<T extends AccountBusiness> {
  business: T
  uid: Account['uid']
  factory: LocateDataFolderFactory
}

export type LocateDataFolder
  = <T extends AccountBusiness> (args: LocateDataFolderArgs<T>) => Promise<DataFolder<T>>

// #endregion

// #region: From Gacha url

export const NamedGachaUrlError = 'GachaUrlError' as const
export type NamedGachaUrlError = typeof NamedGachaUrlError

export enum GachaUrlErrorKind {
  InvalidUid = 'InvalidUid',
  EmptyData = 'EmptyData',
  NotFound = 'NotFound',
  InconsistentUid = 'InconsistentUid',
}

export type GachaUrlError = AppError<NamedGachaUrlError,
  | {
    kind: GachaUrlErrorKind.InvalidUid
    business: AccountBusiness
    value: Account['uid']
  }
  | {
    kind: GachaUrlErrorKind.EmptyData
  }
  | {
    kind: GachaUrlErrorKind.NotFound
  }
  | {
    kind: GachaUrlErrorKind.InconsistentUid
    expected: Account['uid']
    actuals: Account['uid'][]
  }
>

export function isGachaUrlError (error: unknown): error is GachaUrlError {
  return isAppError(error)
    && error.name === NamedGachaUrlError
}

export interface GachaUrl<T extends AccountBusiness> {
  business: T
  ownerUid: Account['uid']
  creationTime?: string | null
  value: string
}

export interface FromWebcachesGachaUrlArgs<T extends AccountBusiness> {
  business: T
  uid: Account['uid']
  dataFolder: Account['dataFolder']
}

export type FromWebcachesGachaUrl
  = <T extends AccountBusiness> (args: FromWebcachesGachaUrlArgs<T>) => Promise<GachaUrl<T>>

export interface FromDirtyGachaUrlArgs<T extends AccountBusiness> {
  business: T
  uid: Account['uid']
  dirty: string
}

export type FromDirtyGachaUrl
  = <T extends AccountBusiness> (args: FromDirtyGachaUrlArgs<T>) => Promise<GachaUrl<T>>

// #endregion

// #region: Image Resolver

export interface ResolveImageArgs {
  business: AccountBusiness
  itemCategory: NonNullable<PrettizedRecord['itemCategory']>
  itemId: PrettizedRecord['itemId']
}

export type ResolveImage
  = (args: ResolveImageArgs) => Promise<Uint8Array>

export interface PrettyRecordsArgs<T extends AccountBusiness> {
  business: T
  uid: Account['uid']
  customLocale?: string | null
}

export type PrettyRecords
  = <T extends AccountBusiness> (args: PrettyRecordsArgs<T>) => Promise<PrettizedRecords<T>>

// #endregion

// #region: Records Fetcher

export const NamedGachaFetcherError = 'GachaFetcherError' as const
export type NamedGachaFetcherError = typeof NamedGachaFetcherError

export enum GachaFetcherErrorKind {
  InvalidUid = 'InvalidUid',
  MetadataEntry = 'MetadataEntry',
}

export type GachaFetcherError = AppError<NamedGachaFetcherError,
  | {
    kind: GachaFetcherErrorKind.InvalidUid
    business: AccountBusiness
    value: Account['uid']
  }
  | {
    kind: GachaFetcherErrorKind.MetadataEntry
    business: AccountBusiness
    lang: GachaRecord<AccountBusiness>['lang']
    itemName: GachaRecord<AccountBusiness>['itemName']
  }
>

export function isGachaFetcherError (error: unknown): error is GachaFetcherError {
  return isAppError(error)
    && error.name === NamedGachaFetcherError
}

export enum SaveToDatabase {
  No = 'No',
  Yes = 'Yes',
  FullUpdate = 'FullUpdate',
}

export enum SaveOnConflict {
  Nothing = 'Nothing',
  Update = 'Update',
}

export interface FetchRecordsArgs<T extends AccountBusiness> {
  business: T
  uid: Account['uid']
  gachaUrl: string
  gachaTypeAndLastEndIds: [GachaType<T>, GachaRecord<T>['id'] | null | undefined][]
  eventChannel: Channel<FetchRecordsEvent>
  saveToDatabase?: SaveToDatabase | null
  saveOnConflict?: SaveOnConflict | null
}

export type FetchRecords
  = <T extends AccountBusiness> (args: FetchRecordsArgs<T>) => Promise<number>

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
    | { [FetchRecordsEventKind.Ready]: PrettizedCategory | null }
    | { [FetchRecordsEventKind.Pagination]: number }
    | { [FetchRecordsEventKind.Data]: number }
    | { [FetchRecordsEventKind.Completed]: PrettizedCategory | null }
    | FetchRecordsEventKind.Finished

// #endregion

// #region: Legacy Migration

export const NamedLegacyMigrationError = 'LegacyMigrationError' as const
export type NamedLegacyMigrationError = typeof NamedLegacyMigrationError

export enum LegacyMigrationErrorKind {
  NotFound = 'NotFound',
  SamePath = 'SamePath',
  InvalidUid = 'InvalidUid',
  InvalidRecord = 'InvalidRecord',
  MetadataLocale = 'MetadataLocale',
  MetadataEntry = 'MetadataEntry',
}

export type LegacyMigrationError = AppError<NamedLegacyMigrationError,
  | {
    kind: LegacyMigrationErrorKind.NotFound
  }
  | {
    kind: LegacyMigrationErrorKind.SamePath
  }
  | {
    kind: LegacyMigrationErrorKind.InvalidUid
    business: AccountBusiness
    value: Account['uid']
  }
  | {
    kind: LegacyMigrationErrorKind.InvalidRecord
    business: AccountBusiness
    uid: Account['uid']
    id: GachaRecord<AccountBusiness>['id']
    field: string
    value: string
  }
  | {
    kind: LegacyMigrationErrorKind.MetadataLocale
    business: AccountBusiness
    lang: GachaRecord<AccountBusiness>['lang']
  }
  | {
    kind: LegacyMigrationErrorKind.MetadataEntry
    business: AccountBusiness
    lang: GachaRecord<AccountBusiness>['lang']
    field: string
    value: string
  }
>

export function isLegacyMigrationError (error: unknown): error is LegacyMigrationError {
  return isAppError(error)
    && error.name === NamedLegacyMigrationError
}

export interface LegacyMigrationResult {
  accounts: number
  records: Record<AccountBusiness, number>
  elapsed: number
}

export interface LegacyMigrationArgs extends Record<string, unknown> {
  /** Legacy database file */
  legacy?: string | null
}

export type LegacyMigration
  = Command<LegacyMigrationArgs, LegacyMigrationResult>

// #endregion

// #region: Converters

export enum UigfVersion {
  V1_0 = 'v1.0',
  V2_0 = 'v2.0',
  V2_1 = 'v2.1',
  V2_2 = 'v2.2',
  V2_3 = 'v2.3',
  V2_4 = 'v2.4',
  V3_0 = 'v3.0',
  V4_0 = 'v4.0',
  V4_1 = 'v4.1',
  V4_2 = 'v4.2',
}

export const NamedUigfError = 'UigfError' as const
export type NamedUigfError = typeof NamedUigfError

export enum UigfErrorKind {
  UnsupportedVersion = 'UnsupportedVersion',
  InvalidUid = 'InvalidUid',
  MappingGachaType = 'MappingGachaType',
  MetadataEntry = 'MetadataEntry',
  CreateOutput = 'CreateOutput',
  Serialize = 'Serialize',
  OpenInput = 'OpenInput',
  Deserialize = 'Deserialize',
  InvalidVersion = 'InvalidVersion',
  InconsistentUid = 'InconsistentUid',
  RequiredField = 'RequiredField',
  MetadataLocale = 'MetadataLocale',
  VacantAccount = 'VacantAccount',
}

export type UigfError = AppError<NamedUigfError,
  | {
    kind: UigfErrorKind.UnsupportedVersion
    actual: UigfVersion
    expected: UigfVersion[]
  }
  | {
    kind: UigfErrorKind.InvalidUid
    business: AccountBusiness
    value: Account['uid']
  }
  | {
    kind: UigfErrorKind.MappingGachaType
    value: number
    cursor: number
  }
  | {
    kind: UigfErrorKind.MetadataEntry
    business: AccountBusiness
    lang: GachaRecord<AccountBusiness>['lang']
    field: string
    value: string
    cursor: number
  }
  | {
    kind: UigfErrorKind.CreateOutput
    path: string
    cause: NativeIOError
  }
  | {
    kind: UigfErrorKind.Serialize
    cause: string
  }
  | {
    kind: UigfErrorKind.OpenInput
    path: string
    cause: NativeIOError
  }
  | {
    kind: UigfErrorKind.Deserialize
    cause: string
  }
  | {
    kind: UigfErrorKind.InvalidVersion
    value: string
  }
  | {
    kind: UigfErrorKind.InconsistentUid
    actual: Account['uid']
    expected: Account['uid']
  }
  | {
    kind: UigfErrorKind.RequiredField
    path: string
    cursor: number
  }
  | {
    kind: UigfErrorKind.MetadataLocale
    business: AccountBusiness
    lang: GachaRecord<AccountBusiness>['lang']
  }
  | {
    kind: UigfErrorKind.VacantAccount
    business: AccountBusiness
    uid: Account['uid']
  }
>

export function isUigfError (error: unknown): error is UigfError {
  return isAppError(error)
    && error.name === NamedUigfError
}

export const NamedCsvError = 'CsvError' as const
export type NamedCsvError = typeof NamedCsvError

export enum CsvErrorKind {
  InvalidUid = 'InvalidUid',
  CreateOutput = 'CreateOutput',
  WriteOutput = 'WriteOutput',
}

export type CsvError = AppError<NamedCsvError,
  | {
    kind: CsvErrorKind.InvalidUid
    business: AccountBusiness
    value: Account['uid']
  }
  | {
    kind: CsvErrorKind.CreateOutput
    path: string
    cause: NativeIOError
  }
  | {
    kind: CsvErrorKind.WriteOutput
    path: string
    cause: NativeIOError
  }
>

export function isCsvError (error: unknown): error is CsvError {
  return isAppError(error)
    && error.name === NamedCsvError
}

export enum RecordsWriterFactory {
  ClassicUigf = 'ClassicUigf',
  ClassicSrgf = 'ClassicSrgf',
  Uigf = 'Uigf',
  Csv = 'Csv',
}

export enum RecordsReaderFactory {
  ClassicUigf = 'ClassicUigf',
  ClassicSrgf = 'ClassicSrgf',
  Uigf = 'Uigf',
}

export interface ClassicUigfWriterOptions {
  uigfVersion:
    | UigfVersion.V2_0
    | UigfVersion.V2_1
    | UigfVersion.V2_2
    | UigfVersion.V2_3
    | UigfVersion.V2_4
    | UigfVersion.V3_0
  uid: Account['uid']
  lang: GachaRecord<AccountBusiness>['lang']
  exportTime: string | Date
  pretty?: boolean | null
}

export interface ClassicUigfReaderOptions {
  uid: Account['uid']
  lang: GachaRecord<AccountBusiness>['lang']
}

export interface ClassicSrgfWriterOptions {
  srgfVersion: UigfVersion.V1_0
  uid: Account['uid']
  lang: GachaRecord<AccountBusiness>['lang']
  exportTime: string | Date
  pretty?: boolean | null
}

export interface ClassicSrgfReaderOptions {
  uid: Account['uid']
}

export interface UigfWriterOptions {
  uigfVersion:
    | UigfVersion.V4_0
    | UigfVersion.V4_1
    | UigfVersion.V4_2
  // business -> uid -> lang
  businesses: Record<
    AccountBusiness,
    Record<
      Account['uid'],
      GachaRecord<AccountBusiness>['lang']
    >
  >
  exportTime: string | Date
  pretty?: boolean | null
  minimized?: boolean | null
}

export interface UigfReaderOptions {
  // business -> uid -> lang
  businesses: Record<
    AccountBusiness,
    Record<
      Account['uid'],
      GachaRecord<AccountBusiness>['lang']
    >
  >
}

export interface CsvWriterOptions {
  business: AccountBusiness
  uid: Account['uid']
  withoutColumns?: boolean | null
}

export type RecordsWriterOptions
  = | { [RecordsWriterFactory.ClassicUigf]: ClassicUigfWriterOptions }
    | { [RecordsWriterFactory.ClassicSrgf]: ClassicSrgfWriterOptions }
    | { [RecordsWriterFactory.Uigf]: UigfWriterOptions }
    | { [RecordsWriterFactory.Csv]: CsvWriterOptions }

export type RecordsReaderOptions
  = | { [RecordsReaderFactory.ClassicUigf]: ClassicUigfReaderOptions }
    | { [RecordsReaderFactory.ClassicSrgf]: ClassicSrgfReaderOptions }
    | { [RecordsReaderFactory.Uigf]: UigfReaderOptions }

export const SupportedRecordsWriterFactories: Record<
  AccountBusiness,
  RecordsWriterFactory[]
> = {
  [AccountBusiness.GenshinImpact]: [
    RecordsWriterFactory.ClassicUigf,
    RecordsWriterFactory.Uigf,
    RecordsWriterFactory.Csv,
  ],
  [AccountBusiness.HonkaiStarRail]: [
    RecordsWriterFactory.ClassicSrgf,
    RecordsWriterFactory.Uigf,
    RecordsWriterFactory.Csv,
  ],
  [AccountBusiness.ZenlessZoneZero]: [
    RecordsWriterFactory.Uigf,
    RecordsWriterFactory.Csv,
  ],
  [AccountBusiness.MiliastraWonderland]: [
    RecordsWriterFactory.Uigf,
    RecordsWriterFactory.Csv,
  ],
}

export const SupportedRecordsReaderFactories: Record<
  AccountBusiness,
  RecordsReaderFactory[]
> = {
  [AccountBusiness.GenshinImpact]: [
    RecordsReaderFactory.ClassicUigf,
    RecordsReaderFactory.Uigf,
  ],
  [AccountBusiness.HonkaiStarRail]: [
    RecordsReaderFactory.ClassicSrgf,
    RecordsReaderFactory.Uigf,
  ],
  [AccountBusiness.ZenlessZoneZero]: [
    RecordsReaderFactory.Uigf,
  ],
  [AccountBusiness.MiliastraWonderland]: [
    RecordsReaderFactory.Uigf,
  ],
}

export const SupportedRecordsWriterUigfVersions: Record<
  RecordsWriterFactory,
  UigfVersion[]
> = {
  [RecordsWriterFactory.ClassicUigf]: [
    UigfVersion.V3_0,
    UigfVersion.V2_4,
    UigfVersion.V2_3,
    UigfVersion.V2_2,
    UigfVersion.V2_1,
    UigfVersion.V2_0,
  ],
  [RecordsWriterFactory.ClassicSrgf]: [
    UigfVersion.V1_0,
  ],
  [RecordsWriterFactory.Uigf]: [
    UigfVersion.V4_2,
    UigfVersion.V4_1,
    UigfVersion.V4_0,
  ],
  [RecordsWriterFactory.Csv]: [],
}

export const SupportedRecordsReaderUigfVersions: Record<
  RecordsReaderFactory,
  UigfVersion[]
> = {
  [RecordsReaderFactory.ClassicUigf]: [
    UigfVersion.V3_0,
    UigfVersion.V2_4,
    UigfVersion.V2_3,
    UigfVersion.V2_2,
    UigfVersion.V2_1,
    UigfVersion.V2_0,
  ],
  [RecordsReaderFactory.ClassicSrgf]: [
    UigfVersion.V1_0,
  ],
  [RecordsReaderFactory.Uigf]: [
    UigfVersion.V4_2,
    UigfVersion.V4_1,
    UigfVersion.V4_0,
  ],
}

export const SupportedRecordsReaderFactoryFilters: Record<
  RecordsReaderFactory,
  Required<PickFileArgs>['filters']
> = {
  [RecordsReaderFactory.ClassicUigf]: [['Legacy UIGF JSON', ['json']]],
  [RecordsReaderFactory.ClassicSrgf]: [['Legacy SRGF JSON', ['json']]],
  [RecordsReaderFactory.Uigf]: [['UIGF JSON', ['json']]],
}

export interface ExportRecordsArgs extends Record<string, unknown> {
  writer: RecordsWriterOptions
  output: string // Output folder
  filename: string // filename without extension
  opener?: boolean | null // Whether open this file with Explorer (Windows only)
}

export type ExportRecords
  = Command<ExportRecordsArgs, string>

export interface ImportRecordsArgs extends Record<string, unknown> {
  reader: RecordsReaderOptions
  input: string // input file path
  saveOnConflict?: 'Nothing' | 'Update' | null
  progressChannel: Channel<number>
}

export type ImportRecords
  = Command<ImportRecordsArgs, number>

// #endregion

// #region: Commands

const BusinessCommands = {
  validateUid:
    declareCommand('business_validate_uid') as ValidateUid,

  /**
   * @throws `LocateDataFolderError`
   */
  locateDataFolder:
    declareCommand('business_locate_data_folder') as LocateDataFolder,

  /**
   * @throws `GachaUrlError`
   * @throws `DirtyGachaUrlError`
   * @throws `ParsedGachaUrlError`
   * @throws `GachaUrlRequestError`
   */
  fromWebcachesGachaUrl:
    declareCommand('business_from_webcaches_gacha_url') as FromWebcachesGachaUrl,

  /**
   * @throws `GachaUrlError`
   * @throws `DirtyGachaUrlError`
   * @throws `ParsedGachaUrlError`
   * @throws `GachaUrlRequestError`
   */
  fromDirtyGachaUrl:
    declareCommand('business_from_dirty_gacha_url') as FromDirtyGachaUrl,

  resolveImageMime:
    declareCommand<undefined, string>('business_resolve_image_mime', true),

  resolveImage:
    declareCommand('business_resolve_image') as ResolveImage,

  /** @throws `DatabaseError` */
  prettyRecords:
    declareCommand('business_pretty_records') as PrettyRecords,

  /**
   * @throws `GachaFetcherError`
   * @throws `ParsedGachaUrlError`
   * @throws `GachaUrlRequestError`
   */
  fetchRecords:
    declareCommand('business_fetch_records') as FetchRecords,

  /**
   * @throws `DatabaseError`
   * @throws `LegacyMigrationError`
   */
  legacyMigration:
    declareCommand('business_legacy_migration') as LegacyMigration,

  /**
   * @throws `DatabaseError`
   * @throws `UigfError`
   * @throws `CsvError`
   */
  exportRecords:
    declareCommand('business_export_records') as ExportRecords,

  /**
   * @throws `DatabaseError`
   * @throws `UigfError`
   * @throws `CsvError`
   */
  importRecords:
    declareCommand('business_import_records') as ImportRecords,
} as const

Object.freeze(BusinessCommands)

export default BusinessCommands

declare global {
  /**
   * @deprecated For devtools only, do not use in code.
   */
  var __BUSINESS_COMMANDS__: typeof BusinessCommands
}

if (!globalThis.__BUSINESS_COMMANDS__) {
  globalThis.__BUSINESS_COMMANDS__ = BusinessCommands
}

// #endregion
