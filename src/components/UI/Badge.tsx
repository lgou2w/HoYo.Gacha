import { ComponentRef, forwardRef } from 'react'
import { Badge, BadgeProps, makeStyles, renderBadge_unstable, useBadgeStyles_unstable, useBadge_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-badge/library/src/components/Badge
//  https://react.fluentui.dev/?path=/docs/components-badge--docs

const useStyles = makeStyles({
  tiny: {
    width: '0.375rem',
    height: '0.375rem',
    fontSize: '0.25rem',
    lineHeight: '0.25rem',
  },
  'extra-small': {
    width: '0.625rem',
    height: '0.625rem',
    fontSize: '0.375rem',
    lineHeight: '0.375rem',
  },
  small: {
    minWidth: '1rem',
    height: '1rem',
  },
  medium: {
    minWidth: '1.25rem',
    height: '1.25rem',
  },
  large: {
    minWidth: '1.5rem',
    height: '1.5rem',
  },
  'extra-large': {
    minWidth: '2rem',
    height: '2rem',
  },
})

const useIconStyles = makeStyles({
  tiny: {
    fontSize: '0.375rem',
  },
  'extra-small': {
    fontSize: '0.625rem',
  },
  small: {
    fontSize: '0.75rem',
  },
  medium: {
    fontSize: '0.875rem',
  },
  large: {
    fontSize: '1rem',
  },
  'extra-large': {
    fontSize: '1.25rem',
  },
})

export default forwardRef<ComponentRef<typeof Badge>, BadgeProps>(function Badge (props, ref) {
  const { className, ...rest } = props
  const state = useBadge_unstable(rest, ref)

  useBadgeStyles_unstable(state)

  const styles = useStyles()
  const iconStyles = useIconStyles()

  mergeComponentClasses(state.root, styles[state.size], className)
  mergeComponentClasses(state.icon, iconStyles[state.size])

  return renderBadge_unstable(state)
})
