import React from 'react'
import AccountFacet, { AccountFacetContextState } from '@/components/AccountFacet'
import GachaFacetViewAccountSelect from './AccountSelect'

export default function GachaFacetView (props: AccountFacetContextState) {
  const { keyOfFacets, facet } = props
  return (
    <AccountFacet keyOfFacets={keyOfFacets} facet={facet}>
      <div>
        <GachaFacetViewAccountSelect />
      </div>
    </AccountFacet>
  )
}
