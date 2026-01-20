/* eslint-disable react-hooks/immutability */

import { SpinnerState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-spinner/library/src/components/Spinner
//  https://react.fluentui.dev/?path=/docs/components-spinner--docs

const useStyles = makeStyles({
  root: {
    gap: '0.5rem',
  },
})

const useInnerStyles = makeStyles({
  'extra-tiny': {
    height: '1rem',
    width: '1rem',
  },
  tiny: {
    height: '1.25rem',
    width: '1.25rem',
  },
  'extra-small': {
    height: '1.5rem',
    width: '1.5rem',
  },
  small: {
    height: '1.75rem',
    width: '1.75rem',
  },
  medium: {
    height: '2rem',
    width: '2rem',
  },
  large: {
    height: '2.25rem',
    width: '2.25rem',
  },
  'extra-large': {
    height: '2.5rem',
    width: '2.5rem',
  },
  huge: {
    height: '2.75rem',
    width: '2.75rem',
  },
})

export default function useSpinnerStyles (state: SpinnerState) {
  const styles = useStyles()
  const innerStyles = useInnerStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )

  if (state.spinner) {
    state.spinner.className = mergeClasses(
      state.spinner.className,
      innerStyles[state.size],
      getSlotClassNameProp_unstable(state.spinner),
    )
  }
}
