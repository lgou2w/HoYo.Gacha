import { declareCommand } from '@/api/command'
import { AppError, isAppError } from '@/api/error'
import { AccountBusiness } from '@/api/schemas/Account'

export const NamedMetadataError = 'MetadataError' as const
export type NamedMetadataError = typeof NamedMetadataError

export enum MetadataErrorKind {
  Deserialize = 'Deserialize',
  Bake = 'Bake',
}

export type MetadataError = AppError<NamedMetadataError,
  | {
    kind: MetadataErrorKind.Deserialize
    cause: string
  }
  | {
    kind: MetadataErrorKind.Bake
    cause: string
  }
>

export function isMetadataError (error: unknown): error is MetadataError {
  return isAppError(error)
    && error.name === NamedMetadataError
}

export const NamedMetadataUpdateError = 'MetadataUpdateError' as const
export type NamedMetadataUpdateError = typeof NamedMetadataUpdateError

export enum MetadataUpdateErrorKind {
  Reqwest = 'Reqwest',
  DownloadedMismatch = 'DownloadedMismatch',
}

export type MetadataUpdateError = AppError<NamedMetadataUpdateError,
  | {
    kind: MetadataUpdateErrorKind.Reqwest
    cause: string
  }
  | {
    kind: MetadataUpdateErrorKind.DownloadedMismatch
  }
>

export function isMetadataUpdateError (error: unknown): error is MetadataUpdateError {
  return isAppError(error)
    && error.name === NamedMetadataUpdateError
}

export type MetadataUpdateKind
  = | 'Updating'
    | 'UpToDate'
    | { Success: string }
    | null // 'Feature disabled' only

const MetadataCommands = {
  hash:
    declareCommand<undefined, string>('metadata_hash'),

  locales:
    declareCommand<{ business: AccountBusiness }, string[] | null>('metadata_locales'),

  isUpdating:
    declareCommand<undefined, boolean>('metadata_is_updating'),

  /**
   * @throws `MetadataError`
   * @throws `MetadataUpdateError`
   */
  update:
    declareCommand<{ maxAttempts?: number | null }, MetadataUpdateKind>('metadata_update'),
} as const

Object.freeze(MetadataCommands)

export default MetadataCommands

declare global {
  /**
   * @deprecated For devtools only, do not use in code.
   */
  var __METADATA_COMMANDS__: typeof MetadataCommands
}

if (!globalThis.__METADATA_COMMANDS__) {
  globalThis.__METADATA_COMMANDS__ = MetadataCommands
}
