import React, { PropsWithChildren, useCallback, useMemo } from 'react'
import { Account } from '@/api/interfaces/account'
import { useAccountsQuery } from '@/api/queries/account'
import { useGachaSelectedAccountQuery, setGachaSelectedAccount } from '@/api/queries/gacha'
import { BusinessContextState } from '@/components/BusinessProvider'
import { GachaAccountContext, GachaAccountContextState } from './Context'

export type { GachaAccountContextState }

export default function GachaAccountProvider (
  props: PropsWithChildren<BusinessContextState>
) {
  const { keyofBusinesses, business, children } = props
  const { data: accounts = [] } = useAccountsQuery()
  const {
    data: gachaAccountSelectedId,
    isLoading: gachaAccountSelectedIdIsLoading
  } = useGachaSelectedAccountQuery(keyofBusinesses)

  const accountsOfBusiness = useMemo(
    () => accounts.filter((account) => account.business === business),
    [accounts, business]
  )

  const selectedAccount = useMemo(() => {
    if (gachaAccountSelectedIdIsLoading) return null

    const gachaAccountSelected = accountsOfBusiness.find((account) => account.id === gachaAccountSelectedId) || null
    if (!gachaAccountSelected && accountsOfBusiness.length > 0) {
      const first = accountsOfBusiness[0]
      console.warn('No account selected. Use first valid value: [%s]', keyofBusinesses, first)
      setGachaSelectedAccount(keyofBusinesses, first)
      return first
    } else {
      return gachaAccountSelected
    }
  }, [accountsOfBusiness, gachaAccountSelectedId, keyofBusinesses, gachaAccountSelectedIdIsLoading])

  const setSelectedAccount = useCallback((id: Account['id']) => {
    const account = accounts.find((account) => account.id === id)
    if (account && account.id !== gachaAccountSelectedId) {
      console.debug('Update selected account: [%s]', keyofBusinesses, account)
      setGachaSelectedAccount(keyofBusinesses, account)
    }
  }, [accounts, keyofBusinesses, gachaAccountSelectedId])

  const state = {
    keyofBusinesses,
    business,
    accounts,
    accountsOfBusiness,
    selectedAccount,
    setSelectedAccount
  }

  return (
    <GachaAccountContext.Provider value={state}>
      {children}
    </GachaAccountContext.Provider>
  )
}
