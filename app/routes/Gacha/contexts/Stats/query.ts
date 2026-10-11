import { queryOptions } from '@tanstack/react-query'
import { AccountBusiness, KeyofAccountBusiness } from '@/api/Account'
import queryClient from '@/queryClient'
import { AnalyzeRecordsArgs, BusinessCommands } from '@/routes/Gacha/api/business'
import { GachaStats } from '@/routes/Gacha/api/stats'

export interface GachaStatsQueryArgs<T extends AccountBusiness = AccountBusiness> {
  business: T
  uid?: AnalyzeRecordsArgs<T>['uid'] | null
  customLocale?: AnalyzeRecordsArgs<T>['customLocale']
}

const KeyGachaStats = 'GachaStats'

function gachaStatsQueryKey<T extends AccountBusiness> (
  args: GachaStatsQueryArgs<T>,
) {
  const { business, uid, customLocale } = args
  return [
    AccountBusiness[business] as KeyofAccountBusiness,
    KeyGachaStats,
    uid ?? null,
    customLocale ?? null,
  ] as const
}

type GachaStatsQueryKey = ReturnType<typeof gachaStatsQueryKey>

export function gachaStatsQueryOptions<T extends AccountBusiness> (
  args: GachaStatsQueryArgs<T>,
) {
  const { business, uid, customLocale } = args
  return queryOptions<
    GachaStats<T> | null,
    Error,
    GachaStats<T> | null,
    GachaStatsQueryKey
  >({
    enabled: !!uid,
    staleTime: Infinity,
    queryKey: gachaStatsQueryKey(args),
    queryFn: async function gachaStatsQueryFn () {
      return uid
        ? BusinessCommands.analyzeRecords<T>({ business, uid, customLocale })
        : null
    },
  })
}

export function prefetchGachaStatsQuery<T extends AccountBusiness> (
  args: GachaStatsQueryArgs<T>,
) {
  return queryClient.query({
    ...gachaStatsQueryOptions(args),
    staleTime: 'static',
  })
}

export function invalidateGachaStatsQuery<T extends AccountBusiness> (
  args: GachaStatsQueryArgs<T>,
) {
  return queryClient.invalidateQueries({
    queryKey: gachaStatsQueryKey(args),
  })
}

export function removeGachaStatsQuery<T extends AccountBusiness> (
  args: GachaStatsQueryArgs<T>,
) {
  return queryClient.removeQueries({
    queryKey: gachaStatsQueryKey(args),
  })
}
