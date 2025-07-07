import { MenuGroupHeaderState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-menu/library/src/components/MenuGroupHeader
//  https://react.fluentui.dev/?path=/docs/components-menu-menu--docs

const useStyles = makeStyles({
  root: {
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
    height: '2rem',
  },
})

export default function useMenuGroupHeaderStyles (state: MenuGroupHeaderState) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )
}
