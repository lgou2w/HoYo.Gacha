import { ProgressBarState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-progress/library/src/components/ProgressBar
//  https://react.fluentui.dev/?path=/docs/components-progressbar--docs

const useStyles = makeStyles({
  medium: {
    height: '0.125rem',
  },
  large: {
    height: '0.25rem',
  },
})

export default function useProgressBarStyles (state: ProgressBarState) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles[state.thickness],
    getSlotClassNameProp_unstable(state.root),
  )
}
