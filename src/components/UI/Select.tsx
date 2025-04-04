import { ComponentRef, forwardRef } from 'react'
import { Select, SelectProps, makeStyles, renderSelect_unstable, tokens, useSelectStyles_unstable, useSelect_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-select/library/src/components/Select
//  https://react.fluentui.dev/?path=/docs/components-select--docs

const IconSizes = {
  small: '1rem',
  medium: '1.25rem',
  large: '1.5rem',
}

const useStyles = makeStyles({
  root: {},
})

const useSelectStyles = makeStyles({
  small: {
    height: '1.5rem',
    paddingRight: `calc(${tokens.spacingHorizontalSNudge}
      + ${IconSizes.small}
      + ${tokens.spacingHorizontalXXS}
      + ${tokens.spacingHorizontalXXS})`,
  },
  medium: {
    height: '2rem',
    paddingRight: `calc(${tokens.spacingHorizontalMNudge}
      + ${IconSizes.medium}
      + ${tokens.spacingHorizontalXXS}
      + ${tokens.spacingHorizontalXXS})`,
  },
  large: {
    height: '2.5rem',
    paddingRight: `calc(${tokens.spacingHorizontalM}
      + ${IconSizes.large}
      + ${tokens.spacingHorizontalSNudge}
      + ${tokens.spacingHorizontalSNudge})`,
  },
})

const useIconStyles = makeStyles({
  small: {
    width: IconSizes.small,
    height: IconSizes.small,
    fontSize: IconSizes.small,
  },
  medium: {
    width: IconSizes.medium,
    height: IconSizes.medium,
    fontSize: IconSizes.medium,
  },
  large: {
    width: IconSizes.large,
    height: IconSizes.large,
    fontSize: IconSizes.large,
  },
})

export default forwardRef<ComponentRef<typeof Select>, SelectProps>(function Select (props, ref) {
  const { className, ...rest } = props
  const state = useSelect_unstable(rest, ref)

  useSelectStyles_unstable(state)

  const styles = useStyles()
  const selectStyles = useSelectStyles()
  const iconStyles = useIconStyles()

  mergeComponentClasses(state.root, styles.root, className)
  mergeComponentClasses(state.select, selectStyles[state.size])
  mergeComponentClasses(state.icon, iconStyles[state.size])

  return renderSelect_unstable(state)
})
