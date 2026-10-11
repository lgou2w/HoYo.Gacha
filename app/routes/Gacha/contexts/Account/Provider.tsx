import { PropsWithChildren, useMemo } from 'react'
import { AccountBusiness, KeyofAccountBusiness } from '@/api/Account'
import { useAccountSuspenseQueries } from './hooks'
import { AccountContext, AccountContextValue } from './types'

export interface AccountProviderProps {
  business: AccountBusiness
}

export default function AccountProvider (props: PropsWithChildren<AccountProviderProps>) {
  const { business, children } = props
  const keyof = AccountBusiness[business] as KeyofAccountBusiness
  const [{ data: accounts }, { data: selectedUid }] = useAccountSuspenseQueries(keyof)
  const state = useMemo<AccountContextValue>(() => ({
    accounts,
    selectedUid,
    selected: accounts.find((el) => el.uid === selectedUid) ?? null,
  }), [accounts, selectedUid])

  return (
    <AccountContext value={state}>
      {children}
    </AccountContext>
  )
}
