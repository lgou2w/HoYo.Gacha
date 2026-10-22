/* eslint-disable react-hooks/immutability */

import { ToastBodyState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-toast/library/src/components/ToastBody
//  https://storybooks.fluentui.dev/react/?path=/docs/components-toast--docs

const useStyles = makeStyles({
  root: {
    paddingTop: '0.375rem',
  },
})

export default function useToastBodyStyles (state: ToastBodyState) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )
}
