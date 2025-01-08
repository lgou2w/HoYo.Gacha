import { useContext } from 'react'
import BusinessContext from '@/contexts/BusinessContext'

export default function useBusiness () {
  const state = useContext(BusinessContext)
  if (!state) {
    throw new Error('useBusiness must be used within a BusinessContext.Provider')
  } else {
    return state
  }
}
