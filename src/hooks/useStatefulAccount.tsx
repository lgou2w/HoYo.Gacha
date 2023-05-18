import React from 'react'
import { produce } from 'immer'
import { LoaderFunction } from 'react-router-dom'
import { QueryClient, QueryKey, FetchQueryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
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

const statefulAccountQueryFn: FetchQueryOptions<StatefulAccount>['queryFn'] = async (context) => {
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

    // HACK: Auto-select first valid account
    selectedAccountUid = Object.keys(accounts)[0] ?? null
    if (selectedAccountUid) {
      console.warn(`Auto-selecting first account ${selectedAccountUid} for ${facet} facet.`)
      LocalStorageSelectedAccountUid.set(facet, selectedAccountUid)
    }
  }

  return {
    facet,
    accounts,
    selectedAccountUid
  } as StatefulAccount
}

function createQuery (facet: AccountFacet): FetchQueryOptions<StatefulAccount> & { queryKey: QueryKey } {
  return {
    queryKey: [QueryPrefix, facet],
    queryFn: statefulAccountQueryFn,
    staleTime: Infinity
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

export const withStatefulAccount = (
  facet: AccountFacet,
  Wrapped: React.ComponentType<{
    facet: AccountFacet
    accounts: StatefulAccount['accounts'] | null
    selectedAccountUid: StatefulAccount['selectedAccountUid'] | null
  }>
) => {
  return function withStatefulAccountHOC () {
    const statefulAccount = useStatefulAccountQuery(facet)
    return (
      <StatefulAccountContext.Provider value={statefulAccount.data}>
        <Wrapped
          facet={facet}
          accounts={statefulAccount.data?.accounts ?? null}
          selectedAccountUid={statefulAccount.data?.selectedAccountUid ?? null}
        />
      </StatefulAccountContext.Provider>
    )
  }
}

export function useStatefulAccountQuery (facet: AccountFacet) {
  const query = createQuery(facet)
  return useQuery({
    ...query,
    refetchOnWindowFocus: false
  })
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

function createUseUpdateAccountFn<Args extends unknown[]> (caller: (...args: Args) => Promise<Account>) {
  return function () {
    const queryClient = useQueryClient()
    const statefulAccount = useStatefulAccountContext()

    return React.useCallback(async (...args: Args) => {
      const account = await caller(...args)
      queryClient.setQueryData<StatefulAccount>([QueryPrefix, statefulAccount.facet], (prev) => {
        return prev && produce(prev, (draft) => {
          draft.accounts[account.uid] = account
        })
      })
    }, [queryClient, statefulAccount])
  }
}

export const useUpdateAccountGameDataDirFn = createUseUpdateAccountFn(PluginStorage.updateAccountGameDataDir)
export const useUpdateAccountGachaUrlFn = createUseUpdateAccountFn(PluginStorage.updateAccountGachaUrl)
export const useUpdateAccountPropertiesFn = createUseUpdateAccountFn(PluginStorage.updateAccountProperties)

export function useDeleteAccountFn () {
  const queryClient = useQueryClient()
  const statefulAccount = useStatefulAccountContext()

  return React.useCallback(async (uid: AccountUid) => {
    await PluginStorage.deleteAccount(statefulAccount.facet, uid)
    queryClient.setQueryData<StatefulAccount>([QueryPrefix, statefulAccount.facet], (prev) => {
      return prev && produce(prev, (draft) => {
        delete draft.accounts[uid]
        if (statefulAccount.selectedAccountUid === uid) {
          draft.selectedAccountUid = Object.keys(draft.accounts)[0] ?? null
        }
        if (!draft.selectedAccountUid) {
          LocalStorageSelectedAccountUid.remove(statefulAccount.facet)
        } else {
          LocalStorageSelectedAccountUid.set(statefulAccount.facet, draft.selectedAccountUid)
        }
      })
    })
  }, [queryClient, statefulAccount])
}
