/* eslint-disable react-hooks/immutability */

import { DividerState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-divider/library/src/components/Divider
//  https://storybooks.fluentui.dev/react/?path=/docs/components-divider--docs

const useVerticalStyles = makeStyles({
  root: {
    minHeight: '1rem',
  },
  withChildren: {
    minHeight: '5.25rem',
  },
})

export default function useDividerStyles (state: DividerState) {
  const verticalStyles = useVerticalStyles()

  state.root.className = mergeClasses(
    state.root.className,
    state.vertical && verticalStyles.root,
    state.vertical && state.root.children !== undefined && verticalStyles.withChildren,
    getSlotClassNameProp_unstable(state.root),
  )
}
