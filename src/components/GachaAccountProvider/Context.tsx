import React from 'react'
import { Account, Business, KeyofBusinesses } from '@/api/interfaces/account'

export interface GachaAccountContextState {
  keyofBusinesses: KeyofBusinesses
  business: Business
  accounts: Account[]
  accountsOfBusiness: Account[]
  selectedAccount: Account | null
  setSelectedAccount (id: Account['id']): void
}

export const GachaAccountContext =
  React.createContext<GachaAccountContextState | null>(null)

GachaAccountContext.displayName = 'GachaAccountContext'
