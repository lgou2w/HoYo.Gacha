import React from 'react'
import { AccountBusiness, AccountBusinesses } from '@/api/interfaces/account'

export interface AccountBusinessContextState {
  keyOfBusinesses: keyof typeof AccountBusinesses
  business: AccountBusiness
}

export const AccountBusinessContext =
  React.createContext<AccountBusinessContextState | null>(null)

AccountBusinessContext.displayName = 'AccountBusinessContext'
