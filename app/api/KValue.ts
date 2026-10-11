import { isTauri } from '@tauri-apps/api/core'
import { Command, declareCommand } from './command'

// See: tauri/src/database/schemas/kvalue.rs

export interface KValue {
  key: string
  val: string
  updatedAt: string
}

export type FindKValueArgs
  = Pick<KValue, 'key'>

export type FindKValue
  = Command<FindKValueArgs, KValue | null>

export type CreateKValueArgs
  = Pick<KValue, 'key' | 'val'>

export type CreateKValue
  = Command<CreateKValueArgs, KValue>

export type UpdateKValueArgs
  = & Pick<KValue, 'key' | 'val'>
    & Partial<Pick<KValue, 'updatedAt'>>

export type UpdateKValue
  = Command<UpdateKValueArgs, KValue | null>

export type UpsertKValueArgs
  = & Pick<KValue, 'key' | 'val'>
    & Partial<Pick<KValue, 'updatedAt'>>

export type UpsertKValue
  = Command<UpsertKValueArgs, KValue>

export type DeleteKValueArgs
  = Pick<KValue, 'key'>

export type DeleteKValue
  = Command<DeleteKValueArgs, KValue | null>

export const KValueCommands = {
  /** @throws `DatabaseError` */
  find:
    declareCommand('database_find_kvalue') as FindKValue,

  /** @throws `DatabaseError` */
  create:
    declareCommand('database_create_kvalue') as CreateKValue,

  /** @throws `DatabaseError` */
  update:
    declareCommand('database_update_kvalue') as UpdateKValue,

  /** @throws `DatabaseError` */
  upsert:
    declareCommand('database_upsert_kvalue') as UpsertKValue,

  /** @throws `DatabaseError` */
  delete:
    declareCommand('database_delete_kvalue') as DeleteKValue,
} as const

Object.freeze(KValueCommands)

// Store

/**
 * A simple key-value store bound to a single key.
 */
export interface KValueStore {
  /** The key currently used by this store. */
  readonly key: string
  /** Read the stored value, or `null` if absent. */
  read (): string | null | Promise<string | null>
  /** Write a value. */
  write (val: string): void | Promise<void>
  /** Remove the stored value. */
  clear (): void | Promise<void>
}

const DatabaseBackend = {
  name: 'DB',
  async read (key: string): Promise<string | null> {
    const kvalue = await KValueCommands.find({ key })
    return kvalue?.val ?? null
  },
  async write (key: string, val: string): Promise<void> {
    await KValueCommands.upsert({ key, val })
  },
  async clear (key: string): Promise<void> {
    await KValueCommands.delete({ key })
  },
}

const LocalStorageBackend = {
  name: 'LS',
  read (key: string): string | null {
    return localStorage.getItem(key)
  },
  write (key: string, val: string) {
    localStorage.setItem(key, val)
  },
  clear (key: string) {
    localStorage.removeItem(key)
  },
}

export interface KValueStoreOptions {
  /** Key used in the Tauri database. */
  database: string
  /** Key used in the browser localStorage. */
  localStorage: string
}

/**
 * Create a {@link KValueStore} for the given key.
 * Uses the database when running in Tauri, otherwise localStorage.
 */
export function createKValueStore (options: KValueStoreOptions): KValueStore {
  const { database, localStorage } = options
  const tauri = isTauri()

  const key = tauri ? database : localStorage
  const backend = tauri ? DatabaseBackend : LocalStorageBackend
  const tag = `[KValueStore:${backend.name}:${key}]`
  debug(`${tag} created`)

  return {
    key,
    read: () => {
      debug(`${tag} read...`)
      return backend.read(key)
    },
    write: (val) => {
      debug(`${tag} write ->`, val)
      return backend.write(key, val)
    },
    clear: () => {
      debug(`${tag} clear...`)
      return backend.clear(key)
    },
  }
}

/** Debug logger that is stripped out in production builds. */
const debug: (...args: unknown[]) => void = import.meta.env.PROD
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  ? () => {}
  : (...args) => console.debug(...args)
