import React from 'react'
import BusinessProvider, { BusinessContextState } from '@/components/BusinessProvider'
import GachaAccountProvider from '@/components/GachaAccountProvider'
import GachaRecordsProvider from '@/components/GachaRecordsProvider'
import GachaBusinessViewAccountSelect from './AccountSelect'

export default function GachaBusinessView (props: BusinessContextState) {
  const { keyofBusinesses, business } = props
  return (
    <BusinessProvider keyofBusinesses={keyofBusinesses} business={business}>
      <GachaAccountProvider>
        <div>
          <GachaBusinessViewAccountSelect />
          <GachaRecordsProvider></GachaRecordsProvider>
        </div>
      </GachaAccountProvider>
    </BusinessProvider>
  )
}
