/* eslint-disable react-hooks/immutability */

import { ButtonState, getSlotClassNameProp_unstable, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-button/library/src/components/Button
//  https://react.fluentui.dev/?path=/docs/components-button-button--docs

const useStyles = makeStyles({
  small: {
    minWidth: '4rem',
    padding: `0.1875rem ${tokens.spacingHorizontalS}`,
  },
  medium: {
    minWidth: '6rem',
    padding: `0.3125rem ${tokens.spacingHorizontalM}`,
  },
  large: {
    minWidth: '6rem',
    padding: `0.5rem ${tokens.spacingHorizontalL}`,
  },
})

const useIconOnlyStyles = makeStyles({
  small: {
    padding: '0.0625rem',
    minWidth: '1.5rem',
    maxWidth: '1.5rem',
  },
  medium: {
    padding: '0.3125rem',
    minWidth: '2rem',
    maxWidth: '2rem',
  },
  large: {
    padding: '0.4375rem',
    minWidth: '2.5rem',
    maxWidth: '2.5rem',
  },
})

const useIconStyles = makeStyles({
  small: {
    fontSize: '1.25rem',
    width: '1.25rem',
    height: '1.25rem',
  },
  medium: {
    fontSize: '1.25rem',
    width: '1.25rem',
    height: '1.25rem',
  },
  large: {
    fontSize: '1.5rem',
    width: '1.5rem',
    height: '1.5rem',
  },
})

export default function useButtonStyles (state: ButtonState) {
  const styles = useStyles()
  const iconOnlyStyles = useIconOnlyStyles()
  const iconStyles = useIconStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles[state.size],
    state.iconOnly && iconOnlyStyles[state.size],
    getSlotClassNameProp_unstable(state.root),
  )

  if (state.icon) {
    state.icon.className = mergeClasses(
      state.icon.className,
      iconStyles[state.size],
      getSlotClassNameProp_unstable(state.icon),
    )
  }
}
