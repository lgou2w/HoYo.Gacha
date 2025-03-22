import { ComponentRef, forwardRef } from 'react'
import { DialogContent, DialogContentProps, makeStyles, renderDialogContent_unstable, useDialogContentStyles_unstable, useDialogContent_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-dialog/library/src/components/DialogContent
//  https://react.fluentui.dev/?path=/docs/components-dialog--docs

const useStyles = makeStyles({
  root: {
    minHeight: '2rem',
  },
})

export default forwardRef<ComponentRef<typeof DialogContent>, DialogContentProps>(function DialogContent (props, ref) {
  const { className, ...rest } = props
  const state = useDialogContent_unstable(rest, ref)

  useDialogContentStyles_unstable(state)

  const styles = useStyles()

  mergeComponentClasses(state.root, styles.root, className)

  return renderDialogContent_unstable(state)
})
