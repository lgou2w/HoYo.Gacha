import { ComponentRef, forwardRef } from 'react'
import { Input, InputProps, makeStyles, renderInput_unstable, useInputStyles_unstable, useInput_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

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

export default forwardRef<ComponentRef<typeof Input>, InputProps>(function Input (props, ref) {
  const { className, ...rest } = props
  const state = useInput_unstable(rest, ref)

  useInputStyles_unstable(state)

  const styles = useStyles()
  const contentStyles = useContentStyles()

  mergeComponentClasses(state.root, styles[state.size], className)
  mergeComponentClasses(state.contentBefore, contentStyles[state.size])
  mergeComponentClasses(state.contentAfter, contentStyles[state.size])

  return renderInput_unstable(state)
})
