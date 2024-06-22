import { useContext } from 'react'
import { AccountBusinessContext } from './Context'

export default function useAccountBusiness () {
  const value = useContext(AccountBusinessContext)
  if (!value) {
    throw new Error('useAccountBusiness must be used within a AccountBusinessContext.Provider')
  } else {
    return value
  }
}
