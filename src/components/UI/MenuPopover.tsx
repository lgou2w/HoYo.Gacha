import { ComponentRef, forwardRef } from 'react'
import { MenuPopover, MenuPopoverProps, makeStyles, renderMenuPopover_unstable, useMenuPopoverStyles_unstable, useMenuPopover_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-menu/library/src/components/MenuPopover
//  https://react.fluentui.dev/?path=/docs/components-menu-menu--docs

const useStyles = makeStyles({
  root: {
    padding: '0.25rem',
    minWidth: '8.625rem',
    maxWidth: '27.375rem',
  },
})

export default forwardRef<ComponentRef<typeof MenuPopover>, MenuPopoverProps>(function MenuPopover (props, ref) {
  const { className, ...rest } = props
  const state = useMenuPopover_unstable(rest, ref)

  useMenuPopoverStyles_unstable(state)

  const styles = useStyles()

  mergeComponentClasses(state.root, styles.root, className)

  return renderMenuPopover_unstable(state)
})
