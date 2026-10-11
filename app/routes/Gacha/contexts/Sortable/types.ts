import { createContext, useContext } from 'react'

export interface SortablePreferences<T extends string> {
  order: T[]
  hidden: T[]
}

export interface SortableDefaults<T extends string> {
  order: readonly T[]
  hidden: readonly T[]
}

export interface SortableScope<T extends string> {
  scope: string
  defaults: SortableDefaults<T>
  isPinned?: (id: T) => boolean
}

export function mergeVisibleOrder<T extends string> (
  fullOrder: T[],
  visibleOrder: T[],
): T[] {
  const visibleSet = new Set(visibleOrder)
  let cursor = 0

  return fullOrder.map((id) => {
    if (visibleSet.has(id)) {
      return visibleOrder[cursor++]
    }

    return id
  })
}

export interface SortableContextValue<T extends string> {
  order: T[]
  isHidden: (id: T) => boolean
  toggle: (id: T) => void
  setHidden: (hidden: T[]) => void
  reorder: (visibleOrder: T[]) => void
  isPending: boolean
  isPinned: (id: T) => boolean
}

export function createSortableContext<T extends string> (name: string) {
  const Context = createContext<SortableContextValue<T> | null>(null)
  Context.displayName = `${name}SortableContext`

  function useSortableContext (): SortableContextValue<T> {
    const state = useContext(Context)
    if (!state) {
      throw new Error(`use${name}Sortable must be used within <${name}SortableProvider>`)
    } else {
      return state
    }
  }

  return {
    Context,
    useSortableContext,
  }
}
