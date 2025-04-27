import { queryOptions, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { PrettyGachaRecordsError, findAndPrettyGachaRecords } from '@/api/commands/business'
import { SqlxDatabaseError, SqlxError, findGachaRecordsByBusinessAndUidWithLimit } from '@/api/commands/database'
import { Account } from '@/interfaces/Account'
import { Business, ReversedBusinesses } from '@/interfaces/Business'
import { GachaRecord, PrettizedGachaRecords } from '@/interfaces/GachaRecord'
import queryClient from '@/queryClient'

// #region: Prettized Gacha Records

const KeyPrettizedGachaRecords = 'PrettizedGachaRecords'

export function prettizedGachaRecordsQueryKey (
  business: Business,
  uid: Account['uid'] | null | undefined,
) {
  return [ReversedBusinesses[business], KeyPrettizedGachaRecords, uid ?? null] as const
}

export type PrettizedGachaRecordsQueryKey = ReturnType<typeof prettizedGachaRecordsQueryKey>

export function prettizedGachaRecordsQueryOptions<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
) {
  return queryOptions<
    PrettizedGachaRecords<T> | null,
    SqlxError | SqlxDatabaseError | PrettyGachaRecordsError | Error,
    PrettizedGachaRecords<T> | null,
    PrettizedGachaRecordsQueryKey
  >({
    enabled: !!uid,
    staleTime: Infinity,
    queryKey: prettizedGachaRecordsQueryKey(business, uid),
    queryFn: async function prettizedGachaRecordsQueryFn () {
      return uid
        ? findAndPrettyGachaRecords<T>({ business, uid })
        : null
    },
  })
}

export function usePrettizedGachaRecordsQuery<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
) {
  return useQuery(prettizedGachaRecordsQueryOptions(business, uid))
}

export function usePrettizedGachaRecordsSuspenseQuery<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
) {
  return useSuspenseQuery(prettizedGachaRecordsQueryOptions(business, uid))
}

export function usePrettizedGachaRecordsSuspenseQueryData<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
) {
  return usePrettizedGachaRecordsSuspenseQuery(business, uid)
    .data
}

export function prefetchPrettizedGachaRecordsQuery<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
) {
  return queryClient.prefetchQuery(prettizedGachaRecordsQueryOptions(business, uid))
}

export function invalidatePrettizedGachaRecordsQuery (
  business: Business,
  uid: Account['uid'] | null | undefined,
) {
  return queryClient.invalidateQueries({
    queryKey: prettizedGachaRecordsQueryKey(business, uid),
  })
}

// #endregion

// #region: First Gacha Record

const KeyFirstGacha = 'FirstGachaRecord'

export function firstGachaRecordQueryKey (
  business: Business,
  uid: Account['uid'] | null | undefined,
) {
  return [ReversedBusinesses[business], KeyFirstGacha, uid ?? null] as const
}

export type FirstGachaRecordQueryKey = ReturnType<typeof firstGachaRecordQueryKey>

export function firstGachaRecordQueryOptions<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
) {
  return queryOptions<
    GachaRecord<T> | null,
    SqlxError | SqlxDatabaseError | Error,
    GachaRecord<T> | null,
    FirstGachaRecordQueryKey
  >({
    enabled: !!uid,
    staleTime: Infinity,
    queryKey: firstGachaRecordQueryKey(business, uid),
    queryFn: async function firstGachaRecordQueryFn () {
      if (!uid) {
        return null
      }

      const records = await findGachaRecordsByBusinessAndUidWithLimit({
        business,
        uid,
        limit: 1,
      })

      return records.length > 0 ? records[0] : null
    },
  })
}

export function useFirstGachaRecordQuery<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
) {
  return useQuery(firstGachaRecordQueryOptions(business, uid))
}

export function useFirstGachaRecordSuspenseQuery<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
) {
  return useSuspenseQuery(firstGachaRecordQueryOptions(business, uid))
}

export function useFirstGachaRecordSuspenseQueryData<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
) {
  return useFirstGachaRecordSuspenseQuery(business, uid)
    .data
}

export function prefetchFirstGachaRecordQuery<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
) {
  return queryClient.prefetchQuery(firstGachaRecordQueryOptions(business, uid))
}

// #endregion
