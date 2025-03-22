import { ComponentRef, forwardRef } from 'react'
import { MenuButton, MenuButtonProps, makeStyles, renderMenuButton_unstable, useMenuButtonStyles_unstable, useMenuButton_unstable } from '@fluentui/react-components'
import { useButtonStyles } from './Button'
import { mergeComponentClasses } from './utilities'

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

export default forwardRef<ComponentRef<typeof MenuButton>, MenuButtonProps>(function MenuButton (props, ref) {
  const { className, ...rest } = props
  const state = useMenuButton_unstable(rest, ref)

  useMenuButtonStyles_unstable(state)

  useButtonStyles({ ...state, iconPosition: 'before' }, className)

  const menuIconStyles = useMenuIconStyles()

  mergeComponentClasses(state.menuIcon, menuIconStyles[state.size])

  return renderMenuButton_unstable(state)
})
