import { MenuSplitGroupState, getSlotClassNameProp_unstable, makeStyles, menuItemClassNames, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-menu/library/src/components/MenuSplitGroup
//  https://react.fluentui.dev/?path=/docs/components-menu-menu--docs

const useStyles = makeStyles({
  root: {
    [`& > .${menuItemClassNames.root}:nth-of-type(2)`]: {
      '::before': {
        height: '1.25rem',
      },
    },
  },
})

export default function useMenuSplitGroupStyles (state: MenuSplitGroupState) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )
}
