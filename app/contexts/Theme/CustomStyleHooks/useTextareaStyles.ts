/* eslint-disable react-hooks/immutability */

import { TextareaState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-input/library/src/components/Textarea
//  https://react.fluentui.dev/?path=/docs/components-textarea--docs

const useStyles = makeStyles({
  small: {
    minHeight: '2.5rem',
    maxHeight: '12.5rem',
  },
  medium: {
    minHeight: '3.25rem',
    maxHeight: '16.25rem',
  },
  large: {
    minHeight: '4rem',
    maxHeight: '20rem',
  },
})

export default function useTextareaStyles (state: TextareaState) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles[state.size],
    getSlotClassNameProp_unstable(state.root),
  )
}
