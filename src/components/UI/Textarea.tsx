import { ComponentRef, forwardRef } from 'react'
import { Textarea, TextareaProps, makeStyles, renderTextarea_unstable, useTextareaStyles_unstable, useTextarea_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

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

export default forwardRef<ComponentRef<typeof Textarea>, TextareaProps>(function Textarea (props, ref) {
  const { className, ...rest } = props
  const state = useTextarea_unstable(rest, ref)

  useTextareaStyles_unstable(state)

  const styles = useStyles()

  mergeComponentClasses(state.root, styles[state.size], className)

  return renderTextarea_unstable(state)
})
