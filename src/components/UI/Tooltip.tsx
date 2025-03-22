import { TooltipProps, makeStyles, renderTooltip_unstable, useTooltipStyles_unstable, useTooltip_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-tooltip/library/src/components/Tooltip
//  https://react.fluentui.dev/?path=/docs/components-tooltip--docs

const useStyles = makeStyles({
  root: {
    maxWidth: '15rem',
    padding: '0.25rem 0.6785rem 0.375rem 0.6785rem',
  },
})

export default function Tooltip (props: TooltipProps & { className?: string }) {
  const { className, ...rest } = props
  const state = useTooltip_unstable(rest)

  useTooltipStyles_unstable(state)

  const styles = useStyles()

  mergeComponentClasses(state.content, styles.root, className)

  return renderTooltip_unstable(state)
}
