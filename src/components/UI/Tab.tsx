import { ComponentRef, forwardRef } from 'react'
import { Tab, TabProps, makeStyles, renderTab_unstable, useTabStyles_unstable, useTab_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-tabs/library/src/components/Tab
//  https://react.fluentui.dev/?path=/docs/components-tablist--docs

const useStyles = makeStyles({
  root: {},
})

const useIconStyles = makeStyles({
  small: {
    fontSize: '1.25rem',
    height: '1.25rem',
    width: '1.25rem',
  },
  medium: {
    fontSize: '1.25rem',
    height: '1.25rem',
    width: '1.25rem',
  },
  large: {
    fontSize: '1.5rem',
    height: '1.5rem',
    width: '1.5rem',
  },
})

export default forwardRef<ComponentRef<typeof Tab>, TabProps>(function Tab (props, ref) {
  const { className, ...rest } = props
  const state = useTab_unstable(rest, ref)

  useTabStyles_unstable(state)

  const styles = useStyles()
  const iconStyles = useIconStyles()

  mergeComponentClasses(state.root, styles.root, className)
  mergeComponentClasses(state.icon, iconStyles[state.size])

  return renderTab_unstable(state)
})
