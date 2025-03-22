import { ComponentRef, forwardRef } from 'react'
import { Spinner, SpinnerProps, makeStyles, renderSpinner_unstable, useSpinnerStyles_unstable, useSpinner_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-spinner/library/src/components/Spinner
//  https://react.fluentui.dev/?path=/docs/components-spinner--docs

const useStyles = makeStyles({
  root: {
    gap: '0.5rem',
  },
})

const useSpinnerStyles = makeStyles({
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

export default forwardRef<ComponentRef<typeof Spinner>, SpinnerProps>(function Spinner (props, ref) {
  const { className, ...rest } = props
  const state = useSpinner_unstable(rest, ref)

  useSpinnerStyles_unstable(state)

  const styles = useStyles()
  const spinnerStyles = useSpinnerStyles()

  mergeComponentClasses(state.root, styles.root, className)
  mergeComponentClasses(state.spinner, spinnerStyles[state.size])

  return renderSpinner_unstable(state)
})
