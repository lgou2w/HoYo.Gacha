import { Command, declareCommand } from '@/api/command'
import { JsonProperties } from './shared'

// See: tauri/src/database/schemas/account.rs

export enum AccountBusiness {
  GenshinImpact = 0,
  MiliastraWonderland = 3,
  HonkaiStarRail = 1,
  ZenlessZoneZero = 2,
}

export const GenshinImpact = AccountBusiness.GenshinImpact
export type GenshinImpact = typeof GenshinImpact
export const KeyofGenshinImpact = 'GenshinImpact' as const

export const MiliastraWonderland = AccountBusiness.MiliastraWonderland
export type MiliastraWonderland = typeof MiliastraWonderland
export const KeyofMiliastraWonderland = 'MiliastraWonderland' as const

export const HonkaiStarRail = AccountBusiness.HonkaiStarRail
export type HonkaiStarRail = typeof HonkaiStarRail
export const KeyofHonkaiStarRail = 'HonkaiStarRail' as const

export const ZenlessZoneZero = AccountBusiness.ZenlessZoneZero
export type ZenlessZoneZero = typeof ZenlessZoneZero
export const KeyofZenlessZoneZero = 'ZenlessZoneZero' as const

export type KeyofAccountBusiness = keyof typeof AccountBusiness

export const AccountBusinessKeys = Object
  .keys(AccountBusiness)
  .filter((key) => isNaN(Number(key))) as KeyofAccountBusiness[]

export function isValidAccountBusiness (t: AccountBusiness | null | undefined): t is AccountBusiness {
  // You can't use `!t` because 0 is also a valid value.
  return t !== null
    && typeof t !== 'undefined'
    && AccountBusiness[t] !== undefined
}

export interface KnownAccountProperties extends JsonProperties {
  displayName?: string | null
  gachaUrl?: string | null
  gachaUrlCreationTime?: string | null
  lastGachaRecordsUpdated?: string | null
  avatarId?: string | null
}

export interface Account {
  business: AccountBusiness
  uid: number
  dataFolder: string
  properties?: KnownAccountProperties | null
}

export type FindAccountsArgs
  = Pick<Account, 'business'>

export type FindAccounts
  = Command<FindAccountsArgs, Account[]>

export type FindAccountArgs
  = Pick<Account, 'business' | 'uid'>

export type FindAccount
  = Command<FindAccountArgs, Account | null>

export type CreateAccountArgs
  = Pick<Account, 'business' | 'uid' | 'dataFolder' | 'properties'>

export type CreateAccount
  = Command<CreateAccountArgs, Account>

export type UpdateAccountDataFolderArgs
  = Pick<Account, 'business' | 'uid' | 'dataFolder'>

export type UpdateAccountDataFolder
  = Command<UpdateAccountDataFolderArgs, Account | null>

export type UpdateAccountPropertiesArgs
  = Pick<Account, 'business' | 'uid' | 'properties'>

export type UpdateAccountProperties
  = Command<UpdateAccountPropertiesArgs, Account | null>

export type UpdateAccountDataFolderAndPropertiesArgs
  = Pick<Account, 'business' | 'uid' | 'dataFolder' | 'properties'>

export type UpdateAccountDataFolderAndProperties
  = Command<UpdateAccountDataFolderAndPropertiesArgs, Account | null>

export type DeleteAccountArgs
  = Pick<Account, 'business' | 'uid'>

export type DeleteAccount
  = Command<DeleteAccountArgs, Account | null>

// commands
export const AccountCommands = {
  /** @throws `DatabaseError` */
  findAll:
    declareCommand('database_find_accounts') as FindAccounts,

  /** @throws `DatabaseError` */
  find:
    declareCommand('database_find_account') as FindAccount,

  /** @throws `DatabaseError` */
  create:
    declareCommand('database_create_account') as CreateAccount,

  /** @throws `DatabaseError` */
  updateDataFolder:
    declareCommand('database_update_account_data_folder') as UpdateAccountDataFolder,

  /** @throws `DatabaseError` */
  updateProperties:
    declareCommand('database_update_account_properties') as UpdateAccountProperties,

  /** @throws `DatabaseError` */
  updateDataFolderAndProperties:
    declareCommand('database_update_account_data_folder_and_properties') as UpdateAccountDataFolderAndProperties,

  /** @throws `DatabaseError` */
  delete:
    declareCommand('database_delete_account') as DeleteAccount,
} as const

Object.freeze(AccountCommands)
