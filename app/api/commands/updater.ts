import { Channel } from '@tauri-apps/api/core'
import { declareCommand } from '@/api/command'
import { AppError, NativeIOError, isAppError } from '@/api/error'

export const NamedUpdaterError = 'UpdaterError' as const
export type NamedUpdaterError = typeof NamedUpdaterError

export enum UpdaterErrorKind {
  Reqwest = 'Reqwest',
  Io = 'Io',
  DownloadedMismatch = 'DownloadedMismatch',
}

export type UpdaterError = AppError<NamedUpdaterError,
  | {
    kind: UpdaterErrorKind.Reqwest
    cause: string
  }
  | {
    kind: UpdaterErrorKind.Io
    cause: NativeIOError
  }
  | {
    kind: UpdaterErrorKind.DownloadedMismatch
  }
>

export function isUpdaterError (error: unknown): error is UpdaterError {
  return isAppError(error)
    && error.name === NamedUpdaterError
}

export enum UpdaterKind {
  Updating = 'Updating',
  UpToDate = 'UpToDate',
  Success = 'Success',
}

export type UpdaterResult
  = | UpdaterKind.Updating
    | UpdaterKind.UpToDate
    | UpdaterKind.Success
    | null // 'Feature disabled' only

const UpdaterCommands = {
  isUpdating:
    declareCommand<undefined, boolean>('updater_is_updating'),

  /**
   * @throws `UpdaterError`
   */
  update:
    declareCommand<{
      progressChannel: Channel<number>
      maxAttempts?: 0 | 1 | 2 | 3 | 4 | 5 | null
    }, UpdaterResult>('updater_update'),
} as const

export default UpdaterCommands

declare global {
  /**
   * @deprecated For devtools only, do not use in code.
   */
  var __UPDATER_COMMANDS__: typeof UpdaterCommands
}

if (!globalThis.__UPDATER_COMMANDS__) {
  globalThis.__UPDATER_COMMANDS__ = UpdaterCommands
}
