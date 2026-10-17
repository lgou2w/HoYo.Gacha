// See: tauri/src/error.rs

export const AppErrorMarker = '__HG_ERROR__' as const

export interface AppError<
  Named extends string,
  Details extends object | null = null,
> {
  name: Named
  message: string
  details: Details
  readonly [AppErrorMarker]: true
}

export function isAppError (error: unknown): error is AppError<string, object | null> {
  return typeof error === 'object'
    && error !== null
    && AppErrorMarker in error
    && error[AppErrorMarker] === true
    // There's really no need here, as this error is passed from the backend.
    // But to ensure type safety.
    && ('name' in error && typeof error.name === 'string')
    && ('message' in error && typeof error.message === 'string')
}

export function extractErrorMessage (error: unknown): string {
  if (error instanceof Error || isAppError(error)) {
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  } else {
    return String(error)
  }
}

export type AppErrorOfKind<
  E extends AppError<string, { kind: string } | null>,
  K extends string,
>
  = & Omit<E, 'details'>
    & { details: Extract<NonNullable<E['details']>, { kind: K }> }

export function isAppErrorOfKind<
  E extends AppError<string, { kind: string } | null>,
  K extends NonNullable<E['details']> extends { kind: infer Kind extends string } ? Kind : never,
> (
  error: unknown,
  name: E['name'],
  kind: K,
): error is AppErrorOfKind<E, K> {
  if (!isAppError(error) || error.name !== name) {
    return false
  }

  const details = error.details as { kind?: unknown } | null | undefined
  return details != null && details.kind === kind
}

// `kind` mirrors `std::io::ErrorKind`'s Debug representation (e.g. "NotFound").
// See: https://doc.rust-lang.org/std/io/enum.ErrorKind.html
export interface NativeIoError {
  kind: string // too many variants to enumerate
  message: string
}

// Database error

export const NamedDatabaseError = 'DatabaseError' as const
export type NamedDatabaseError = typeof NamedDatabaseError

export enum DatabaseErrorKind {
  Pool = 'Pool',
  Interact = 'Interact',
  Sqlite = 'Sqlite',
}

export type DatabaseError = AppError<
  NamedDatabaseError,
  | null
  | { kind: DatabaseErrorKind, cause: string }
>

export function isDatabaseError (error: unknown): error is DatabaseError {
  return isAppError(error)
    && error.name === NamedDatabaseError
}
