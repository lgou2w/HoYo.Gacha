import { PropsWithChildren, useCallback, useMemo } from 'react'
import { KeyofAccountBusiness } from '@/api/Account'
import { useSortableMutation, useSortableQuery } from './hooks'
import { SortableContextValue, SortableDefaults, createSortableContext, mergeVisibleOrder } from './types'

export interface SortableProviderProps<T extends string> {
  scope: string
  keyof: KeyofAccountBusiness
  defaults: SortableDefaults<T>
  context: ReturnType<typeof createSortableContext<T>>
  isPinned?: (id: T) => boolean
}

export default function SortableProvider<T extends string> (
  props: PropsWithChildren<SortableProviderProps<T>>,
) {
  const { scope, keyof, defaults, isPinned, context: { Context }, children } = props
  const {
    data = {
      order: [...defaults.order],
      hidden: [...defaults.hidden],
    },
  } = useSortableQuery<T>(keyof, scope, defaults)

  const mutation = useSortableMutation(scope)

  const hiddenSet = useMemo(() => new Set(data.hidden), [data.hidden])

  const isPinnedItem = useCallback(
    (id: T) => isPinned?.(id) ?? false,
    [isPinned],
  )

  const isHidden = useCallback(
    (id: T) => !isPinnedItem(id) && hiddenSet.has(id),
    [hiddenSet, isPinnedItem],
  )

  const reorder = useCallback(
    (visibleOrder: T[]) => {
      const nextOrder = mergeVisibleOrder(data.order, visibleOrder)
      mutation.mutate({
        keyof,
        newVal: {
          order: nextOrder,
          hidden: data.hidden,
        },
      })
    },
    [keyof, data, mutation],
  )

  const toggle = useCallback(
    (id: T) => {
      if (isPinnedItem(id)) {
        return
      }

      const nextHidden = hiddenSet.has(id)
        ? data.hidden.filter((h) => h !== id)
        : [...data.hidden, id]

      mutation.mutate({
        keyof,
        newVal: {
          order: data.order,
          hidden: nextHidden,
        },
      })
    },
    [keyof, data, hiddenSet, isPinnedItem, mutation],
  )

  const setHidden = useCallback(
    (hidden: T[]) => {
      mutation.mutate({
        keyof,
        newVal: {
          order: data.order,
          hidden,
        },
      })
    },
    [keyof, data, mutation],
  )

  const state = useMemo<SortableContextValue<T>>(
    () => ({
      order: data.order,
      isHidden,
      isPinned: isPinnedItem,
      toggle,
      setHidden,
      reorder,
      isPending: mutation.isPending,
    }),
    [data.order, isHidden, isPinnedItem, toggle, setHidden, reorder, mutation.isPending],
  )

  return (
    <Context value={state}>
      {children}
    </Context>
  )
}
