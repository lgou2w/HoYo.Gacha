import { PropsWithChildren, useCallback, useMemo } from 'react'
import { useClientareaInitialMutation, useClientareaInitialSuspenseQuery } from './hooks'
import { ClientareaContext, ClientareaContextValue } from './types'

export default function ClientareaProvider (props: PropsWithChildren) {
  const { data: active } = useClientareaInitialSuspenseQuery()
  const { mutateAsync } = useClientareaInitialMutation()

  const change = useCallback<ClientareaContextValue['change']>(async (newVal) => {
    return mutateAsync(newVal)
  }, [mutateAsync])

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
