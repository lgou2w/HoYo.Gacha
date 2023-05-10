import React from 'react'
import { produce } from 'immer'
import { LoaderFunction } from 'react-router-dom'
import { QueryClient, QueryKey, UseQueryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { AccountFacet, Account } from '@/interfaces/account'
import PluginStorage, { AccountUid, CreateAccountPayload } from '@/utilities/plugin-storage'

export interface StatefulAccount {
  readonly facet: AccountFacet
  readonly accounts: Record<AccountUid, Account>
  readonly selectedAccountUid: AccountUid | null
}

export const StatefulAccountContext =
  React.createContext<StatefulAccount | undefined>(undefined)

StatefulAccountContext.displayName = 'StatefulAccountContext'

/// Query

const QueryPrefix = 'statefulAccount'

const SelectedAccountUidKey = 'selectedAccountUid'
const LocalStorageSelectedAccountUid = Object.freeze({
  get (facet: AccountFacet) { return localStorage.getItem(`${QueryPrefix}:${facet}:${SelectedAccountUidKey}`) },
  set (facet: AccountFacet, uid: AccountUid) { localStorage.setItem(`${QueryPrefix}:${facet}:${SelectedAccountUidKey}`, uid) },
  remove (facet: AccountFacet) { localStorage.removeItem(`${QueryPrefix}:${facet}:${SelectedAccountUidKey}`) }
})

const statefulAccountQueryFn: UseQueryOptions<StatefulAccount>['queryFn'] = async (context) => {
  const [, facet] = context.queryKey as [string, AccountFacet]
  const accounts = (await PluginStorage
    .findAccounts(facet))
    .reduce((acc, account) => {
      acc[account.uid] = account
      return acc
    }, {} as StatefulAccount['accounts'])

  let selectedAccountUid = LocalStorageSelectedAccountUid.get(facet)
  if (selectedAccountUid && !accounts[selectedAccountUid]) {
    console.warn(`LocalStorage contains invalid ${SelectedAccountUidKey} ${selectedAccountUid} for ${facet} facet.`)
    LocalStorageSelectedAccountUid.remove(facet as AccountFacet)
    selectedAccountUid = null
  }

  return {
    facet,
    accounts,
    selectedAccountUid
  } as StatefulAccount
}

function createQuery (facet: AccountFacet): UseQueryOptions<StatefulAccount> & { queryKey: QueryKey } {
  return {
    queryKey: [QueryPrefix, facet],
    queryFn: statefulAccountQueryFn,
    staleTime: Infinity,
    refetchOnWindowFocus: false
  }
}

/// Loader

export function createStatefulAccountLoader (
  facet: AccountFacet
): (queryClient: QueryClient) => LoaderFunction {
  return (queryClient) => async () => {
    const query = createQuery(facet)
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
  }
}

/// Hook

export const withStatefulAccount = (facet: AccountFacet, Wrapped: React.ComponentType) => {
  return function withStatefulAccountHOC () {
    const statefulAccount = useStatefulAccountQuery(facet)
    return (
      <StatefulAccountContext.Provider value={statefulAccount.data}>
        <Wrapped />
      </StatefulAccountContext.Provider>
    )
  }
}

export function useStatefulAccountQuery (facet: AccountFacet) {
  const query = createQuery(facet)
  return useQuery<StatefulAccount>(query)
}

export function useStatefulAccountContext () {
  const context = React.useContext(StatefulAccountContext)
  if (!context) {
    throw new Error('useStatefulAccountContext must be used within a StatefulAccountContext.Provider')
  } else {
    return context
  }
}

// Hook Fn

export function useSetSelectedAccountFn () {
  const queryClient = useQueryClient()
  const statefulAccount = useStatefulAccountContext()

  return React.useCallback((uid: AccountUid) => {
    const account = statefulAccount.accounts[uid]
    if (!account) throw new Error(`Account ${uid} not found.`)

    LocalStorageSelectedAccountUid.set(statefulAccount.facet, uid)
    queryClient.setQueryData<StatefulAccount>([QueryPrefix, statefulAccount.facet], (prev) => {
      return prev && produce(prev, (draft) => {
        draft.selectedAccountUid = account.uid
      })
    })
  }, [queryClient, statefulAccount])
}

export function useCreateAccountFn () {
  const queryClient = useQueryClient()
  const statefulAccount = useStatefulAccountContext()

  return React.useCallback(async (payload: Omit<CreateAccountPayload, 'facet'>) => {
    const selectedAccountUid = statefulAccount.selectedAccountUid
    const account = await PluginStorage.createAccount({ ...payload, facet: statefulAccount.facet })

    if (!selectedAccountUid) LocalStorageSelectedAccountUid.set(statefulAccount.facet, account.uid)
    queryClient.setQueryData<StatefulAccount>([QueryPrefix, statefulAccount.facet], (prev) => {
      return prev && produce(prev, (draft) => {
        draft.accounts[account.uid] = account
        draft.selectedAccountUid = selectedAccountUid ?? account.uid
      })
    })
  }, [queryClient, statefulAccount])
}
