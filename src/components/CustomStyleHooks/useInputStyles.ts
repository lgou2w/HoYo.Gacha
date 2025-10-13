/* eslint-disable react-hooks/immutability */

import { InputState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-input/library/src/components/Input
//  https://react.fluentui.dev/?path=/docs/components-input--docs

const useStyles = makeStyles({
  small: {
    minHeight: '1.5rem',
  },
  medium: {
    minHeight: '2rem',
  },
  large: {
    minHeight: '2.5rem',
  },
})

const useContentStyles = makeStyles({
  small: {
    '> svg': { fontSize: '1rem' },
  },
  medium: {
    '> svg': { fontSize: '1.25rem' },
  },
  large: {
    '> svg': { fontSize: '1.5rem' },
  },
})

export default function useInputStyles (state: InputState) {
  const styles = useStyles()
  const contentStyles = useContentStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles[state.size],
    getSlotClassNameProp_unstable(state.root),
  )

  if (state.contentBefore) {
    state.contentBefore.className = mergeClasses(
      state.contentBefore.className,
      contentStyles[state.size],
      getSlotClassNameProp_unstable(state.contentBefore),
    )
  }

  if (state.contentAfter) {
    state.contentAfter.className = mergeClasses(
      state.contentAfter.className,
      contentStyles[state.size],
      getSlotClassNameProp_unstable(state.contentAfter),
    )
  }
}
