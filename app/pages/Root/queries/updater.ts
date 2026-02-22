import { QueryKey, useQuery } from '@tanstack/react-query'
import UpdaterCommands from '@/api/commands/updater'

const LatestReleaseQueryKey: QueryKey = ['Updater', 'LatestRelease']

// HACK: Users typically don't leave the program running for extended periods.
// This option ensures that updater is checked periodically and alerts are pushed out.
const RefetchInterval = 10 * 60 * 1000 // 10 Minutes
const MaxAttempts = 3

export function useUpdaterLatestReleaseQuery () {
  return useQuery({
    gcTime: Infinity,
    staleTime: Infinity,
    networkMode: 'online',
    refetchOnReconnect: true,
    refetchInterval: RefetchInterval,
    queryKey: LatestReleaseQueryKey,
    queryFn: async function latestReleaseQueryFn () {
      if (!window.navigator.onLine) {
        return 'offline'
      }

      return UpdaterCommands.latestRelease({
        maxAttempts: MaxAttempts,
      })
    },
  })
}
