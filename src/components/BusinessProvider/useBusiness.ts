import { useContext } from 'react'
import { BusinessContext } from './Context'

export default function useBusiness () {
  const value = useContext(BusinessContext)
  if (!value) {
    throw new Error('useAccount must be used within a BusinessContext.Provider')
  } else {
    return value
  }
}
