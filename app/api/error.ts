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
