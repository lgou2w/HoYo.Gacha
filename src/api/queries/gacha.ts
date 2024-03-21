import { FetchQueryOptions, useQuery } from '@tanstack/react-query'
import { Account, AccountFacets } from '@/api/interfaces/account'
import { OmitParametersFirst } from '@/api/interfaces/declares'
import { GachaRecord } from '@/api/interfaces/gacha'
import { DatabasePlugin, DatabaseError } from '@/api/plugins'
import { queryClient } from '@/api/store'

type GachaSelectedAccountQueryKey = ['gacha', 'selectedAccount', keyof typeof AccountFacets]

function selectedAccountStorageKey (keyOfFacets: keyof typeof AccountFacets): string {
  return `HG_GACHA_SELECTEDACCOUNT:${keyOfFacets}`
}

const GachaSelectedAccountQueryOptions: (keyOfFacets: keyof typeof AccountFacets) => FetchQueryOptions<
  Account['id'] | null,
  Error,
  Account['id'] | null,
  GachaSelectedAccountQueryKey
> = (keyOfFacets) => ({
  queryKey: ['gacha', 'selectedAccount', keyOfFacets],
  queryFn: ({ queryKey: [,, keyOfFacets] }) => {
    const found = window.localStorage.getItem(selectedAccountStorageKey(keyOfFacets))
    return found ? +found : null
  },
  gcTime: Infinity
})

export function useGachaSelectedAccountQuery (keyOfFacets: keyof typeof AccountFacets) {
  return useQuery({
    ...GachaSelectedAccountQueryOptions(keyOfFacets),
    staleTime: Infinity,
    refetchOnWindowFocus: false
  })
}

export function getGachaSelectedAccountQueryData (keyOfFacets: keyof typeof AccountFacets) {
  return queryClient.getQueryData<
    Account['id'],
    GachaSelectedAccountQueryKey
  >(['gacha', 'selectedAccount', keyOfFacets])
}

export function getGachaSelectedAccount (
  keyOfFacets: keyof typeof AccountFacets,
  accountsOfFacet: Account[]
) {
  const data = getGachaSelectedAccountQueryData(keyOfFacets)
  return data
    ? accountsOfFacet.find((account) => account.id === data) || null
    : null
}

export function setGachaSelectedAccountQueryData (
  keyOfFacets: keyof typeof AccountFacets,
  ...rest: OmitParametersFirst<
    typeof queryClient.setQueryData<
      Account['id'],
      GachaSelectedAccountQueryKey
    >
  >
) {
  return queryClient.setQueryData<
    Account['id'],
    GachaSelectedAccountQueryKey
  >(['gacha', 'selectedAccount', keyOfFacets], ...rest)
}

export function setGachaSelectedAccount (
  keyOfFacets: keyof typeof AccountFacets,
  selectedAccount: Account
) {
  setGachaSelectedAccountQueryData(keyOfFacets, () => {
    window.localStorage.setItem(
      selectedAccountStorageKey(keyOfFacets),
      String(selectedAccount.id)
    )
    return selectedAccount.id
  })
}

type GachaRecordsQueryKey = ['gacha', 'records', keyof typeof AccountFacets, number]

const GachaRecordsQueryOptions: (keyOfFacets: keyof typeof AccountFacets, uid: number) => FetchQueryOptions<
  GachaRecord[],
  DatabaseError | Error,
  GachaRecord[],
  GachaRecordsQueryKey
> = (keyOfFacets, uid) => ({
  queryKey: ['gacha', 'records', keyOfFacets, uid],
  queryFn: ({ queryKey: [,, keyOfFacets, uid] }) => DatabasePlugin.findGachaRecordsByFacetAndUid({
    facet: AccountFacets[keyOfFacets],
    uid
  }),
  gcTime: Infinity
})

export function getGachaRecordsQueryData (keyOfFacets: keyof typeof AccountFacets, uid: number) {
  return queryClient.getQueryData<GachaRecord[], GachaRecordsQueryKey>(
    ['gacha', 'records', keyOfFacets, uid]
  )
}

export function setGachaRecordsQueryData (
  keyOfFacets: keyof typeof AccountFacets,
  uid: number,
  ...rest: OmitParametersFirst<typeof queryClient.setQueryData<GachaRecord[]>>
) {
  return queryClient.setQueryData<GachaRecord[], GachaRecordsQueryKey>(
    ['gacha', 'records', keyOfFacets, uid],
    ...rest
  )
}

export function fetchGachaRecordsQuery (keyOfFacets: keyof typeof AccountFacets, uid: number) {
  return queryClient.fetchQuery(GachaRecordsQueryOptions(keyOfFacets, uid))
}

export function getGachaRecordsQueryDataOrFetch (keyOfFacets: keyof typeof AccountFacets, uid: number) {
  const cache = getGachaRecordsQueryData(keyOfFacets, uid)
  return cache
    ? Promise.resolve(cache)
    : fetchGachaRecordsQuery(keyOfFacets, uid)
}

export function useGachaRecordsQuery (keyOfFacets: keyof typeof AccountFacets, uid: number) {
  return useQuery({
    ...GachaRecordsQueryOptions(keyOfFacets, uid),
    staleTime: Infinity,
    refetchOnWindowFocus: false
  })
}
