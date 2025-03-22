import { ComponentRef, forwardRef } from 'react'
import { MenuGroupHeader, MenuGroupHeaderProps, makeStyles, renderMenuGroupHeader_unstable, useMenuGroupHeaderStyles_unstable, useMenuGroupHeader_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

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

export default forwardRef<ComponentRef<typeof MenuGroupHeader>, MenuGroupHeaderProps>(function MenuGroupHeader (props, ref) {
  const { className, ...rest } = props
  const state = useMenuGroupHeader_unstable(rest, ref)

  useMenuGroupHeaderStyles_unstable(state)

  const styles = useStyles()

  mergeComponentClasses(state.root, styles.root, className)

  return renderMenuGroupHeader_unstable(state)
})
