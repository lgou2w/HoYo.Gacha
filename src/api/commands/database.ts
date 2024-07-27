import { DetailedError, isDetailedError } from '@/api/error'
import { Kv } from '@/interfaces/Kv'
import { declareCommand } from '.'

// See: src-tauri/src/database/mod.rs

// Error

const NamedSqlxError = 'SqlxError' as const
const NamedSqlxDatabaseError = 'SqlxDatabaseError' as const

export type SqlxError = DetailedError<typeof NamedSqlxError>
export type SqlxDatabaseError = DetailedError<typeof NamedSqlxDatabaseError, { code: string, kind: string }>

export function isSqlxError (error: unknown): error is SqlxError | SqlxDatabaseError {
  return isDetailedError(error) &&
    (error.name === NamedSqlxError ||
      error.name === NamedSqlxDatabaseError)
}

export function isSqlxDatabaseError (error: unknown): error is SqlxDatabaseError {
  return isSqlxError(error) &&
    error.name === NamedSqlxDatabaseError
}

// Commands

export type FindKvArgs = Pick<Kv, 'key'>
export const findKv = declareCommand<FindKvArgs, Kv | null>('database_find_kv')

export type CreateKvArgs = Pick<Kv, 'key' | 'val'>
export const createKv = declareCommand<CreateKvArgs, Kv>('database_create_kv')

export type UpdateKvArgs = Pick<Kv, 'key' | 'val'> & Partial<Pick<Kv, 'updatedAt'>>
export const updateKv = declareCommand<UpdateKvArgs, Kv | null>('database_update_kv')
export const upsertKv = declareCommand<UpdateKvArgs, Kv>('database_upsert_kv')

export type DeleteKvArgs = Pick<Kv, 'key'>
export const deleteKv = declareCommand<DeleteKvArgs, Kv | null>('database_delete_kv')
