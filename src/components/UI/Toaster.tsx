import { ToasterProps, makeStyles, renderToaster_unstable, tokens, useToasterStyles_unstable, useToaster_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-toast/library/src/components/Toaster
//  https://react.fluentui.dev/?path=/docs/components-toast--docs

const useStyles = makeStyles({
  root: {
    // [`& .${toastContainerClassNames.root}`]: {}, // No export!
    '& .fui-ToastContainer': {
      marginTop: tokens.spacingVerticalM,
    },
  },
})

export default function Toaster (props: ToasterProps & { className?: string }) {
  const { className, ...rest } = props
  const state = useToaster_unstable(rest)

  useToasterStyles_unstable(state)

  const styles = useStyles()

  mergeComponentClasses(state.bottom, styles.root, className)
  mergeComponentClasses(state.bottomStart, styles.root, className)
  mergeComponentClasses(state.bottomEnd, styles.root, className)
  mergeComponentClasses(state.topStart, styles.root, className)
  mergeComponentClasses(state.topEnd, styles.root, className)
  mergeComponentClasses(state.top, styles.root, className)

  return renderToaster_unstable(state)
}
