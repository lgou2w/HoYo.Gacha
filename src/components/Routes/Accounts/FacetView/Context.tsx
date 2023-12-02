import React from 'react'
import { AccountFacet, AccountFacets } from '@/api/interfaces/account'

export interface AccountsFacetViewContextState {
  keyOfFacets: keyof typeof AccountFacets
  facet: AccountFacet
}

export const AccountsFacetViewContext =
  React.createContext<AccountsFacetViewContextState | null>(null)

AccountsFacetViewContext.displayName = 'AccountsFacetViewContext'
