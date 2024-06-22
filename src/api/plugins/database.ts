import { Account } from '@/api/interfaces/account'
import { GachaRecord } from '@/api/interfaces/gacha'
import { defineCommand, IdentifierError, isIdentifierError } from './declares'

// See: src-tauri/src/database/mod.rs

const PluginName = 'hg_database'

type Command =
  // See: src-tauri/src/database/account_questioner.rs
  | 'find_accounts'
  | 'find_accounts_by_business'
  | 'find_account_by_id'
  | 'find_account_by_business_and_uid'
  | 'create_account'
  | 'update_account_game_data_dir_by_id'
  | 'update_account_gacha_url_by_id'
  | 'update_account_properties_by_id'
  | 'update_account_game_data_dir_and_properties_by_id'
  | 'delete_account_by_id'

  // See: src-tauri/src/database/gacha_record_questioner.rs
  | 'find_gacha_records_by_business_and_uid'
  | 'find_gacha_records_by_business_and_uid_with_gacha_type'

function bind<Payload = void, Result = void> (command: Command) {
  return defineCommand<Payload, Result>(PluginName, command)
}

// Error

const Identifier = 'DatabaseError' as const

export interface DatabaseError extends IdentifierError<typeof Identifier> {
  code: string
}

export function isDatabaseError (
  error: Error | object | unknown
): error is DatabaseError {
  return isIdentifierError(error) &&
    error.identifier === Identifier
}

// Plugin

export const DatabasePlugin = {
  name: PluginName,
  // Declared commands
  findAccounts: bind<void, Account[]>('find_accounts'),
  findAccountsByBusiness: bind<Pick<Account, 'business'>, Account[]>('find_accounts_by_business'),
  findAccountById: bind<Pick<Account, 'id'>, Account | null>('find_account_by_id'),
  findAccountByBusinessAndUid: bind<Pick<Account, 'business' | 'uid'>, Account | null>('find_account_by_business_and_uid'),
  createAccount: bind<Pick<Account, 'business' | 'uid' | 'gameDataDir'> & Partial<Pick<Account, 'properties'>>, Account>('create_account'),
  updateAccountGameDataDirById: bind<Pick<Account, 'gameDataDir' | 'id'>, Account | null>('update_account_game_data_dir_by_id'),
  updateAccountGachaUrlById: bind<Pick<Account, 'gachaUrl' | 'gachaUrlUpdatedAt' | 'id'>, Account | null>('update_account_gacha_url_by_id'),
  updateAccountPropertiesById: bind<Pick<Account, 'properties' | 'id'>, Account | null>('update_account_properties_by_id'),
  updateAccountGameDataDirAndPropertiesById: bind<Pick<Account, 'gameDataDir' | 'properties' | 'id'>, Account | null>('update_account_game_data_dir_and_properties_by_id'),
  deleteAccountById: bind<Pick<Account, 'id'>, Account | null>('delete_account_by_id'),
  findGachaRecordsByBusinessAndUid: bind<Pick<GachaRecord, 'business' | 'uid'>, GachaRecord[]>('find_gacha_records_by_business_and_uid'),
  findGachaRecordsByBusinessAndUidWithGachaType: bind<Pick<GachaRecord, 'business' | 'uid' | 'gachaType'>, GachaRecord[]>('find_gacha_records_by_business_and_uid_with_gacha_type')
} as const
