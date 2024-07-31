import { DetailedError, isDetailedError } from '@/api/error'
import { InvokeOptions } from '@/api/invoke'
import { Account } from '@/interfaces/Account'
import { Business, BusinessRegion } from '@/interfaces/Business'
import { GachaRecord } from '@/interfaces/GachaRecord'
import { declareCommand } from '.'

// See:
//   src-tauri/src/business/mod.rs
//   src-tauri/src/business/data_folder_locator.rs
//   src-tauri/src/business/gacha_url.rs

// Data Folder

const NamedDataFolderError = 'DataFolderError' as const

export type DataFolderError = DetailedError<typeof NamedDataFolderError,
  | { kind: 'Invalid' }
  | { kind: 'UnityLogFileNotFound', path: string }
  | { kind: 'OpenUnityLogFile', path: string, cause: { kind: string, message: string } }
>

export function isDataFolderError (error: unknown): error is DataFolderError {
  return isDetailedError(error) &&
    error.name === NamedDataFolderError
}

export interface DataFolder {
  business: Business
  region: BusinessRegion
  value: string
}

export type LocateDataFolderArgs = NonNullable<{
  business: Business
  region: BusinessRegion
  factory: 'UnityLog' | 'Manual' | 'Registry'
}>

export const locateDataFolder = declareCommand<LocateDataFolderArgs, DataFolder | null>('business_locate_data_folder')

// Gacha Url

const NamedGachaUrlError = 'GachaUrlError' as const

export type GachaUrlError = DetailedError<typeof NamedGachaUrlError,
  | { kind: 'WebCachesNotFound', path: string }
  | { kind: 'OpenWebCaches', cause: { kind: string, message: string } }
  | { kind: 'ReadDiskCache', cause: { kind: string, message: string } }
  | { kind: 'NotFound' }
  | { kind: 'MissingParams' }
  | { kind: 'InvalidParams', params: string[] }
  | { kind: 'Parse', cause: string }
  | { kind: 'Reqwest', cause: string }
  | { kind: 'AuthkeyTimeout' }
  | { kind: 'VisitTooFrequently' }
  | { kind: 'UnexpectedResponse', retcode: number, message: string }
  | { kind: 'InconsistentUid', expected: Account['uid'], actual: Array<Account['uid']> }
>

export function isGachaUrlError (error: unknown): error is GachaUrlError {
  return isDetailedError(error) &&
    error.name === NamedGachaUrlError
}

export interface GachaUrl {
  value: string
  creationTime: string
  ownerUid: Account['uid']
}

export type ObtainGachaUrlArgs = NonNullable<{
  business: Business
  region: BusinessRegion
  dataFolder: string
  expectedUid: Account['uid']
}>

export const obtainGachaUrl = declareCommand<ObtainGachaUrlArgs, GachaUrl | null>('business_obtain_gacha_url')

// Business Advanced

export type CreateGachaRecordsFetcherChannelArgs<T extends Business> = NonNullable<{
  business: T
  region: BusinessRegion
  uid: Account['uid']
  gachaUrl: string
  gachaTypeAndLastEndIdMappings: Array<[GachaRecord<T>['gachaType'], GachaRecord<T>['id'] | null]>
  options?: {
    eventChannel?: string
    saveToDatabase?: boolean
    onConflict?: 'Nothing' | 'Update'
  }
}>

export type CreateGachaRecordsFetcherChannel = <T extends Business>(args: CreateGachaRecordsFetcherChannelArgs<T>, options?: InvokeOptions) => Promise<void>
export const createGachaRecordsFetcherChannel: CreateGachaRecordsFetcherChannel = declareCommand('business_create_gacha_records_fetcher_channel')
