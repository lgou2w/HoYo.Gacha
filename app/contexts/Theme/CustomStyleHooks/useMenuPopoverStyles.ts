/* eslint-disable react-hooks/immutability */

import { MenuPopoverState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-menu/library/src/components/MenuPopover
//  https://react.fluentui.dev/?path=/docs/components-menu-menu--docs

const useStyles = makeStyles({
  root: {
    padding: '0.25rem',
    minWidth: '8.625rem',
    maxWidth: '27.375rem',
  },
})

export default function useMenuPopoverStyles (state: MenuPopoverState) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )
}
