import React from 'react'
import { Account, Business, KeyofBusinesses } from '@/api/interfaces/account'
import { PrettiedGachaRecords } from '@/api/interfaces/gacha-prettied'

export interface GachaRecordsContextState {
  keyofBusinesses: KeyofBusinesses
  business: Business
  activeAccount: Account | null
  records: PrettiedGachaRecords | null
}

export const GachaRecordsContext =
  React.createContext<GachaRecordsContextState | null>(null)

GachaRecordsContext.displayName = 'GachaRecordsContext'
