import React from 'react'
import { useQueryLoaderFunctionData } from '@/api/store'
import GachaFacetView from '@/components/Gacha/FacetView'
import loader from './loader'

export default function GachaFacet () {
  const { keyOfFacets, facet } = useQueryLoaderFunctionData<typeof loader>()
  return (
    <GachaFacetView keyOfFacets={keyOfFacets} facet={facet} />
  )
}
