import React from 'react'
import { Account, Business, KeyofBusinesses } from '@/api/interfaces/account'

export interface GachaStatefulAccountContextState {
  keyofBusinesses: KeyofBusinesses
  business: Business
  accounts: Account[]
  accountsOfBusiness: Account[]
  selectedAccount: Account | null
  setSelectedAccount (id: Account['id']): void
}

export const GachaStatefulAccountContext =
  React.createContext<GachaStatefulAccountContextState | null>(null)

GachaStatefulAccountContext.displayName = 'GachaStatefulAccountContext'
