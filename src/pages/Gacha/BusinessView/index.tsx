import React from 'react'
import BusinessProvider, { BusinessContextState } from '@/components/BusinessProvider'
import GachaBusinessViewAccountSelect from './AccountSelect'

export default function GachaBusinessView (props: BusinessContextState) {
  const { keyOfBusinesses, business } = props
  return (
    <BusinessProvider keyOfBusinesses={keyOfBusinesses} business={business}>
      <div>
        <GachaBusinessViewAccountSelect />
      </div>
    </BusinessProvider>
  )
}
