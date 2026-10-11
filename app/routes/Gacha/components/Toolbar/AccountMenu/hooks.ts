import { use } from 'react'
import { AccountMenuContext } from './types'

export function useAccountMenu () {
  const state = use(AccountMenuContext)
  if (!state) {
    throw new Error('useAccountMenu must be used within an AccountMenuProvider')
  } else {
    return state
  }
}
