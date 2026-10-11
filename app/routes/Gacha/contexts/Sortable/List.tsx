import { ComponentProps, PropsWithoutRef, ReactNode, RefObject, memo, useCallback, useRef } from 'react'
import { RestrictToHorizontalAxis, RestrictToVerticalAxis } from '@dnd-kit/abstract/modifiers'
import { RestrictToElement } from '@dnd-kit/dom/modifiers'
import { move } from '@dnd-kit/helpers'
import { DragDropProvider } from '@dnd-kit/react'
import { UseSortableInput, useSortable } from '@dnd-kit/react/sortable'

export type SortableAxis = 'horizontal' | 'vertical' | 'both'

export interface SortableListProps<T extends string> extends Omit<ComponentProps<'div'>, 'children'> {
  onReorder: (next: T[]) => void
  items: readonly T[]
  itemDisabled?: (id: T, index: number) => UseSortableInput['disabled']
  itemContent: (
    id: T,
    index: number,
    sortable: ReturnType<typeof useSortable>,
  ) => ReactNode
  trailing?: ReactNode
  axis?: SortableAxis
}

export default function SortableList<T extends string> (props: PropsWithoutRef<SortableListProps<T>>) {
  const {
    items,
    onReorder,
    itemContent,
    itemDisabled,
    trailing,
    axis = 'both',
    ...rest
  } = props

  const container = useRef<HTMLDivElement>(null)

  const handleDragEnd = useCallback<Required<ComponentProps<typeof DragDropProvider>>['onDragEnd']>((evt) => {
    const next = move(items as T[], evt)
    onReorder(next)
  }, [items, onReorder])

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div ref={container} {...rest}>
        {items.map((id, index) => (
          <SortableItem
            key={id}
            id={id}
            index={index}
            container={container}
            disabled={itemDisabled?.(id, index)}
            axis={axis}
          >
            {itemContent}
          </SortableItem>
        ))}
        {trailing}
      </div>
    </DragDropProvider>
  )
}

interface SortableItemProps<T extends string> {
  id: T
  index: number
  container: RefObject<HTMLDivElement | null>
  disabled: UseSortableInput['disabled']
  axis: SortableAxis
  children: (
    id: T,
    index: number,
    sortable: ReturnType<typeof useSortable>,
  ) => ReactNode
}

function SortableItemInner<T extends string> (props: SortableItemProps<T>) {
  const { id, index, container, disabled, axis, children } = props

  const axisModifier = axis === 'horizontal'
    ? RestrictToHorizontalAxis
    : axis === 'vertical'
      ? RestrictToVerticalAxis
      : undefined

  const sortable = useSortable({
    id,
    index,
    disabled,
    modifiers: [
      RestrictToElement.configure({
        element: () => container.current,
      }),
      ...(axisModifier ? [axisModifier] : []),
    ],
  })

  return children(id, index, sortable)
}

const SortableItem = memo(SortableItemInner) as typeof SortableItemInner
