/* eslint-disable react-hooks/immutability */

import { PopoverSurfaceState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-popover/library/src/components/PopoverSurface
//  https://react.fluentui.dev/?path=/docs/components-popover--docs

const useStyles = makeStyles({
  small: {
    padding: '0.75rem',
  },
  medium: {
    padding: '1rem',
  },
  large: {
    padding: '1.25rem',
  },
})

export default function usePopoverSurfaceStyles (state: PopoverSurfaceState) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles[state.size],
    getSlotClassNameProp_unstable(state.root),
  )
}
