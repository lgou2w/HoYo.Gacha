import React, { PropsWithChildren } from 'react'
import { BusinessContext, BusinessContextState } from './Context'

export type { BusinessContextState }

export default function BusinessProvider (
  props: PropsWithChildren<BusinessContextState>
) {
  const { keyOfBusinesses, business, children } = props
  return (
    <BusinessContext.Provider value={{ keyOfBusinesses, business }}>
      {children}
    </BusinessContext.Provider>
  )
}
