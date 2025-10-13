/* eslint-disable react-hooks/immutability */

import { DialogSurfaceState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-dialog/library/src/components/DialogSurface
//  https://react.fluentui.dev/?path=/docs/components-dialog--docs

const useStyles = makeStyles({
  root: {
    padding: '1.5rem',
    maxWidth: '37.5rem',
  },
})

export default function useDialogSurfaceStyles (state: DialogSurfaceState) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )
}
