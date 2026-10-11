import { use } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { AccountBusiness } from '@/api/Account'
import { GachaStatsQueryArgs, gachaStatsQueryOptions } from './query'
import { GachaStatsContext } from './types'

export function useGachaStats () {
  const state = use(GachaStatsContext)
  if (!state) {
    throw new Error('useGachaStats must be used within an GachaStatsProvider')
  } else {
    return state
  }
}

export function useGachaStatsSuspenseQuery<T extends AccountBusiness> (
  args: GachaStatsQueryArgs<T>,
) {
  return useSuspenseQuery(gachaStatsQueryOptions(args))
}
