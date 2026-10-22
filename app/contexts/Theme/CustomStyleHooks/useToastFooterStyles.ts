/* eslint-disable react-hooks/immutability */

import { ToastFooterState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-toast/library/src/components/ToastFooter
//  https://storybooks.fluentui.dev/react/?path=/docs/components-toast--docs

const useStyles = makeStyles({
  root: {
    paddingTop: '1rem',
    gap: '0.875rem',
  },
})

export default function useToastFooterStyles (state: ToastFooterState) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )
}
