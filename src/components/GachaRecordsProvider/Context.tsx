import React from 'react'
import { Account, Business, KeyofBusinesses } from '@/api/interfaces/account'
import { GachaRecord } from '@/api/interfaces/gacha'
import { PrettiedGachaRecords } from './prettied'

export interface GachaRecordsContextState {
  keyofBusinesses: KeyofBusinesses
  business: Business
  activeAccount: Account | null
  records: GachaRecord[] | null
  prettiedRecords: PrettiedGachaRecords | null
}

export const GachaRecordsContext =
  React.createContext<GachaRecordsContextState | null>(null)

GachaRecordsContext.displayName = 'GachaRecordsContext'
