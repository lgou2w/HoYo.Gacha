import { Channel } from '@tauri-apps/api/core'
import { Account, AccountBusiness } from '@/api/Account'
import { GachaRecord, GachaType } from '@/api/GachaRecord'
import { declareCommand } from '@/api/command'
import { AppError, AppErrorOfKind, DatabaseError, NativeIoError, isAppError, isAppErrorOfKind } from '@/api/error'
import { LanguageMetadata } from '@/i18n'
import { BannerCategory, GachaStats, StatsRecord } from './stats'

// region: Error compats

export const NamedGachaUrlFindError = 'GachaUrlFindError' as const
export type NamedGachaUrlFindError = typeof NamedGachaUrlFindError

export enum GachaUrlFindErrorKind {
  OpenDiskCache = 'OpenDiskCache',
  ReadDiskCache = 'ReadDiskCache',
  OpenWebcaches = 'OpenWebcaches',
  EmptyWebCaches = 'EmptyWebCaches',
}

export type GachaUrlFindError = AppError<
  NamedGachaUrlFindError,
  | {
    kind:
      | GachaUrlFindErrorKind.OpenDiskCache
      | GachaUrlFindErrorKind.ReadDiskCache
      | GachaUrlFindErrorKind.OpenWebcaches
    cause: NativeIoError
  }
  | {
    kind: GachaUrlFindErrorKind.EmptyWebCaches
  }
>

export function isGachaUrlFindError (error: unknown): error is GachaUrlFindError {
  return isAppError(error)
    && error.name === NamedGachaUrlFindError
}

export const NamedGachaUrlParseError = 'GachaUrlParseError' as const
export type NamedGachaUrlParseError = typeof NamedGachaUrlParseError

export enum GachaUrlParseErrorKind {
  Invalid = 'Invalid',
  MissingParam = 'MissingParam',
  UnsupportedGamebiz = 'UnsupportedGamebiz',
}

export type GachaUrlParseError = AppError<
  NamedGachaUrlParseError,
  | {
    kind: GachaUrlParseErrorKind.Invalid
  }
  | {
    kind: GachaUrlParseErrorKind.MissingParam
    name: string
  }
  | {
    kind: GachaUrlParseErrorKind.UnsupportedGamebiz
    value: string
  }
>

export function isGachaUrlParseError (error: unknown): error is GachaUrlParseError {
  return isAppError(error)
    && error.name === NamedGachaUrlParseError
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

export type GachaUrlRequestError = AppError<
  NamedGachaUrlRequestError,
  | {
    kind: GachaUrlRequestErrorKind.UnsupportedEndpoint
    gamebiz: string
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

export function isGachaUrlAuthkeyTimeout (
  error: unknown,
): error is AppErrorOfKind<
  GachaUrlRequestError,
  GachaUrlRequestErrorKind.AuthkeyTimeout
> {
  return isAppErrorOfKind(
    error,
    NamedGachaUrlRequestError,
    GachaUrlRequestErrorKind.AuthkeyTimeout,
  )
}

export const NamedGachaUrlValidationError = 'GachaUrlValidationError' as const
export type NamedGachaUrlValidationError = typeof NamedGachaUrlValidationError

export enum GachaUrlValidationErrorKind {
  InconsistentGamebiz = 'InconsistentGamebiz',
  EmptyData = 'EmptyData',
  NotFound = 'NotFound',
  InconsistentUid = 'InconsistentUid',
}

export type GachaUrlValidationError = AppError<
  NamedGachaUrlValidationError,
  | {
    kind: GachaUrlValidationErrorKind.InconsistentGamebiz
    expected: string
    actual: string
    region?: string | null
  }
  | {
    kind: GachaUrlValidationErrorKind.EmptyData
  }
  | {
    kind: GachaUrlValidationErrorKind.NotFound
  }
  | {
    kind: GachaUrlValidationErrorKind.InconsistentUid
    expected: Account['uid']
    actuals: Account['uid'][]
  }
>

export function isGachaUrlValidationError (error: unknown): error is GachaUrlValidationError {
  return isAppError(error)
    && error.name === NamedGachaUrlValidationError
}

// See: tauri/src/business/url.rs
export type GachaUrlError
  = | GachaUrlFindError
    | GachaUrlParseError
    | GachaUrlRequestError
    | GachaUrlValidationError

export const NamedGachaFetchError = 'GachaFetchError'
export type NamedGachaFetchError = typeof NamedGachaFetchError

export enum GachaFetchErrorKind {
  InvalidUid = 'InvalidUid',
  InconsistentUid = 'InconsistentUid',
  Metadata = 'Metadata',
}

export type GachaFetchError
  = | GachaUrlParseError
    | GachaUrlRequestError
    | DatabaseError
    | AppError<
      NamedGachaFetchError,
      | {
        kind: GachaFetchErrorKind.InvalidUid
        business: AccountBusiness
        value: Account['uid']
      }
      | {
        kind: GachaFetchErrorKind.InconsistentUid
        expected: Account['uid']
        actual: Account['uid']
      }
      | {
        kind: GachaFetchErrorKind.Metadata
        business: AccountBusiness
        lang: string
        itemName: string
      }
    >

export function isGachaFetchError (error: unknown): error is GachaFetchError {
  return isAppError(error)
    && error.name === NamedGachaFetchError
}

// endregion

export interface GachaUrl<T extends AccountBusiness> {
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
