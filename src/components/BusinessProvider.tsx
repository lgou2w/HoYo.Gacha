import React, { PropsWithChildren, useMemo } from 'react'
import BusinessContext, { BusinessState } from '@/contexts/BusinessContext'
import { Business, KeyofBusinesses } from '@/interfaces/Business'

interface Props {
  business: Business
  keyofBusinesses: KeyofBusinesses
}

export default function BusinessProvider (props: PropsWithChildren<Props>) {
  const { business, keyofBusinesses, children } = props
  const state = useMemo<BusinessState>(() => ({
    business,
    keyofBusinesses,
  }), [business, keyofBusinesses])

  return (
    <BusinessContext.Provider value={state}>
      {children}
    </BusinessContext.Provider>
  )
}
