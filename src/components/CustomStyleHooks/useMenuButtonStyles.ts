/* eslint-disable react-hooks/immutability */

import { MenuButtonState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'
import useButtonStyles from './useButtonStyles'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-button/library/src/components/MenuButton
//  https://react.fluentui.dev/?path=/docs/components-button-menubutton--docs

const useMenuIconStyles = makeStyles({
  small: {
    fontSize: '0.875rem',
    width: '0.875rem',
    height: '0.875rem',
  },
  medium: {
    fontSize: '0.875rem',
    width: '0.875rem',
    height: '0.875rem',
  },
  large: {
    fontSize: '1rem',
    width: '1rem',
    height: '1rem',
  },
})

export default function useMenuButtonStyles (state: MenuButtonState) {
  useButtonStyles({ ...state, iconPosition: 'before' })

  const menuIconStyles = useMenuIconStyles()

  if (state.menuIcon) {
    state.menuIcon.className = mergeClasses(
      state.menuIcon.className,
      menuIconStyles[state.size],
      getSlotClassNameProp_unstable(state.menuIcon),
    )
  }
}
