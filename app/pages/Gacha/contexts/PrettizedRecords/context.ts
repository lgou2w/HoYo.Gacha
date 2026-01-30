import { createContext } from 'react'
import { Account, AccountBusiness } from '@/api/schemas/Account'
import { BusinessState } from '@/pages/Gacha/contexts/Business'
import { PrettizedRecords } from './types'

export interface PrettiedRecordsState {
  readonly business: BusinessState
  readonly selected: Account | null
  readonly data: PrettizedRecords<AccountBusiness> | null
}

export const PrettizedRecordsContext = createContext<PrettiedRecordsState | null>(null)

PrettizedRecordsContext.displayName = 'PrettizedRecordsContext'
