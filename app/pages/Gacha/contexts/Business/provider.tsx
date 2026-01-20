import { PropsWithChildren, useMemo } from 'react'
import { AccountBusiness } from '@/api/schemas/Account'
import { BusinessContext, BusinessState } from './context'

interface Props {
  value: AccountBusiness
}

export default function BusinessProvider (props: PropsWithChildren<Props>) {
  const { value, children } = props
  const state = useMemo(
    () => new BusinessState(value),
    [value],
  )

  return (
    <BusinessContext value={state}>
      {children}
    </BusinessContext>
  )
}
