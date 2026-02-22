/* eslint-disable react-hooks/immutability */

import { MessageBarState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-message-bar/library/src/components/MessageBar
//  https://react.fluentui.dev/?path=/docs/components-messagebar--docs

const useStyles = makeStyles({
  root: {
    minHeight: '2.25rem',
  },
})

export default function useMessageBarStyles (state: MessageBarState) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )
}
