import { FetchQueryOptions, useQuery } from '@tanstack/react-query'
import { Account, Businesses } from '@/api/interfaces/account'
import { OmitParametersFirst } from '@/api/interfaces/declares'
import { GachaRecord } from '@/api/interfaces/gacha'
import { DatabasePlugin, DatabaseError } from '@/api/plugins'
import { queryClient } from '@/api/store'

type GachaSelectedAccountQueryKey = ['gacha', 'selectedAccount', keyof typeof Businesses]

function selectedAccountStorageKey (keyOfBusinesses: keyof typeof Businesses): string {
  return `HG_GACHA_SELECTEDACCOUNT:${keyOfBusinesses}`
}

const GachaSelectedAccountQueryOptions: (keyOfBusinesses: keyof typeof Businesses) => FetchQueryOptions<
  Account['id'] | null,
  Error,
  Account['id'] | null,
  GachaSelectedAccountQueryKey
> = (keyOfBusinesses) => ({
  queryKey: ['gacha', 'selectedAccount', keyOfBusinesses],
  queryFn: ({ queryKey: [,, keyOfBusinesses] }) => {
    const found = window.localStorage.getItem(selectedAccountStorageKey(keyOfBusinesses))
    return found ? +found : null
  },
  gcTime: Infinity
})

export function useGachaSelectedAccountQuery (keyOfBusinesses: keyof typeof Businesses) {
  return useQuery({
    ...GachaSelectedAccountQueryOptions(keyOfBusinesses),
    staleTime: Infinity,
    refetchOnWindowFocus: false
  })
}

export function getGachaSelectedAccountQueryData (keyOfBusinesses: keyof typeof Businesses) {
  return queryClient.getQueryData<
    Account['id'],
    GachaSelectedAccountQueryKey
  >(['gacha', 'selectedAccount', keyOfBusinesses])
}

export function getGachaSelectedAccount (
  keyOfBusinesses: keyof typeof Businesses,
  accountsOfBusiness: Account[]
) {
  const data = getGachaSelectedAccountQueryData(keyOfBusinesses)
  return data
    ? accountsOfBusiness.find((account) => account.id === data) || null
    : null
}

export function setGachaSelectedAccountQueryData (
  keyOfBusinesses: keyof typeof Businesses,
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
  >(['gacha', 'selectedAccount', keyOfBusinesses], ...rest)
}

export function setGachaSelectedAccount (
  keyOfBusinesses: keyof typeof Businesses,
  selectedAccount: Account
) {
  setGachaSelectedAccountQueryData(keyOfBusinesses, () => {
    window.localStorage.setItem(
      selectedAccountStorageKey(keyOfBusinesses),
      String(selectedAccount.id)
    )
    return selectedAccount.id
  })
}

type GachaRecordsQueryKey = ['gacha', 'records', keyof typeof Businesses, number]

const GachaRecordsQueryOptions: (keyOfBusinesses: keyof typeof Businesses, uid: number) => FetchQueryOptions<
  GachaRecord[],
  DatabaseError | Error,
  GachaRecord[],
  GachaRecordsQueryKey
> = (keyOfBusinesses, uid) => ({
  queryKey: ['gacha', 'records', keyOfBusinesses, uid],
  queryFn: ({ queryKey: [,, keyOfBusinesses, uid] }) => DatabasePlugin.findGachaRecordsByBusinessAndUid({
    business: Businesses[keyOfBusinesses],
    uid
  }),
  gcTime: Infinity
})

export function getGachaRecordsQueryData (keyOfBusinesses: keyof typeof Businesses, uid: number) {
  return queryClient.getQueryData<GachaRecord[], GachaRecordsQueryKey>(
    ['gacha', 'records', keyOfBusinesses, uid]
  )
}

export function setGachaRecordsQueryData (
  keyOfBusinesses: keyof typeof Businesses,
  uid: number,
  ...rest: OmitParametersFirst<typeof queryClient.setQueryData<GachaRecord[]>>
) {
  return queryClient.setQueryData<GachaRecord[], GachaRecordsQueryKey>(
    ['gacha', 'records', keyOfBusinesses, uid],
    ...rest
  )
}

export function fetchGachaRecordsQuery (keyOfBusinesses: keyof typeof Businesses, uid: number) {
  return queryClient.fetchQuery(GachaRecordsQueryOptions(keyOfBusinesses, uid))
}

export function getGachaRecordsQueryDataOrFetch (keyOfBusinesses: keyof typeof Businesses, uid: number) {
  const cache = getGachaRecordsQueryData(keyOfBusinesses, uid)
  return cache
    ? Promise.resolve(cache)
    : fetchGachaRecordsQuery(keyOfBusinesses, uid)
}

export function useGachaRecordsQuery (keyOfBusinesses: keyof typeof Businesses, uid: number) {
  return useQuery({
    ...GachaRecordsQueryOptions(keyOfBusinesses, uid),
    staleTime: Infinity,
    refetchOnWindowFocus: false
  })
}
