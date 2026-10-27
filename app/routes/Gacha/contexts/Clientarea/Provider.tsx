import { PropsWithChildren, useCallback, useMemo, useState } from 'react'
import { useClientareaPreferenceSuspenseQuery } from './hooks'
import { ClientareaContext, ClientareaContextValue } from './types'

export default function ClientareaProvider (props: PropsWithChildren) {
  const { data: initial } = useClientareaPreferenceSuspenseQuery()

  // Session-scoped: seeded from the persisted default, reset when the provider
  // remounts (e.g. switching business) — matches v1.2 behavior.
  const [active, setActive] = useState(initial)
  const change = useCallback<ClientareaContextValue['change']>((newVal) => {
    setActive(newVal)
  }, [])

  const state = useMemo<ClientareaContextValue>(
    () => ({ active, change }),
    [active, change],
  )

  return (
    <ClientareaContext value={state}>
      {props.children}
    </ClientareaContext>
  )
}
