import { DataRegion } from './account'

export interface DataDirectory {
  path: string
  region: DataRegion
}

export interface GachaUrl {
  addr: number
  longKey: number
  creationTime: string
  value: string
}

export interface GachaUrlMetadata {
  region: string
  regionTimeZone: number | null // 'Honkai: Star Rail' only
  lang: string | null
  uid: string | null
}
