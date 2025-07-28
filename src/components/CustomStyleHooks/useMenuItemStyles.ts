import { MenuItemState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

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

const useSubmenuIndicatorStyles = makeStyles({
  root: {
    width: '1.25rem',
    height: '1.25rem',
    fontSize: '1.25rem',
  },
})

export default function useMenuItemStyles (state: MenuItemState) {
  const styles = useStyles()
  const iconStyles = useIconStyles()
  const contentStyles = useContentStyles()
  const checkmarkStyles = useCheckmarkStyles()
  const submenuIndicatorStyles = useSubmenuIndicatorStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )

  if (state.icon) {
    state.icon.className = mergeClasses(
      state.icon.className,
      iconStyles.root,
      getSlotClassNameProp_unstable(state.icon),
    )
  }

  if (state.content) {
    state.content.className = mergeClasses(
      state.content.className,
      contentStyles.root,
      getSlotClassNameProp_unstable(state.content),
    )
  }

  if (state.checkmark) {
    state.checkmark.className = mergeClasses(
      state.checkmark.className,
      checkmarkStyles.root,
      getSlotClassNameProp_unstable(state.checkmark),
    )
  }

  if (state.submenuIndicator) {
    state.submenuIndicator.className = mergeClasses(
      state.submenuIndicator.className,
      submenuIndicatorStyles.root,
      getSlotClassNameProp_unstable(state.submenuIndicator),
    )
  }
}
