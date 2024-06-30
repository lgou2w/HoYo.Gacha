import React from 'react'
import BusinessProvider, { BusinessContextState } from '@/components/BusinessProvider'
import GachaAccountProvider from '@/components/GachaAccountProvider'
import GachaBusinessViewAccountSelect from './AccountSelect'

export default function GachaBusinessView (props: BusinessContextState) {
  const { keyofBusinesses, business } = props
  return (
    <BusinessProvider keyofBusinesses={keyofBusinesses} business={business}>
      <GachaAccountProvider keyofBusinesses={keyofBusinesses} business={business}>
        <div>
          <GachaBusinessViewAccountSelect />
        </div>
      </GachaAccountProvider>
    </BusinessProvider>
  )
}
