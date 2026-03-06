import { Command, declareCommand } from '@/api/command'

// See: tauri/src/database/schemas/key_value_pair.rs

export interface KeyValuePair {
  key: string
  val: string
  updatedAt: string
}

export type FindKvPairArgs
  = Pick<KeyValuePair, 'key'>

export type FindKvPair
  = Command<FindKvPairArgs, KeyValuePair | null>

export type CreateKvPairArgs
  = Pick<KeyValuePair, 'key' | 'val'>

export type CreateKvPair
  = Command<CreateKvPairArgs, KeyValuePair>

export type UpdateKvPairArgs
  = & Pick<KeyValuePair, 'key' | 'val'>
    & Partial<Pick<KeyValuePair, 'updatedAt'>>

export type UpdateKvPair
  = Command<UpdateKvPairArgs, KeyValuePair | null>

export type UpsertKvPairArgs
  = & Pick<KeyValuePair, 'key' | 'val'>
    & Partial<Pick<KeyValuePair, 'updatedAt'>>

export type UpsertKvPair
  = Command<UpsertKvPairArgs, KeyValuePair>

export type DeleteKvPairArgs
  = Pick<KeyValuePair, 'key'>

export type DeleteKvPair
  = Command<DeleteKvPairArgs, KeyValuePair | null>

// commands
export const KeyValuePairCommands = {
  /** @throws `DatabaseError` */
  find:
    declareCommand('database_find_kv_pair') as FindKvPair,

  /** @throws `DatabaseError` */
  create:
    declareCommand('database_create_kv_pair') as CreateKvPair,

  /** @throws `DatabaseError` */
  update:
    declareCommand('database_update_kv_pair') as UpdateKvPair,

  /** @throws `DatabaseError` */
  upsert:
    declareCommand('database_upsert_kv_pair') as UpsertKvPair,

  /** @throws `DatabaseError` */
  delete:
    declareCommand('database_delete_kv_pair') as DeleteKvPair,
} as const

Object.freeze(KeyValuePairCommands)
