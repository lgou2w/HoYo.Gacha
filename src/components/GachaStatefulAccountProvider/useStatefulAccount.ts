import { useContext } from 'react'
import { GachaStatefulAccountContext } from './Context'

export default function useGachaStatefulAccount () {
  const value = useContext(GachaStatefulAccountContext)
  if (!value) {
    throw new Error('useGachaStatefulAccount must be used within a GachaStatefulAccountContext.Provider')
  } else {
    return value
  }
}
