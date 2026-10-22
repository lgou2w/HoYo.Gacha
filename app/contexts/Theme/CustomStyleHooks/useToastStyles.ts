/* eslint-disable react-hooks/immutability */

import { ToastState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-toast/library/src/components/Toast
//  https://storybooks.fluentui.dev/react/?path=/docs/components-toast--docs

const useStyles = makeStyles({
  root: {
    padding: '0.75rem',
    lineHeight: '1.25rem',
  },
})

export default function useToastStyles (state: ToastState) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )
}
