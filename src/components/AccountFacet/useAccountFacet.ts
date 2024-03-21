import { useContext } from 'react'
import { AccountFacetContext } from './Context'

export default function useAccountFacet () {
  const value = useContext(AccountFacetContext)
  if (!value) {
    throw new Error('useAccountFacet must be used within a AccountFacetContext.Provider')
  } else {
    return value
  }
}
