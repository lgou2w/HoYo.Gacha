import React, { PropsWithChildren } from 'react'
import { AccountFacetContext, AccountFacetContextState } from './Context'

export type { AccountFacetContextState }

export default function AccountFacet (
  props: PropsWithChildren<AccountFacetContextState>
) {
  const { keyOfFacets, facet, children } = props
  return (
    <AccountFacetContext.Provider value={{ keyOfFacets, facet }}>
      {children}
    </AccountFacetContext.Provider>
  )
}
