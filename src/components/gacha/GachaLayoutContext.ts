import React from 'react'
import { AccountFacet, Account } from '@/interfaces/account'
import { GachaRecords } from '@/hooks/useGachaRecordsQuery'

export interface GachaLayoutContextValue {
  facet: AccountFacet
  selectedAccount: Account
  gachaRecords: GachaRecords
  alert (error: Error | string | undefined | null | unknown, message?: string): void
}

export const GachaLayoutContext =
  React.createContext<GachaLayoutContextValue | undefined>(undefined)

export function useGachaLayoutContext () {
  const context = React.useContext(GachaLayoutContext)
  if (!context) {
    throw new Error('useGachaLayoutContext must be used within a GachaLayoutContext.Provider')
  } else {
    return context
  }
}
