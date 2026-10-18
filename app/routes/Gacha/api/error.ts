import { Account, AccountBusiness } from '@/api/Account'
import { AppError, AppErrorOfKind, DatabaseError, NativeIoError, isAppError, isAppErrorOfKind } from '@/api/error'

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
