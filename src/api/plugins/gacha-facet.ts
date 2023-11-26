import { Account } from '@/api/interfaces/account'
import { DataDirectory, GachaUrl, GachaUrlMetadata } from '@/api/interfaces/gacha-facet'
import { defineCommand } from './declares'

// See: src-tauri/src/gacha/facet/plugin.rs

export const PluginName = 'hg_gacha_facet'

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

const Identifier = 'GachaFacetError' as const

export interface GachaFacetError {
  identifier: typeof Identifier
  message: string
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

export function isGachaFacetError (error: Error | object | unknown): error is GachaFacetError {
  return (error instanceof Error || typeof error === 'object') && error !== null &&
    'identifier' in error && error.identifier === Identifier
}

// Plugin

const Plugin = {
  name: PluginName,
  // Declared commands
  findDataDir: bind<Pick<Account, 'facet'> & Pick<DataDirectory, 'isOversea'>, DataDirectory | null>('find_data_dir'),
  findDataDirs: bind<Pick<Account, 'facet'>, DataDirectory[]>('find_data_dirs'),
  findGachaUrls: bind<Pick<Account, 'facet'> & { dataDirectory: DataDirectory, skipExpired: boolean }, GachaUrl[] | null>('find_gacha_urls'),
  fetchGachaUrlMetadata: bind<Pick<Account, 'facet'> & { gachaUrl: string }, GachaUrlMetadata | null>('fetch_gacha_url_metadata'),
  createAccountGachaRecordsFetcherChannel: bind<Pick<Account, 'facet' | 'uid' | 'gachaUrl'> & {
    gachaTypeAndLastEndIdMappings: Array<[string, string | null]>
    eventChannel: string | null
    saveToDatabase: boolean | null
    syncTaskbarProgress: boolean | null
  }, void>('create_account_gacha_records_fetcher_channel')
} as const

export default Plugin
