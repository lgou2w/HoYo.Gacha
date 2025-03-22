import { ComponentRef, forwardRef } from 'react'
import { ToastTitle, ToastTitleProps, makeStyles, renderToastTitle_unstable, tokens, useToastTitleStyles_unstable, useToastTitle_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-toast/library/src/components/ToastTitle
//  https://react.fluentui.dev/?path=/docs/components-toast--docs

const useStyles = makeStyles({
  root: {},
})

const useMediaStyles = makeStyles({
  root: {
    paddingTop: 0, // 1px -> 0
    paddingRight: tokens.spacingHorizontalS,
    fontSize: tokens.lineHeightBase300,
  },
})

const useActionStyles = makeStyles({
  root: {
    paddingLeft: tokens.spacingHorizontalM,
  },
})

export default forwardRef<ComponentRef<typeof ToastTitle>, ToastTitleProps>(function ToastTitle (props, ref) {
  const { className, ...rest } = props
  const state = useToastTitle_unstable(rest, ref)

  useToastTitleStyles_unstable(state)

  const styles = useStyles()
  const mediaStyles = useMediaStyles()
  const actionStyles = useActionStyles()

  mergeComponentClasses(state.root, styles.root, className)
  mergeComponentClasses(state.media, mediaStyles.root)
  mergeComponentClasses(state.action, actionStyles.root)

  return renderToastTitle_unstable(state)
})
