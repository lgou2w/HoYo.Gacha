import { FetchQueryOptions, useQuery } from '@tanstack/react-query'
import { Account, Businesses, KeyofBusinesses } from '@/api/interfaces/account'
import { OmitParametersFirst } from '@/api/interfaces/declares'
import { GachaRecord } from '@/api/interfaces/gacha'
import { DatabasePlugin, DatabaseError } from '@/api/plugins'
import { queryClient } from '@/api/store'

type GachaSelectedAccountQueryKey = ['gacha', 'selectedAccount', KeyofBusinesses]

function selectedAccountStorageKey (keyofBusinesses: KeyofBusinesses): string {
  return `HG_GACHA_SELECTEDACCOUNT:${keyofBusinesses}`
}

const GachaSelectedAccountQueryOptions: (keyofBusinesses: KeyofBusinesses) => FetchQueryOptions<
  Account['id'] | null,
  Error,
  Account['id'] | null,
  GachaSelectedAccountQueryKey
> = (keyofBusinesses) => ({
  queryKey: ['gacha', 'selectedAccount', keyofBusinesses],
  queryFn: ({ queryKey: [,, keyofBusinesses] }) => {
    const found = window.localStorage.getItem(selectedAccountStorageKey(keyofBusinesses))
    return found ? +found : null
  },
  gcTime: Infinity
})

export function useGachaSelectedAccountQuery (keyofBusinesses: KeyofBusinesses) {
  return useQuery({
    ...GachaSelectedAccountQueryOptions(keyofBusinesses),
    staleTime: Infinity,
    refetchOnWindowFocus: false
  })
}

export function getGachaSelectedAccountQueryData (keyofBusinesses: KeyofBusinesses) {
  return queryClient.getQueryData<
    Account['id'],
    GachaSelectedAccountQueryKey
  >(['gacha', 'selectedAccount', keyofBusinesses])
}

export function getGachaSelectedAccount (
  keyofBusinesses: KeyofBusinesses,
  accountsOfBusiness: Account[]
) {
  const data = getGachaSelectedAccountQueryData(keyofBusinesses)
  return data
    ? accountsOfBusiness.find((account) => account.id === data) || null
    : null
}

export function setGachaSelectedAccountQueryData (
  keyofBusinesses: KeyofBusinesses,
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
  >(['gacha', 'selectedAccount', keyofBusinesses], ...rest)
}

export function setGachaSelectedAccount (
  keyofBusinesses: KeyofBusinesses,
  selectedAccount: Account
) {
  setGachaSelectedAccountQueryData(keyofBusinesses, () => {
    window.localStorage.setItem(
      selectedAccountStorageKey(keyofBusinesses),
      String(selectedAccount.id)
    )
    return selectedAccount.id
  })
}

type GachaRecordsQueryKey = ['gacha', 'records', KeyofBusinesses, number | null]

const GachaRecordsQueryOptions: (keyofBusinesses: KeyofBusinesses, uid: number | null) => FetchQueryOptions<
  GachaRecord[] | null,
  DatabaseError | Error,
  GachaRecord[] | null,
  GachaRecordsQueryKey
> = (keyofBusinesses, uid) => ({
  queryKey: ['gacha', 'records', keyofBusinesses, uid],
  queryFn: ({ queryKey: [,, keyofBusinesses, uid] }) => uid
    ? DatabasePlugin.findGachaRecordsByBusinessAndUid({
      business: Businesses[keyofBusinesses],
      uid
    })
    : null,
  gcTime: Infinity
})

export function getGachaRecordsQueryData (keyofBusinesses: KeyofBusinesses, uid: number | null) {
  return queryClient.getQueryData<GachaRecord[], GachaRecordsQueryKey>(
    ['gacha', 'records', keyofBusinesses, uid]
  )
}

export function setGachaRecordsQueryData (
  keyofBusinesses: KeyofBusinesses,
  uid: number | null,
  ...rest: OmitParametersFirst<typeof queryClient.setQueryData<GachaRecord[]>>
) {
  return queryClient.setQueryData<GachaRecord[], GachaRecordsQueryKey>(
    ['gacha', 'records', keyofBusinesses, uid],
    ...rest
  )
}

export function fetchGachaRecordsQuery (
  keyofBusinesses: KeyofBusinesses,
  uid: number | null
) {
  return queryClient.fetchQuery(GachaRecordsQueryOptions(keyofBusinesses, uid))
}

export function getGachaRecordsQueryDataOrFetch (
  keyofBusinesses: KeyofBusinesses,
  uid: number | null
) {
  const cache = getGachaRecordsQueryData(keyofBusinesses, uid)
  return cache
    ? Promise.resolve(cache)
    : fetchGachaRecordsQuery(keyofBusinesses, uid)
}

export function useGachaRecordsQuery (
  keyofBusinesses: KeyofBusinesses,
  uid: number | null
) {
  return useQuery({
    ...GachaRecordsQueryOptions(keyofBusinesses, uid),
    staleTime: Infinity,
    refetchOnWindowFocus: false
  })
}
