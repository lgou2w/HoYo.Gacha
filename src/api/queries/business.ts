import { queryOptions, useMutation, useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { FindAndPrettyGachaRecordsArgs, PrettyGachaRecordsError, findAndPrettyGachaRecords } from '@/api/commands/business'
import { SqlxDatabaseError, SqlxError, deleteKv, findGachaRecordsByBusinessAndUidWithLimit, findKv, upsertKv } from '@/api/commands/database'
import { Account } from '@/interfaces/Account'
import { Business, Businesses, ReversedBusinesses } from '@/interfaces/Business'
import { GachaRecord, PrettizedGachaRecords } from '@/interfaces/GachaRecord'
import { Tabs as GachaClientareaTab } from '@/pages/Gacha/LegacyView/declares'
import queryClient from '@/queryClient'

// #region: Prettized Gacha Records

const KeyPrettizedGachaRecords = 'PrettizedGachaRecords'

export function prettizedGachaRecordsQueryKey (
  business: Business,
  uid: Account['uid'] | null | undefined,
  customLocale?: FindAndPrettyGachaRecordsArgs<Business>['customLocale'],
) {
  return [ReversedBusinesses[business], KeyPrettizedGachaRecords, uid ?? null, customLocale ?? null] as const
}

export type PrettizedGachaRecordsQueryKey = ReturnType<typeof prettizedGachaRecordsQueryKey>

export function prettizedGachaRecordsQueryOptions<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
  customLocale?: FindAndPrettyGachaRecordsArgs<T>['customLocale'],
) {
  return queryOptions<
    PrettizedGachaRecords<T> | null,
    SqlxError | SqlxDatabaseError | PrettyGachaRecordsError | Error,
    PrettizedGachaRecords<T> | null,
    PrettizedGachaRecordsQueryKey
  >({
    enabled: !!uid,
    staleTime: Infinity,
    queryKey: prettizedGachaRecordsQueryKey(business, uid, customLocale),
    queryFn: async function prettizedGachaRecordsQueryFn () {
      return uid
        ? findAndPrettyGachaRecords<T>({ business, uid, customLocale })
        : null
    },
    retry: false,
  })
}

export function usePrettizedGachaRecordsQuery<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
  customLocale?: FindAndPrettyGachaRecordsArgs<T>['customLocale'],
) {
  return useQuery(prettizedGachaRecordsQueryOptions(business, uid, customLocale))
}

export function usePrettizedGachaRecordsSuspenseQuery<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
  customLocale?: FindAndPrettyGachaRecordsArgs<T>['customLocale'],
) {
  return useSuspenseQuery(prettizedGachaRecordsQueryOptions(business, uid, customLocale))
}

export function usePrettizedGachaRecordsSuspenseQueryData<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
  customLocale?: FindAndPrettyGachaRecordsArgs<T>['customLocale'],
) {
  return usePrettizedGachaRecordsSuspenseQuery(business, uid, customLocale)
    .data
}

export function prefetchPrettizedGachaRecordsQuery<T extends Business> (
  business: T,
  uid: Account['uid'] | null | undefined,
  customLocale?: FindAndPrettyGachaRecordsArgs<T>['customLocale'],
) {
  return queryClient.prefetchQuery(prettizedGachaRecordsQueryOptions(business, uid, customLocale))
}

export function invalidatePrettizedGachaRecordsQuery (
  business: Business,
  uid: Account['uid'] | null | undefined,
  customLocale?: FindAndPrettyGachaRecordsArgs<Business>['customLocale'],
) {
  return queryClient.invalidateQueries({
    queryKey: prettizedGachaRecordsQueryKey(business, uid, customLocale),
  })
}

