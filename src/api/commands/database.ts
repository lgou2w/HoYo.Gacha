import { DetailedError, isDetailedError } from '@/api/error'
import { Account } from '@/interfaces/Account'
import { Business } from '@/interfaces/Business'
import { GachaRecord } from '@/interfaces/GachaRecord'
import { Kv } from '@/interfaces/Kv'
import { declareCommand } from '.'

// See: src-tauri/src/database/mod.rs

const NamedSqlxError = 'SqlxError' as const
const NamedSqlxDatabaseError = 'SqlxDatabaseError' as const

export type SqlxError = DetailedError<typeof NamedSqlxError>

export enum SqlxDatabaseErrorKind {
  UniqueViolation = 'UniqueViolation',
  ForeignKeyViolation = 'ForeignKeyViolation',
  NotNullViolation = 'NotNullViolation',
  CheckViolation = 'CheckViolation',
  Other = 'Other',
}

export type SqlxDatabaseError = DetailedError<typeof NamedSqlxDatabaseError, {
  code: string
  kind: SqlxDatabaseErrorKind
}>

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

export type ExecuteArgs = { query: string }
export const execute = declareCommand<ExecuteArgs, number>('database_execute')

// #region: Kv

export type FindKvArgs = Pick<Kv, 'key'>
export const findKv = declareCommand<FindKvArgs, Kv | null>('database_find_kv')

export type CreateKvArgs = Pick<Kv, 'key' | 'val'>
export const createKv = declareCommand<CreateKvArgs, Kv>('database_create_kv')

export type UpdateKvArgs = Pick<Kv, 'key' | 'val'> & Partial<Pick<Kv, 'updatedAt'>>
export const updateKv = declareCommand<UpdateKvArgs, Kv | null>('database_update_kv')
export const upsertKv = declareCommand<UpdateKvArgs, Kv>('database_upsert_kv')

export type DeleteKvArgs = Pick<Kv, 'key'>
export const deleteKv = declareCommand<DeleteKvArgs, Kv | null>('database_delete_kv')

// #endregion

// #region: Account

export type FindAccountsByBusinessArgs = Pick<Account, 'business'>
export const findAccountsByBusiness = declareCommand<FindAccountsByBusinessArgs, Account[]>('database_find_accounts_by_business')

export type FindAccountByBusinessAndUidArgs = Pick<Account, 'business' | 'uid'>
export const findAccountByBusinessAndUid = declareCommand<FindAccountByBusinessAndUidArgs, Account | null>('database_find_account_by_business_and_uid')

export type CreateAccountArgs = Pick<Account, 'business' | 'uid' | 'dataFolder'> & Partial<Pick<Account, 'properties'>>
export const createAccount = declareCommand<CreateAccountArgs, Account>('database_create_account')

export type UpdateAccountDataFolderByBusinessAndUidArgs = Pick<Account, 'business' | 'uid' | 'dataFolder'>
export const updateAccountDataFolderByBusinessAndUid = declareCommand<UpdateAccountDataFolderByBusinessAndUidArgs, Account | null>('database_update_account_data_folder_by_business_and_uid')

export type UpdateAccountPropertiesByBusinessAndUidArgs = Pick<Account, 'business' | 'uid' | 'properties'>
export const updateAccountPropertiesByBusinessAndUid = declareCommand<UpdateAccountPropertiesByBusinessAndUidArgs, Account | null>('database_update_account_properties_by_business_and_uid')

export type DeleteAccountByBusinessAndUidArgs = Pick<Account, 'business' | 'uid'>
export const deleteAccountByBusinessAndUid = declareCommand<DeleteAccountByBusinessAndUidArgs, Account | null>('database_delete_account_by_business_and_uid')

// #endregion

// #region: Gacha Record

export type FindGachaRecordsByUidArgs = Pick<GachaRecord<Business>, 'uid'>
export const findGachaRecordsByUid = declareCommand<FindGachaRecordsByUidArgs, GachaRecord<Business>[]>('database_find_gacha_records_by_uid')

export type FindGachaRecordsByBusinessAndUidArgs<T extends Business> = Pick<GachaRecord<T>, 'business' | 'uid'>
export type FindGachaRecordsByBusinessAndUid = <T extends Business>(args: FindGachaRecordsByBusinessAndUidArgs<T>) => Promise<GachaRecord<T>[]>
export const findGachaRecordsByBusinessAndUid: FindGachaRecordsByBusinessAndUid = declareCommand('database_find_gacha_records_by_business_and_uid')

