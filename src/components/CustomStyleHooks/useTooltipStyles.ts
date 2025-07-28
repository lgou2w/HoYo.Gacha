import { TooltipState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

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

export default function useTooltipStyles (state: TooltipState) {
  const styles = useStyles()

  state.content.className = mergeClasses(
    state.content.className,
    styles.root,
    getSlotClassNameProp_unstable(state.content),
  )
}
