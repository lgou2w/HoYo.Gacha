import { ComponentRef, forwardRef } from 'react'
import { DialogBody, DialogBodyProps, makeStyles, renderDialogBody_unstable, useDialogBodyStyles_unstable, useDialogBody_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

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

export default forwardRef<ComponentRef<typeof DialogBody>, DialogBodyProps>(function DialogBody (props, ref) {
  const { className, ...rest } = props
  const state = useDialogBody_unstable(rest, ref)

  useDialogBodyStyles_unstable(state)

  const styles = useStyles()

  mergeComponentClasses(state.root, styles.root, className)

  return renderDialogBody_unstable(state)
})