export type FindGachaRecordsByBusinessAndUidWithLimitArgs<T extends Business> = FindGachaRecordsByBusinessAndUidArgs<T> & { limit: number }
export type FindGachaRecordsByBusinessAndUidWithLimit = <T extends Business>(args: FindGachaRecordsByBusinessAndUidWithLimitArgs<T>) => Promise<GachaRecord<T>[]>
export const findGachaRecordsByBusinessAndUidWithLimit: FindGachaRecordsByBusinessAndUidWithLimit = declareCommand('database_find_gacha_records_by_business_and_uid_with_limit')

export type FindGachaRecordsByBusinessAndUidWithGachaTypeArgs<T extends Business> = Pick<GachaRecord<T>, 'business' | 'uid' | 'gachaType'>
export type FindGachaRecordsByBusinessAndUidWithGachaType = <T extends Business>(args: FindGachaRecordsByBusinessAndUidWithGachaTypeArgs<T>) => Promise<GachaRecord<T>[]>
export const findGachaRecordsByBusinessAndUidWithGachaType: FindGachaRecordsByBusinessAndUidWithGachaType = declareCommand('database_find_gacha_records_by_business_and_uid_with_gacha_type')

export type CreateGachaRecordsArgs<T extends Business> = NonNullable<{ records: GachaRecord<T>[], onConflict: 'Nothing' | 'Update' }>
export type CreateGachaRecords = <T extends Business>(args: CreateGachaRecordsArgs<T>) => Promise<number>
export const createGachaRecords: CreateGachaRecords = declareCommand('database_create_gacha_records')

export type DeleteGachaRecordsByBusinessAndUidArgs<T extends Business> = Pick<GachaRecord<T>, 'business' | 'uid'>
export type DeleteGachaRecordsByBusinessAndUid = <T extends Business>(args: DeleteGachaRecordsByBusinessAndUidArgs<T>) => Promise<number>
export const deleteGachaRecordsByBusinessAndUid: DeleteGachaRecordsByBusinessAndUid = declareCommand('database_delete_gacha_records_by_business_and_uid')

export type FindGachaRecordsByBusinessesAndUidArgs = NonNullable<{
  businesses: Business[],
  uid: GachaRecord<Business>['uid']
}>

export const findGachaRecordsByBusinessesAndUid = declareCommand<FindGachaRecordsByBusinessesAndUidArgs, GachaRecord<Business>[]>('database_find_gacha_records_by_businesses_and_uid')

export type FindGachaRecordsByBusinessesOrUidArgs = NonNullable<{
  businesses?: Business[],
  uid: GachaRecord<Business>['uid']
}>

export const findGachaRecordsByBusinessesOrUid = declareCommand<FindGachaRecordsByBusinessesOrUidArgs, GachaRecord<Business>[]>('database_find_gacha_records_by_businesses_or_uid')

// #endregion

// Export

const DatabaseCommands = {
  execute,
  findKv,
  createKv,
  updateKv,
  upsertKv,
  deleteKv,
  findAccountsByBusiness,
  findAccountByBusinessAndUid,
  createAccount,
  updateAccountDataFolderByBusinessAndUid,
  updateAccountPropertiesByBusinessAndUid,
  deleteAccountByBusinessAndUid,
  findGachaRecordsByUid,
  findGachaRecordsByBusinessAndUid,
  findGachaRecordsByBusinessAndUidWithLimit,
  findGachaRecordsByBusinessAndUidWithGachaType,
  createGachaRecords,
  deleteGachaRecordsByBusinessAndUid,
  findGachaRecordsByBusinessesAndUid,
  findGachaRecordsByBusinessesOrUid,
} as const

Object.freeze(DatabaseCommands)

export default DatabaseCommands

declare global {
  /**
   * @deprecated For devtools only, do not use in code.
   */
  // eslint-disable-next-line no-var
  var __APP_COMMANDS_DATABASE__: typeof DatabaseCommands
}

// eslint-disable-next-line deprecation/deprecation
if (!globalThis.__APP_COMMANDS_DATABASE__) {
  // eslint-disable-next-line deprecation/deprecation
  globalThis.__APP_COMMANDS_DATABASE__ = DatabaseCommands
}
