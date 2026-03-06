/* eslint-disable react-hooks/immutability */

import { ToastFooterState, getSlotClassNameProp_unstable, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-toast/library/src/components/ToastFooter
//  https://react.fluentui.dev/?path=/docs/components-toast--docs

const useStyles = makeStyles({
  root: {
    paddingTop: tokens.spacingVerticalL,
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
