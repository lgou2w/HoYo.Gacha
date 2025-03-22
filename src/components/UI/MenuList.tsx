import { ComponentRef, forwardRef } from 'react'
import { MenuList, MenuListProps, makeStyles, renderMenuList_unstable, useMenuListContextValues_unstable, useMenuListStyles_unstable, useMenuList_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-menu/library/src/components/MenuList
//  https://react.fluentui.dev/?path=/docs/components-menu-menulist--docs

export type { MenuListProps }

const useStyles = makeStyles({
  root: {
    gap: '0.125rem',
  },
})

export default forwardRef<ComponentRef<typeof MenuList>, MenuListProps>(function MenuList (props, ref) {
  const { className, ...rest } = props
  const state = useMenuList_unstable(rest, ref)
  const contextValues = useMenuListContextValues_unstable(state)

  useMenuListStyles_unstable(state)

  const styles = useStyles()

  mergeComponentClasses(state.root, styles.root, className)

  return renderMenuList_unstable(state, contextValues)
})
