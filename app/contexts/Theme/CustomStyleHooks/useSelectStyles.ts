/* eslint-disable react-hooks/immutability */

import { SelectState, getSlotClassNameProp_unstable, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-select/library/src/components/Select
//  https://react.fluentui.dev/?path=/docs/components-select--docs

const IconSizes = {
  small: '1rem',
  medium: '1.25rem',
  large: '1.5rem',
}

const useInnerStyles = makeStyles({
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

export default function useSelectStyles (state: SelectState) {
  const innerStyles = useInnerStyles()
  const iconStyles = useIconStyles()

  state.select.className = mergeClasses(
    state.select.className,
    innerStyles[state.size],
    getSlotClassNameProp_unstable(state.select),
  )

  if (state.icon) {
    state.icon.className = mergeClasses(
      state.icon.className,
      iconStyles[state.size],
      getSlotClassNameProp_unstable(state.icon),
    )
  }
}
