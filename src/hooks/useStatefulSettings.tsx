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
  enkaNetwork: null,
  addAccount: UninitializedFn,
  removeAccount: UninitializedFn,
  updateAccount: UninitializedFn,
  selectAccount: UninitializedFn,
  toggleEnkaNetwork: UninitializedFn
}

const StatefulSettingsContext =
  React.createContext<StatefulSettings>(Default)

export const StatefulSettingsProvider = (props: PropsWithChildren) => {
  const store = useMemo(() => new SettingsStore(), [])
  const [accounts, setAccounts] = useState<Accounts>({})
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [enkaNetwork, setEnkaNetwork] = useState<boolean | null>(null)

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
    setSelectedAccount((prev) => (
      prev && prev.uid === updatedAccount.uid
        ? updatedAccount
        : prev
    ))
    return [newAccounts, updatedAccount]
  }, [store, setAccounts, setSelectedAccount])

  const selectAccount = useCallback<StatefulSettings['selectAccount']>(async (uid) => {
    const selected = await store.selectAccount(uid)
    if (selected) {
      console.debug('Selected account:', selected)
      setSelectedAccount(selected)
    } return selected
  }, [store, setSelectedAccount])

  const toggleEnkaNetwork = useCallback<StatefulSettings['toggleEnkaNetwork']>(async () => {
    const newEnkaNetwork = await store.toggleEnkaNetwork()
    console.debug('Enka.Network:', newEnkaNetwork)
    setEnkaNetwork(newEnkaNetwork)
    return newEnkaNetwork
  }, [store, setEnkaNetwork])

  const reload = useCallback(() => {
    console.debug('Loading settings...')
    store
      .loadSettings()
      .then((settings) => {
        console.debug('Settings:', settings)
        setAccounts(settings.accounts)
        setSelectedAccount(settings.selectedAccount)
        setEnkaNetwork(!!settings.enkaNetwork)
      })
      .catch((error) => {
        console.error('Failed to load settings:', error)
      })
  }, [store, setAccounts, setSelectedAccount, setEnkaNetwork])

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
    enkaNetwork,
    addAccount,
    removeAccount,
    updateAccount,
    selectAccount,
    toggleEnkaNetwork,
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
