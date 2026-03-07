import { use } from 'react'
import { ClientareaContext } from './context'

export function useClientarea () {
  const state = use(ClientareaContext)
  if (!state) {
    throw new Error('useClientarea must be used within a ClientareaProvider')
  } else {
    return state
  }
}
