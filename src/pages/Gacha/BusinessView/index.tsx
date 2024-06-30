import React from 'react'
import BusinessProvider, { BusinessContextState } from '@/components/BusinessProvider'
import GachaStatefulAccountProvider from '@/components/GachaStatefulAccountProvider'
import GachaBusinessViewAccountSelect from './AccountSelect'

export default function GachaBusinessView (props: BusinessContextState) {
  const { keyofBusinesses, business } = props
  return (
    <BusinessProvider keyofBusinesses={keyofBusinesses} business={business}>
      <GachaStatefulAccountProvider keyofBusinesses={keyofBusinesses} business={business}>
        <div>
          <GachaBusinessViewAccountSelect />
        </div>
      </GachaStatefulAccountProvider>
    </BusinessProvider>
  )
}
