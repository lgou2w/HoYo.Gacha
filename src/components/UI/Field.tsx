import { ComponentRef, forwardRef } from 'react'
import { Field, FieldProps, makeStyles, renderField_unstable, tokens, useFieldContextValues_unstable, useFieldStyles_unstable, useField_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-field/library/src/components/Field
//  https://react.fluentui.dev/?path=/docs/components-field--docs

const useStyles = makeStyles({
  root: {},
})

const useValidationMessageStyles = makeStyles({
  root: {
    display: 'inline-flex',
    alignItems: 'center',
  },
  withIcon: {
    paddingLeft: `calc(0.75rem + ${tokens.spacingHorizontalXS})`,
  },
})

const useValidationMessageIconStyles = makeStyles({
  root: {
    marginLeft: `calc(-0.75rem - ${tokens.spacingHorizontalXS})`,
    fontSize: '0.75rem',
    width: '0.75rem',
    height: '0.75rem',
    '> svg': {
      width: 'inherit',
      height: 'inherit',
    },
  },
})

export default forwardRef<ComponentRef<typeof Field>, FieldProps>(function Field (props, ref) {
  const { className, ...rest } = props
  const state = useField_unstable(rest, ref)
  const contextValues = useFieldContextValues_unstable(state)

  useFieldStyles_unstable(state)

  const styles = useStyles()
  const validationMessageStyles = useValidationMessageStyles()
  const validationMessageIconStyles = useValidationMessageIconStyles()

  mergeComponentClasses(state.root, styles.root, className)
  mergeComponentClasses(state.validationMessage,
    validationMessageStyles.root,
    !!state.validationMessageIcon && validationMessageStyles.withIcon,
  )
  mergeComponentClasses(state.validationMessageIcon, validationMessageIconStyles.root)

  return renderField_unstable(state, contextValues)
})
