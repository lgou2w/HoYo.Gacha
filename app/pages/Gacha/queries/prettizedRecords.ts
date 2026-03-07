import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import BusinessCommands from '@/api/commands/business'
import { Account, AccountBusiness, KeyofAccountBusiness } from '@/api/schemas/Account'
import { PrettizedRecords } from '@/pages/Gacha/contexts/PrettizedRecords'
import queryClient from '@/queryClient'

type Uid = Account['uid'] | null | undefined
type CustomLocale = string | null | undefined

const KeyPrettizedRecords = 'PrettizedGachaRecords'

function prettizedRecordsQueryKey<T extends AccountBusiness> (
  business: T,
  uid: Uid,
  customLocale: CustomLocale,
) {
  return [
    AccountBusiness[business] as KeyofAccountBusiness,
    KeyPrettizedRecords,
    uid ?? null,
    customLocale ?? null,
  ] as const
}

type PrettizedRecordsQueryKey = ReturnType<typeof prettizedRecordsQueryKey>

function prettizedRecordsQueryOptions<T extends AccountBusiness> (
  business: T,
  uid: Uid,
  customLocale: CustomLocale,
) {
  return queryOptions<
    PrettizedRecords<T> | null,
    Error,
    PrettizedRecords<T> | null,
    PrettizedRecordsQueryKey
  >({
    enabled: !!uid,
    staleTime: Infinity,
    queryKey: prettizedRecordsQueryKey(business, uid, customLocale),
    queryFn: async function prettizedRecordsQueryFn () {
      return uid
        ? BusinessCommands.prettyRecords<T>({
            business,
            uid,
            customLocale,
          })
        : null
    },
  })
}

export function usePrettizedRecordsSuspenseQuery<T extends AccountBusiness> (
  business: T,
  uid: Uid,
  customLocale: CustomLocale,
) {
  return useSuspenseQuery(prettizedRecordsQueryOptions(business, uid, customLocale))
}

export function prefetchPrettizedRecordsQuery<T extends AccountBusiness> (
  business: T,
  uid: Uid,
  customLocale: CustomLocale,
) {
  return queryClient.prefetchQuery(prettizedRecordsQueryOptions(business, uid, customLocale))
}

export function invalidatePrettizedRecordsQuery<T extends AccountBusiness> (
  business: T,
  uid: Uid,
  customLocale: CustomLocale,
) {
  return queryClient.invalidateQueries({
    queryKey: prettizedRecordsQueryKey(business, uid, customLocale),
  })
}

export function removePrettizedRecordsQuery<T extends AccountBusiness> (
  business: T,
  uid: Uid,
  customLocale: CustomLocale,
) {
  return queryClient.removeQueries({
    queryKey: prettizedRecordsQueryKey(business, uid, customLocale),
  })
}
