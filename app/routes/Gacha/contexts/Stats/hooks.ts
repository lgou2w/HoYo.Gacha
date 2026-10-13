import { use } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { AccountBusiness } from '@/api/Account'
import { GachaStatsQueryArgs, gachaStatsQueryOptions } from './query'
import { GachaStatsContext } from './types'

export function useGachaStats () {
  // Because the GachaStatsContext is unwrapped,
  // it is a direct reference to the GachaStats value.
  return use(GachaStatsContext)
}

export function useGachaStatsSuspenseQuery<T extends AccountBusiness> (
  args: GachaStatsQueryArgs<T>,
) {
  return useSuspenseQuery(gachaStatsQueryOptions(args))
}
