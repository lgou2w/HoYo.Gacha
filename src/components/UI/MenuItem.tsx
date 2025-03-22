import { ComponentRef, forwardRef } from 'react'
import { MenuItem, MenuItemProps, MenuItemState, makeStyles, renderMenuItem_unstable, useMenuItemStyles_unstable, useMenuItem_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-menu/library/src/components/MenuItem
//  https://react.fluentui.dev/?path=/docs/components-menu-menu--docs

const useStyles = makeStyles({
  root: {
    maxWidth: '18.125rem',
    minHeight: '2rem',
    gap: '0.25rem',
    alignItems: 'center', // HACK: start -> center
  },
})

const useIconStyles = makeStyles({
  root: {
    fontSize: '1.25rem',
    width: '1.25rem',
    height: '1.25rem',
  },
})

const useContentStyles = makeStyles({
  root: {
    paddingLeft: '0.125rem',
    paddingRight: '0.125rem',
  },
})

const useCheckmarkStyles = makeStyles({
  root: {
    marginTop: 0, // HACK: 2px -> 0
    width: '1rem',
    height: '1rem',
    '> svg': { // HACK: Apply to svg
      width: 'inherit',
      height: 'inherit',
    },
  },
})

// eslint-disable-next-line react-refresh/only-export-components
export function useMenuItemStyles (state: MenuItemState, className?: string) {
  const styles = useStyles()
  const iconStyles = useIconStyles()
  const contentStyles = useContentStyles()
  const checkmarkStyles = useCheckmarkStyles()

  mergeComponentClasses(state.root, styles.root, className)
  mergeComponentClasses(state.icon, iconStyles.root)
  mergeComponentClasses(state.content, contentStyles.root)
  mergeComponentClasses(state.checkmark, checkmarkStyles.root)

  return state
}

export default forwardRef<ComponentRef<typeof MenuItem>, MenuItemProps>(function MenuItem (props, ref) {
  const { className, ...rest } = props
  const state = useMenuItem_unstable(rest, ref)

  useMenuItemStyles_unstable(state)

  useMenuItemStyles(state, className)

  return renderMenuItem_unstable(state)
})
