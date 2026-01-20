import { use } from 'react'
import { BusinessContext } from './context'

export function useBusiness () {
  const state = use(BusinessContext)
  if (!state) {
    throw new Error('useBusiness must be used within a BusinessProvider')
  } else {
    return state
  }
}
