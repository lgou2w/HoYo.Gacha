import { use } from 'react'
import { EnvironmentContext } from './context'

export function useEnvironment () {
  const state = use(EnvironmentContext)
  if (!state) {
    throw new Error('useEnvironment must be used within a EnvironmentProvider')
  } else {
    return state
  }
}
