import { useContext } from 'react'
import BusinessContext from '@/contexts/BusinessContext'

export default function useBusinessContext () {
  const state = useContext(BusinessContext)
  if (!state) {
    throw new Error('useBusinessContext must be used within a BusinessContext.Provider')
  } else {
    return state
  }
}
