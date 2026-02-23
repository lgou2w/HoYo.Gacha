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

      if (isDisabledStartupCheck()) {
        return 'disabledStartupCheck'
      }

      return UpdaterCommands.latestRelease({
        maxAttempts: MaxAttempts,
      })
    },
  })
}

// Startup checks are enabled by default.

const KEY_DISABLED_STARTUP_CHECK = 'HG_DISABLED_STARTUP_CHECK'

export function isDisabledStartupCheck (): boolean {
  return localStorage.getItem(KEY_DISABLED_STARTUP_CHECK) === 'true'
}

export function setDisableStartupCheck (value: boolean) {
  localStorage.setItem(KEY_DISABLED_STARTUP_CHECK, String(value))
}
