import { MenuItemRadioState } from '@fluentui/react-components'
import useMenuItemStyles from './useMenuItemStyles'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-menu/library/src/components/MenuItemRadio
//  https://react.fluentui.dev/?path=/docs/components-menu-menu--docs

export default function useMenuItemRadioStyles (state: MenuItemRadioState) {
  useMenuItemStyles(state)
}
