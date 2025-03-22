import { ComponentRef, forwardRef } from 'react'
import { ToastBody, ToastBodyProps, makeStyles, renderToastBody_unstable, tokens, useToastBodyStyles_unstable, useToastBody_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-toast/library/src/components/ToastBody
//  https://react.fluentui.dev/?path=/docs/components-toast--docs

const useStyles = makeStyles({
  root: {
    paddingTop: tokens.spacingVerticalSNudge,
  },
})

export default forwardRef<ComponentRef<typeof ToastBody>, ToastBodyProps>(function ToastBody (props, ref) {
  const { className, ...rest } = props
  const state = useToastBody_unstable(rest, ref)

  useToastBodyStyles_unstable(state)

  const styles = useStyles()

  mergeComponentClasses(state.root, styles.root, className)

  return renderToastBody_unstable(state)
})
