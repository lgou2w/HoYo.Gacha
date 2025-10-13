/* eslint-disable react-hooks/immutability */

import { DialogBodyState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-dialog/library/src/components/DialogBody
//  https://react.fluentui.dev/?path=/docs/components-dialog--docs

const useStyles = makeStyles({
  root: {
    gap: '0.5rem',
    maxHeight: 'calc(100vh - 2 * 1.5rem)',
  },
})

export default function useDialogBodyStyles (state: DialogBodyState) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )
}
