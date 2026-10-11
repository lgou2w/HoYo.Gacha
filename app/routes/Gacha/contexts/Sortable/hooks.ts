import { useMutation, useQuery } from '@tanstack/react-query'
import { KeyofAccountBusiness } from '@/api/Account'
import { sortableMutationOptions, sortableQueryOptions } from './query'
import { SortableDefaults } from './types'

export function useSortableQuery<T extends string> (
  keyof: KeyofAccountBusiness,
  scope: string,
  defaults: SortableDefaults<T>,
) {
  return useQuery(sortableQueryOptions<T>(keyof, scope, defaults))
}

export function useSortableMutation<T extends string> (
  scope: string,
) {
  return useMutation(sortableMutationOptions<T>(scope))
}
