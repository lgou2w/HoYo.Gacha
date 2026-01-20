import { AppError, isAppError } from '@/api/error'
import { AccountCommands } from '@/api/schemas/Account'
import { GachaRecordCommands } from '@/api/schemas/GachaRecord'
import { KeyValuePairCommands } from '@/api/schemas/KeyValuePair'

export const NamedDatabaseError = 'DatabaseError' as const
export type NamedDatabaseError = typeof NamedDatabaseError

export enum DatabaseErrorKind {
  UniqueViolation = 'UniqueViolation',
  ForeignKeyViolation = 'ForeignKeyViolation',
  NotNullViolation = 'NotNullViolation',
  CheckViolation = 'CheckViolation',
  Other = 'Other',
}

export type DatabaseError = AppError<NamedDatabaseError,
  | null
  | {
    code: string
    kind: DatabaseErrorKind
  }
>

export function isDatabaseError (error: unknown): error is DatabaseError {
  return isAppError(error)
    && error.name === NamedDatabaseError
}

const DatabaseCommands = {
  account: AccountCommands,
  gachaRecord: GachaRecordCommands,
  keyValuePair: KeyValuePairCommands,
} as const

Object.freeze(DatabaseCommands)

export default DatabaseCommands

declare global {
  /**
   * @deprecated For devtools only, do not use in code.
   */
  var __DATABASE_COMMANDS__: typeof DatabaseCommands
}

if (!globalThis.__DATABASE_COMMANDS__) {
  globalThis.__DATABASE_COMMANDS__ = DatabaseCommands
}
