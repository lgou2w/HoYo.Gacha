import { use } from 'react'
import { BusinessContext } from './types'

export function useBusiness () {
  const state = use(BusinessContext)
  if (!state) {
    throw new Error('useBusiness must be used within an BusinessProvider')
  } else {
    return state
  }
}
