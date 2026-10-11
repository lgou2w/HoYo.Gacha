/* eslint-disable react-hooks/immutability */

import { MenuListState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-menu/library/src/components/MenuList
//  https://storybooks.fluentui.dev/react/?path=/docs/components-menu-menulist--docs

const useStyles = makeStyles({
  root: {
    gap: '0.125rem',
  },
})

export default function useMenuListStyles (state: MenuListState) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )
}
