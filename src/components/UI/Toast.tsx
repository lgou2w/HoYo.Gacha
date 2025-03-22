import { ComponentRef, forwardRef } from 'react'
import { Toast, ToastProps, makeStyles, renderToast_unstable, tokens, useToastStyles_unstable, useToast_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-toast/library/src/components/Toast
//  https://react.fluentui.dev/?path=/docs/components-toast--docs

const useStyles = makeStyles({
  root: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalM}`,
    lineHeight: tokens.lineHeightBase300,
  },
})

export default forwardRef<ComponentRef<typeof Toast>, ToastProps>(function Toast (props, ref) {
  const { className, ...rest } = props
  const state = useToast_unstable(rest, ref)

  useToastStyles_unstable(state)

  const styles = useStyles()

  mergeComponentClasses(state.root, styles.root, className)

  return renderToast_unstable(state, { backgroundAppearance: state.backgroundAppearance })
})
