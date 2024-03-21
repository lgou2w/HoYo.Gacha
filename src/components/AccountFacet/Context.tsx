import React from 'react'
import { AccountFacet, AccountFacets } from '@/api/interfaces/account'

export interface AccountFacetContextState {
  keyOfFacets: keyof typeof AccountFacets
  facet: AccountFacet
}

export const AccountFacetContext =
  React.createContext<AccountFacetContextState | null>(null)

AccountFacetContext.displayName = 'AccountFacetContext'
