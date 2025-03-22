import { ComponentRef, forwardRef } from 'react'
import { MenuItemRadio, MenuItemRadioProps, renderMenuItem_unstable, useMenuItemRadioStyles_unstable, useMenuItemRadio_unstable } from '@fluentui/react-components'
import { useMenuItemStyles } from './MenuItem'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-menu/library/src/components/MenuItemRadio
//  https://react.fluentui.dev/?path=/docs/components-menu-menu--docs

export default forwardRef<ComponentRef<typeof MenuItemRadio>, MenuItemRadioProps>(function MenuItemRadio (props, ref) {
  const { className, ...rest } = props
  const state = useMenuItemRadio_unstable(rest, ref)

  useMenuItemRadioStyles_unstable(state)

  useMenuItemStyles(state, className)

  return renderMenuItem_unstable(state)
})
