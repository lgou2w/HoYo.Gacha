/* eslint-disable react-hooks/immutability */

import { CheckboxState, getSlotClassNameProp_unstable, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-checkbox/library/src/components/Checkbox
//  https://react.fluentui.dev/?path=/docs/components-checkbox--docs

const IndicatorSizeMedium = '1rem'
const IndicatorSizeLarge = '1.25rem'

const useInputStyles = makeStyles({
  medium: {
    width: `calc(${IndicatorSizeMedium} + 2 * ${tokens.spacingHorizontalS})`,
  },
  large: {
    width: `calc(${IndicatorSizeLarge} + 2 * ${tokens.spacingHorizontalS})`,
  },
})

const useIndicatorStyles = makeStyles({
  medium: {
    fontSize: '0.75rem',
    height: IndicatorSizeMedium,
    width: IndicatorSizeMedium,
    '> svg': {
      width: '0.75rem',
      height: '0.75rem',
    },
  },
  large: {
    fontSize: '1rem',
    height: IndicatorSizeLarge,
    width: IndicatorSizeLarge,
    '> svg': {
      width: '1rem',
      height: '1rem',
    },
  },
})

const useLabelStyles = makeStyles({
  medium: {
    marginTop: `calc((${IndicatorSizeMedium} - ${tokens.lineHeightBase300}) / 2)`,
    marginBottom: `calc((${IndicatorSizeMedium} - ${tokens.lineHeightBase300}) / 2)`,
  },
  large: {
    marginTop: `calc((${IndicatorSizeLarge} - ${tokens.lineHeightBase300}) / 2)`,
    marginBottom: `calc((${IndicatorSizeLarge} - ${tokens.lineHeightBase300}) / 2)`,
  },
})

export default function useCheckboxStyles (state: CheckboxState) {
  const inputStyles = useInputStyles()
  const indicatorStyles = useIndicatorStyles()
  const labelStyles = useLabelStyles()

  state.input.className = mergeClasses(
    state.input.className,
    inputStyles[state.size],
    getSlotClassNameProp_unstable(state.input),
  )

  if (state.indicator) {
    state.indicator.className = mergeClasses(
      state.indicator.className,
      indicatorStyles[state.size],
      getSlotClassNameProp_unstable(state.indicator),
    )
  }

  if (state.label) {
    state.label.className = mergeClasses(
      state.label.className,
      labelStyles[state.size],
      getSlotClassNameProp_unstable(state.label),
    )
  }
}
