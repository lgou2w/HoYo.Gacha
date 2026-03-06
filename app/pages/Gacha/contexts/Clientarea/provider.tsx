import { PropsWithChildren } from 'react'
import { useImmer } from 'use-immer'
import { useClientareaInitialSuspenseQuery } from '@/pages/Gacha/queries/clientarea'
import { ClientareaContext, ClientareaState } from './context'

export default function ClientareaProvider (props: PropsWithChildren) {
  const { data: initial } = useClientareaInitialSuspenseQuery()
  const [state, setState] = useImmer<ClientareaState>({
    active: initial,
    change (newVal) {
      setState((draft) => {
        draft.active = newVal
      })
    },
  })

  return (
    <ClientareaContext value={state}>
      {props.children}
    </ClientareaContext>
  )
}
