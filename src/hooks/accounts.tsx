/* eslint-disable camelcase */

import React, { PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react'
import { Account, Accounts } from '@/interfaces/models'
import Commands from '@/utilities/commands'

interface StatefulAccounts {
  readonly accounts: Readonly<Accounts>
  readonly selected: Account | null
  addAccount (account: Account): Promise<void>
  removeAccount (uid: Account['uid']): Promise<void>
  selectAccount (uid: Account['uid']): Promise<void>
  __debug__clear_accounts?: () => void
  __debug__reload_accounts?: () => void
}

const StatefulAccountsContext =
  React.createContext<StatefulAccounts | undefined>(undefined)

export const StatefulAccountsProvider = (props: PropsWithChildren) => {
  const [accounts, setAccounts] = useState<Accounts>({})
  const [selected, setSelected] = useState<Account | null>(null)

  const addAccount = useCallback<StatefulAccounts['addAccount']>(async (account) => {
    const result = await Commands.addAccount({ ...account })
    setAccounts((prev) => {
      console.debug('New account added:', result)
      return Object.assign({ [result.uid]: result }, prev)
    })
    setSelected(result)
  }, [setAccounts, setSelected])

  const removeAccount = useCallback<StatefulAccounts['removeAccount']>(async (uid) => {
    const result = await Commands.removeAccount({ uid })
    if (result) {
      setAccounts((prev) => {
        const { [result.uid]: removed, ...rest } = prev
        console.debug('Account has been removed:', removed)
        return rest
      })
      setSelected((prev) => {
        return prev && prev.uid === result.uid
          ? null // Empty selected
          : prev
      })
    } else {
      console.debug('There is no account with uid:', uid)
    }
  }, [setAccounts, setSelected])

  const selectAccount = useCallback<StatefulAccounts['selectAccount']>(async (uid) => {
    if (uid !== selected?.uid) {
      const result = await Commands.selectAccount({ uid })
      console.log('Selected account:', result)
      setSelected(result)
    }
  }, [selected, setSelected])

  const reload = useCallback(() => {
    console.debug('Loading account manage...')
    Commands
      .getAccountMange()
      .then((result) => {
        console.debug('Account manage:', result)
        setAccounts(result.accounts)
        setSelected(result.selected ? result.accounts[result.selected] : null)
      })
      .catch((error) => {
        console.error('Failed to load account manage:', error)
      })
  }, [setAccounts, setSelected])

  useEffect(() => { reload() }, [])

  // HACK: Development only
  let __debug__clear_accounts: StatefulAccounts['__debug__clear_accounts']
  let __debug__reload_accounts: StatefulAccounts['__debug__reload_accounts']
  if (import.meta.env.DEV) {
    __debug__reload_accounts = reload
    __debug__clear_accounts = useCallback(() => {
      setAccounts({})
      setSelected(null)
    }, [setAccounts, setSelected])
  }

  const value = {
    accounts,
    selected,
    addAccount,
    removeAccount,
    selectAccount,
    __debug__clear_accounts,
    __debug__reload_accounts
  }

  return (
    <StatefulAccountsContext.Provider value={value}>
      {props.children}
    </StatefulAccountsContext.Provider>
  )
}

export function useStatefulAccounts () {
  const data = useContext(StatefulAccountsContext)
  if (!data) {
    throw new Error('Invalid stateful accounts context')
  } else {
    return data
  }
}
