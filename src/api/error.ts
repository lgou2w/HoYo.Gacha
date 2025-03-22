// See: src-tauri/src/error.rs
export const Marker = '__HG_ERROR__' as const

export interface DetailedError<
  Named extends string,
  Details extends object | null = null
> {
  name: Named
  message: string
  details: Details
  readonly [Marker]: true
}

export function isDetailedError (error: unknown): error is DetailedError<string> {
  return typeof error === 'object' &&
    error !== null &&
    Marker in error &&
    error[Marker] === true &&
    // There's really no need here, as this error is passed from the backend.
    // But to ensure type safety.
    ('name' in error && typeof error.name === 'string') &&
    ('message' in error && typeof error.message === 'string')
}

export function extractErrorMessage (error: unknown): string {
  if (error instanceof Error || isDetailedError(error)) {
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  } else {
    return String(error)
  }
}
