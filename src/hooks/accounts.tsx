import React, { PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react'
import { Account, Accounts } from '../interfaces/models'
import Commands from '../utilities/commands'

interface StatefulAccounts {
  readonly accounts: Readonly<Accounts>
  readonly selected: Account | null
  addAccount (account: Account): Promise<void>
  removeAccount (uid: Account['uid']): Promise<void>
  selectAccount (uid: Account['uid']): Promise<void>
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
  }, [setAccounts])

  const removeAccount = useCallback<StatefulAccounts['removeAccount']>(async (uid) => {
    const result = await Commands.removeAccount({ uid })
    if (result) {
      setAccounts((prev) => {
        const { [result.uid]: removed, ...rest } = prev
        console.debug('Account has been removed:', removed)
        return rest
      })
    } else {
      console.debug('There is no account with uid:', uid)
    }
  }, [setAccounts])

  const selectAccount = useCallback<StatefulAccounts['selectAccount']>(async (uid) => {
    if (uid !== selected?.uid) {
      const result = await Commands.selectAccount({ uid })
      console.log('Selected account:', result)
      setSelected(result)
    }
  }, [selected, setSelected])

  useEffect(() => {
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
  }, [setAccounts])

  const value = {
    accounts,
    selected,
    addAccount,
    removeAccount,
    selectAccount
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
