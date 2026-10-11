import { PropsWithChildren, useMemo } from 'react'
import { AccountBusiness } from '@/api/Account'
import { BusinessContext, BusinessContextValue } from './types'

export interface BusinessProviderProps {
  value: AccountBusiness
}

export default function BusinessProvider (props: PropsWithChildren<BusinessProviderProps>) {
  const { value, children } = props
  const state = useMemo(
    () => new BusinessContextValue(value),
    [value],
  )

  return (
    <BusinessContext value={state}>
      {children}
    </BusinessContext>
  )
}
