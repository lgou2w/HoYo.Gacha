import { ComponentRef, forwardRef } from 'react'
import { DialogSurface, DialogSurfaceProps, makeStyles, renderDialogSurface_unstable, useDialogSurfaceContextValues_unstable, useDialogSurfaceStyles_unstable, useDialogSurface_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

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

export default forwardRef<ComponentRef<typeof DialogSurface>, DialogSurfaceProps>(function DialogSurface (props, ref) {
  const { className, ...rest } = props
  const state = useDialogSurface_unstable(rest, ref)
  const contextValues = useDialogSurfaceContextValues_unstable(state)

  useDialogSurfaceStyles_unstable(state)

  const styles = useStyles()

  mergeComponentClasses(state.root, styles.root, className)

  return renderDialogSurface_unstable(state, contextValues)
})
