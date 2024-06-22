import React, { PropsWithChildren } from 'react'
import { AccountBusinessContext, AccountBusinessContextState } from './Context'

export type { AccountBusinessContextState }

export default function AccountBusiness (
  props: PropsWithChildren<AccountBusinessContextState>
) {
  const { keyOfBusinesses, business, children } = props
  return (
    <AccountBusinessContext.Provider value={{ keyOfBusinesses, business }}>
      {children}
    </AccountBusinessContext.Provider>
  )
}
