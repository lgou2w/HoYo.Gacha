import React from 'react'
import BusinessProvider from '@/components/BusinessProvider'
import GachaPageView from './PageView'
import gachaRoute from './route'

export default function Gacha () {
  const { business, keyofBusinesses } = gachaRoute.useLoaderData()
  return (
    <BusinessProvider business={business} keyofBusinesses={keyofBusinesses}>
      <GachaPageView key={business} />
    </BusinessProvider>
  )
}
