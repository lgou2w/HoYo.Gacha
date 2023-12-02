import { useContext } from 'react'
import { AccountsFacetViewContext } from './Context'

export default function useAccountsFacetView () {
  const value = useContext(AccountsFacetViewContext)
  if (!value) {
    throw new Error('useAccountsFacetView must be used within a AccountsFacetViewContext.Provider')
  } else {
    return value
  }
}
