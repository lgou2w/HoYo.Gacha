/* eslint-disable react-hooks/immutability */

import { SkeletonItemState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-skeleton/library/src/components/SkeletonItem
//  https://storybooks.fluentui.dev/react/?path=/docs/components-skeleton--docs

const useRectangleStyles = makeStyles({
  8: { height: '0.5rem' },
  12: { height: '0.75rem' },
  14: { height: '0.875rem' },
  16: { height: '1rem' },
  20: { height: '1.25rem' },
  22: { height: '1.375rem' },
  24: { height: '1.5rem' },
  28: { height: '1.75rem' },
  32: { height: '2rem' },
  36: { height: '2.25rem' },
  40: { height: '2.5rem' },
  48: { height: '3rem' },
  52: { height: '3.25rem' },
  56: { height: '3.5rem' },
  64: { height: '4rem' },
  72: { height: '4.5rem' },
  92: { height: '5.75rem' },
  96: { height: '6rem' },
  120: { height: '7.5rem' },
  128: { height: '8rem' },
})

const useSizeStyles = makeStyles({
  8: { width: '0.5rem', height: '0.5rem' },
  12: { width: '0.75rem', height: '0.75rem' },
  14: { width: '0.875rem', height: '0.875rem' },
  16: { width: '1rem', height: '1rem' },
  20: { width: '1.25rem', height: '1.25rem' },
  22: { width: '1.375rem', height: '1.375rem' },
  24: { width: '1.5rem', height: '1.5rem' },
  28: { width: '1.75rem', height: '1.75rem' },
  32: { width: '2rem', height: '2rem' },
  36: { width: '2.25rem', height: '2.25rem' },
  40: { width: '2.5rem', height: '2.5rem' },
  48: { width: '3rem', height: '3rem' },
  52: { width: '3.25rem', height: '3.25rem' },
  56: { width: '3.5rem', height: '3.5rem' },
  64: { width: '4rem', height: '4rem' },
  72: { width: '4.5rem', height: '4.5rem' },
  92: { width: '5.75rem', height: '5.75rem' },
  96: { width: '6rem', height: '6rem' },
  120: { width: '7.5rem', height: '7.5rem' },
  128: { width: '8rem', height: '8rem' },
})

export default function useSkeletonItemStyles (state: SkeletonItemState) {
  const rectangleStyles = useRectangleStyles()
  const sizeStyles = useSizeStyles()

  state.root.className = mergeClasses(
    state.root.className,
    state.shape === 'rectangle' && rectangleStyles[state.size],
    state.shape === 'square' && sizeStyles[state.size],
    state.shape === 'circle' && sizeStyles[state.size],
    getSlotClassNameProp_unstable(state.root),
  )
}
