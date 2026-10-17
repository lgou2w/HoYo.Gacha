import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { KeyofAccountBusiness } from '@/api/Account'
import { KValueStore, createKValueStore } from '@/api/KValue'
import { DatabaseError } from '@/api/error'
import queryClient from '@/queryClient'
import { SortableDefaults, SortablePreferences } from './types'

// #region: Store

const Stores = new Map<string, KValueStore>()

function storeKey (keyof: KeyofAccountBusiness, scope: string) {
  const db = `Query:${keyof}:Sortable:${scope}`
  const ls = `HG_GACHA_${keyof.toUpperCase()}_SORTABLE_${scope.toUpperCase()}`
  return { database: db, localStorage: ls }
}

function sortableStore (keyof: KeyofAccountBusiness, scope: string): KValueStore {
  const cacheKey = `${keyof}:${scope}`
  let store = Stores.get(cacheKey)
  if (!store) {
    store = createKValueStore(storeKey(keyof, scope))
    Stores.set(cacheKey, store)
  }
  return store
}

// #endregion

// #region: Sanitize

function sanitizeOrder<T extends string> (
  value: unknown,
  defaults: SortableDefaults<T>,
): T[] {
  const known = new Set<string>(defaults.order)

  if (!Array.isArray(value)) {
    return [...defaults.order]
  }

  const seen = new Set<string>()
  const result: T[] = []

  for (const id of value) {
    if (typeof id === 'string' && known.has(id) && !seen.has(id)) {
      seen.add(id)
      result.push(id as T)
    }
  }

  // Append ids introduced by newer versions.
  for (const id of defaults.order) {
    if (!seen.has(id)) {
      result.push(id)
    }
  }

  return result
}

function sanitizeHidden<T extends string> (
  value: unknown,
  defaults: SortableDefaults<T>,
): T[] {
  const known = new Set<string>(defaults.order)

  if (!Array.isArray(value)) {
    return [...defaults.hidden]
  }

  const seen = new Set<string>()
  const result: T[] = []

  for (const id of value) {
    if (typeof id === 'string' && known.has(id) && !seen.has(id)) {
      seen.add(id)
      result.push(id as T)
    }
  }

  return result
}

function sanitize<T extends string> (
  value: unknown,
  defaults: SortableDefaults<T>,
): SortablePreferences<T> {
  if (!value || typeof value !== 'object') {
    return {
      order: [...defaults.order],
      hidden: [...defaults.hidden],
    }
  }

  const obj = value as Record<string, unknown>
  return {
    order: sanitizeOrder(obj.order, defaults),
    hidden: sanitizeHidden(obj.hidden, defaults),
  }
}

// #endregion

// #region: Query

function sortableQueryKey (keyof: KeyofAccountBusiness, scope: string) {
  return [keyof, 'Sortable', scope] as const
}

type SortableQueryKey = ReturnType<typeof sortableQueryKey>

export function sortableQueryOptions<T extends string> (
  keyof: KeyofAccountBusiness,
  scope: string,
  defaults: SortableDefaults<T>,
) {
  return queryOptions<
    SortablePreferences<T>,
    DatabaseError | Error,
    SortablePreferences<T>,
    SortableQueryKey
  >({
    staleTime: Infinity,
    queryKey: sortableQueryKey(keyof, scope),
    queryFn: async function sortableQueryFn () {
      const raw = await sortableStore(keyof, scope).read()
      if (!raw) {
        return {
          order: [...defaults.order],
          hidden: [...defaults.hidden],
        }
      }

      try {
        return sanitize(JSON.parse(raw), defaults)
      } catch {
        await sortableStore(keyof, scope).clear()
        return {
          order: [...defaults.order],
          hidden: [...defaults.hidden],
        }
      }
    },
  })
}

// #endregion

// #region: Mutation

export function sortableMutationOptions<T extends string> (
  scope: string,
) {
  return mutationOptions<
    SortablePreferences<T>,
    DatabaseError | Error,
    { keyof: KeyofAccountBusiness, newVal: SortablePreferences<T> },
    { previous: SortablePreferences<T> | undefined }
  >({
    mutationKey: ['Sortable', scope, 'Update'],
    async mutationFn ({ keyof, newVal }) {
      await sortableStore(keyof, scope).write(JSON.stringify(newVal))
      return newVal
    },
    async onMutate ({ keyof, newVal }) {
      const queryKey = sortableQueryKey(keyof, scope)
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<SortablePreferences<T>>(queryKey)
      queryClient.setQueryData<SortablePreferences<T>>(queryKey, newVal)
      return { previous }
    },
    onError (_error, { keyof }, context) {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(sortableQueryKey(keyof, scope), context.previous)
      }
    },
    onSettled (_data, _error, { keyof }) {
      return queryClient.invalidateQueries({
        queryKey: sortableQueryKey(keyof, scope),
      })
    },
  })
}

// #endregion
