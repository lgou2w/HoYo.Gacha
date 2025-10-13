/* eslint-disable react-hooks/immutability */

import { FieldState, getSlotClassNameProp_unstable, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-field/library/src/components/Field
//  https://react.fluentui.dev/?path=/docs/components-field--docs

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

export default function useFieldStyles (state: FieldState) {
  const validationMessageStyles = useValidationMessageStyles()
  const validationMessageIconStyles = useValidationMessageIconStyles()

  if (state.validationMessage) {
    state.validationMessage.className = mergeClasses(
      state.validationMessage.className,
      validationMessageStyles.root,
      !!state.validationMessageIcon && validationMessageStyles.withIcon,
      getSlotClassNameProp_unstable(state.validationMessage),
    )
  }

  if (state.validationMessageIcon) {
    state.validationMessageIcon.className = mergeClasses(
      state.validationMessageIcon.className,
      validationMessageIconStyles.root,
      getSlotClassNameProp_unstable(state.validationMessageIcon),
    )
  }
}
