/* eslint-disable camelcase */

import React, { PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Account, Accounts, Settings, SettingsFn } from '@/interfaces/settings'
import { SettingsStore } from '@/stories/settings'

interface StatefulSettings extends Settings, SettingsFn {
  __debug__clear_accounts?: () => void
  __debug__reload_accounts?: () => void
}

const UninitializedFn = async () => { throw new Error('Uninitialized') }
const Default: StatefulSettings = {
  accounts: {},
  selectedAccount: null,
  showNameCard: null,
  addAccount: UninitializedFn,
  removeAccount: UninitializedFn,
  updateAccount: UninitializedFn,
  selectAccount: UninitializedFn,
  toggleShowNameCard: UninitializedFn
}

const StatefulSettingsContext =
  React.createContext<StatefulSettings>(Default)

export const StatefulSettingsProvider = (props: PropsWithChildren) => {
  const store = useMemo(() => new SettingsStore(), [])
  const [accounts, setAccounts] = useState<Accounts>({})
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [showNameCard, setShowNameCard] = useState<boolean | null>(null)

  const addAccount = useCallback<StatefulSettings['addAccount']>(async (account) => {
    const newAccounts = await store.addAccount(account)
    console.debug('New account added:', account)
    setAccounts(newAccounts)
    setSelectedAccount(account)
    return newAccounts
  }, [store, setAccounts, setSelectedAccount])

  const removeAccount = useCallback<StatefulSettings['removeAccount']>(async (uid) => {
    const [newAccounts, removed] = await store.removeAccount(uid)
    console.debug('Account has been removed:', removed)
    setAccounts(newAccounts)
    setSelectedAccount((prev) => (
      prev && prev.uid === removed.uid
        ? null
        : prev
    ))
    return [newAccounts, removed]
  }, [store, setAccounts, setSelectedAccount])

  const updateAccount = useCallback<StatefulSettings['updateAccount']>(async (uid, updated) => {
    const [newAccounts, updatedAccount] = await store.updateAccount(uid, updated)
    console.debug('Account has been updated:', updatedAccount)
    setAccounts(newAccounts)
    setSelectedAccount(updatedAccount)
    return [newAccounts, updatedAccount]
  }, [store, setAccounts, setSelectedAccount])

  const selectAccount = useCallback<StatefulSettings['selectAccount']>(async (uid) => {
    const selected = await store.selectAccount(uid)
    if (selected) {
      console.debug('Selected account:', selected)
      setSelectedAccount(selected)
    } return selected
  }, [store, setSelectedAccount])

  const toggleShowNameCard = useCallback<StatefulSettings['toggleShowNameCard']>(async () => {
    const newShowNameCard = await store.toggleShowNameCard()
    console.debug('Show name card:', newShowNameCard)
    setShowNameCard(newShowNameCard)
    return newShowNameCard
  }, [store, setShowNameCard])

  const reload = useCallback(() => {
    console.debug('Loading settings...')
    store
      .loadSettings()
      .then((settings) => {
        console.debug('Settings:', settings)
        setAccounts(settings.accounts)
        setSelectedAccount(settings.selectedAccount)
        setShowNameCard(!!settings.showNameCard)
      })
      .catch((error) => {
        console.error('Failed to load settings:', error)
      })
  }, [store, setAccounts, setSelectedAccount, setShowNameCard])

  useEffect(() => { reload() }, [])

  // HACK: Development only
  let __debug__clear_accounts: StatefulSettings['__debug__clear_accounts']
  let __debug__reload_accounts: StatefulSettings['__debug__reload_accounts']
  if (import.meta.env.DEV) {
    __debug__reload_accounts = reload
    __debug__clear_accounts = useCallback(() => {
      console.debug('Clear accounts...')
      setAccounts({})
      setSelectedAccount(null)
    }, [setAccounts, setSelectedAccount])
  }

  const value = {
    accounts,
    selectedAccount,
    showNameCard,
    addAccount,
    removeAccount,
    updateAccount,
    selectAccount,
    toggleShowNameCard,
    __debug__clear_accounts,
    __debug__reload_accounts
  }

  return (
    <StatefulSettingsContext.Provider value={value}>
      {props.children}
    </StatefulSettingsContext.Provider>
  )
}

export default function useStatefulSettings () {
  const data = useContext(StatefulSettingsContext)
  if (!data) {
    throw new Error('Invalid stateful settings context')
  } else {
    return data
  }
}
