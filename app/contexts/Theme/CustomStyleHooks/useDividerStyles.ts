/* eslint-disable react-hooks/immutability */

import { DividerState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-divider/library/src/components/Divider
//  https://react.fluentui.dev/?path=/docs/components-divider--docs

const useVerticalStyles = makeStyles({
  root: {
    minHeight: '1rem',
  },
  withChilder: {
    minHeight: '5.25rem',
  },
})

export default function useDividerStyles (state: DividerState) {
  const verticalStyles = useVerticalStyles()

  state.root.className = mergeClasses(
    state.root.className,
    state.vertical && verticalStyles.root,
    state.vertical && state.root.children !== undefined && verticalStyles.withChilder,
    getSlotClassNameProp_unstable(state.root),
  )
}
