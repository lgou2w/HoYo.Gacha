import { createContext } from 'react'
import { Account } from '@/api/Account'

export interface AccountContextValue {
  readonly accounts: Account[]
  readonly selectedUid: Account['uid'] | null
  readonly selected: Account | null
}

export const AccountContext = createContext<AccountContextValue | null>(null)
AccountContext.displayName = 'AccountContext'
