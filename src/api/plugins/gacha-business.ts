import { Account } from '@/api/interfaces/account'
import { DataDirectory, GachaUrl, GachaUrlMetadata } from '@/api/interfaces/gacha-business'
import { defineCommand, IdentifierError, isIdentifierError } from './declares'

// See: src-tauri/src/gacha/business/plugin.rs

const PluginName = 'hg_gacha_business'

type Command =
  | 'find_data_dir'
  | 'find_data_dirs'
  | 'find_gacha_urls'
  | 'fetch_gacha_url_metadata'
  | 'create_account_gacha_records_fetcher_channel'

function bind<Payload = void, Result = void> (command: Command) {
  return defineCommand<Payload, Result>(PluginName, command)
}

// Error

const Identifier = 'GachaBusinessError' as const

export interface GachaBusinessError extends IdentifierError<typeof Identifier> {
  kind:
    | 'IO'
    | 'Reqwest'
    | { name: 'IllegalGachaUrl', inner: string }
    | {
        name: 'GachaRecordsResponse',
        inner:
          | 'AuthkeyTimeout'
          | 'VisitTooFrequently'
          | { retcode: number, message: string }
      }
    | 'FetcherChannelJoin'
    | 'FetcherChannelInterrupt'
}

export function isGachaBusinessError (
  error: Error | object | unknown
): error is GachaBusinessError {
  return isIdentifierError(error) &&
    error.identifier === Identifier
}

export function stringifyGachaBusinessErrorKind (kind: GachaBusinessError['kind']): string {
  if (typeof kind === 'string') {
    return kind
  } else {
    switch (kind.name) {
      case 'IllegalGachaUrl': return `IllegalGachaUrl(${kind.inner})`
      case 'GachaRecordsResponse':
        if (typeof kind.inner === 'string') {
          return `GachaRecordsResponse(${kind.inner})`
        } else {
          const { retcode, message } = kind.inner
          return `GachaRecordsResponse(retcode=${retcode}, message=${message})`
        }
    }
  }
}

// Plugin

export const GachaBusinessPlugin = {
  name: PluginName,
  // Declared commands
  findDataDir: bind<Pick<Account, 'business'> & Pick<DataDirectory, 'region'>, DataDirectory | null>('find_data_dir'),
  findDataDirs: bind<Pick<Account, 'business'>, DataDirectory[]>('find_data_dirs'),
  findGachaUrls: bind<Pick<Account, 'business'> & { dataDirectory: DataDirectory, skipExpired: boolean }, GachaUrl[] | null>('find_gacha_urls'),
  fetchGachaUrlMetadata: bind<Pick<Account, 'business'> & { gachaUrl: string }, GachaUrlMetadata | null>('fetch_gacha_url_metadata'),
  createAccountGachaRecordsFetcherChannel: bind<Pick<Account, 'business' | 'uid' | 'gachaUrl'> & {
    gachaTypeAndLastEndIdMappings: Array<[string, string | null]>
    eventChannel: string | null
    saveToDatabase: boolean | null
    syncTaskbarProgress: boolean | null
  }, void>('create_account_gacha_records_fetcher_channel')
} as const