export function removePrettizedGachaRecordsQuery (
  business: Business,
  uid: Account['uid'] | null | undefined,
  customLocale?: FindAndPrettyGachaRecordsArgs<Business>['customLocale'],
) {
  queryClient.removeQueries({
    queryKey: prettizedGachaRecordsQueryKey(business, uid, customLocale),
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
    gcTime: Infinity, // Don't gc this data, cache it permanently
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
    retry: false,
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

export function invalidateFirstGachaRecordQuery (
  business: Business,
  uid: Account['uid'] | null | undefined,
) {
  return queryClient.invalidateQueries({
    queryKey: firstGachaRecordQueryKey(business, uid),
  })
}

export function removeFirstGachaRecordQuery (
  business: Business,
  uid: Account['uid'] | null | undefined,
) {
  queryClient.removeQueries({
    queryKey: firstGachaRecordQueryKey(business, uid),
  })
}

// #endregion

// #region: Navbar business

const KeyNavbarBusinessVisible = 'NavbarBusinessVisible'
const DatabaseKeyNavbarBusinessVisible = `Query:${KeyNavbarBusinessVisible}`

// true | null -> visible
// false       -> invisible
export type NavbarBusinessVisible = Record<Business, boolean | null>

const DefaultNavbarBusinessVisible: NavbarBusinessVisible = {
  [Businesses.GenshinImpact]: null,
  [Businesses.HonkaiStarRail]: null,
  [Businesses.ZenlessZoneZero]: null,
}

export function navbarBusinessVisibleQueryOptions () {
  return queryOptions<
    NavbarBusinessVisible,
    SqlxError | SqlxDatabaseError | Error,
    NavbarBusinessVisible,
    [typeof KeyNavbarBusinessVisible]
  >({
    staleTime: Infinity,
    queryKey: [KeyNavbarBusinessVisible],
    queryFn: async function navbarBusinessVisibleQueryFn () {
      const kv = await findKv({ key: DatabaseKeyNavbarBusinessVisible })
      const data = Object.assign({}, DefaultNavbarBusinessVisible)

      if (!kv) {
        return data
      }

      let parsed: NavbarBusinessVisible
      try {
        parsed = JSON.parse(kv.val)
      } catch (e) {
        console.error('Failed to parse NavbarBusinessVisible from database:', e)
        await deleteKv({ key: DatabaseKeyNavbarBusinessVisible })
        return data
      }

      for (const business of Object.values(Businesses)) {
        const visible = parsed[business]
        if (typeof visible === 'boolean' || visible === null) {
          data[business] = visible
        }
      }

      return data
    },
  })
}

export function useNavbarBusinessVisibleQuery () {
  return useQuery(navbarBusinessVisibleQueryOptions())
}

export function useNavbarBusinessVisibleSuspenseQuery () {
  return useSuspenseQuery(navbarBusinessVisibleQueryOptions())
}

export function useNavbarBusinessVisibleSuspenseQueryData () {
  return useNavbarBusinessVisibleSuspenseQuery().data
}

export function ensureNavbarBusinessVisibleQueryData () {
  return queryClient.ensureQueryData(navbarBusinessVisibleQueryOptions())
}

// Mutation

const UpdateNavbarBusinessVisibleQueryKey = [KeyNavbarBusinessVisible, 'Update']

export function useUpdateNavbarBusinessVisibleMutation () {
  return useMutation<
    NavbarBusinessVisible,
    SqlxError | SqlxDatabaseError | Error,
    Partial<NavbarBusinessVisible>
  >({
    mutationKey: UpdateNavbarBusinessVisibleQueryKey,
    async mutationFn (args) {
      let visible = queryClient.getQueryData<NavbarBusinessVisible>([KeyNavbarBusinessVisible])

      if (!visible) {
        visible = Object.assign({}, DefaultNavbarBusinessVisible)
      }

      for (const business of Object.values(Businesses)) {
        const value = args[business]
        if (typeof value !== 'undefined' && visible[business] !== value) {
          visible[business] = value
        }
      }

      await upsertKv({
        key: DatabaseKeyNavbarBusinessVisible,
        val: JSON.stringify(visible),
      })

      return visible
    },
    async onSuccess () {
      await queryClient.resetQueries({ queryKey: [KeyNavbarBusinessVisible] })
    },
  })
}

// #endregion

// #region: Gacha Clientarea Tab

const KeyGachaClientareaTab = 'GachaClientareaTab'
const DatabaseKeyGachaClientareaTab = `Query:${KeyGachaClientareaTab}`
const DefaultGachaClientareaTab = GachaClientareaTab.Overview

function gachaClientareaTabQueryOptions () {
  return queryOptions<
    GachaClientareaTab,
    SqlxError | SqlxDatabaseError | Error,
    GachaClientareaTab
  >({
    staleTime: Infinity,
    queryKey: [KeyGachaClientareaTab],
    queryFn: async function gachaClientareaTabQueryFn () {
      const kv = await findKv({ key: DatabaseKeyGachaClientareaTab })

      if (!kv) {
        return DefaultGachaClientareaTab
      }

      switch (kv.val) {
        case GachaClientareaTab.Overview:
          return GachaClientareaTab.Overview
        case GachaClientareaTab.Analysis:
          return GachaClientareaTab.Analysis
        default:
          break
      }

      console.error(`Unexpected Gacha Clientarea Tab value: ${kv.val}, using default tab: ${DefaultGachaClientareaTab}`)
      await deleteKv({ key: DatabaseKeyGachaClientareaTab })
      return DefaultGachaClientareaTab
    },
  })
}

export function useGachaClientareaTabQuery () {
  return useQuery(gachaClientareaTabQueryOptions())
}

export function useGachaClientareaTabSuspenseQuery () {
  return useSuspenseQuery(gachaClientareaTabQueryOptions())
}

export function useGachaClientareaTabSuspenseQueryData () {
  return useGachaClientareaTabSuspenseQuery().data
}

export function ensureGachaClientareaTabQueryData () {
  return queryClient.ensureQueryData(gachaClientareaTabQueryOptions())
}

export function invalidateGachaClientareaTabQuery () {
  return queryClient.invalidateQueries({ queryKey: [KeyGachaClientareaTab] })
}

// Mutation

const UpdateGachaClientareaTabQueryKey = [KeyGachaClientareaTab, 'Update']

export function useUpdateGachaClientareaTabMutation () {
  return useMutation<
    GachaClientareaTab,
    SqlxError | SqlxDatabaseError | Error,
    GachaClientareaTab
  >({
    mutationKey: UpdateGachaClientareaTabQueryKey,
    async mutationFn (newValue) {
      await upsertKv({
        key: DatabaseKeyGachaClientareaTab,
        val: newValue,
      })

      return newValue
    },
    onSuccess () {
      invalidateGachaClientareaTabQuery()
    },
  })
}

// #endregion
