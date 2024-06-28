import React from 'react'
import { useQueryLoaderFunctionData } from '@/api/store'
import GachaBusinessView from '@/pages/Gacha/BusinessView'
import loader from './loader'

export default function GachaBusiness () {
  const { keyOfBusinesses, business } = useQueryLoaderFunctionData<typeof loader>()
  return (
    <GachaBusinessView
      keyOfBusinesses={keyOfBusinesses}
      business={business}
    />
  )
}
