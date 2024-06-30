import React, { PropsWithChildren } from 'react'
import { BusinessContext, BusinessContextState } from './Context'

export type { BusinessContextState }

export default function BusinessProvider (
  props: PropsWithChildren<BusinessContextState>
) {
  const { keyofBusinesses, business, children } = props
  return (
    <BusinessContext.Provider value={{ keyofBusinesses, business }}>
      {children}
    </BusinessContext.Provider>
  )
}
