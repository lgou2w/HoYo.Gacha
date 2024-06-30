import { useContext } from 'react'
import { GachaAccountContext } from './Context'

export default function useGachaAccount () {
  const value = useContext(GachaAccountContext)
  if (!value) {
    throw new Error('useGachaAccount must be used within a GachaAccountContext.Provider')
  } else {
    return value
  }
}
