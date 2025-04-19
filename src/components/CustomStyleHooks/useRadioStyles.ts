import { RadioState, getSlotClassNameProp_unstable, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-radio/library/src/components/Radio
//  https://react.fluentui.dev/?path=/docs/components-radiogroup--docs

const IndicatorSize = '1rem'

const useInputStyles = makeStyles({
  root: {
    width: `calc(${IndicatorSize} + 2 * ${tokens.spacingHorizontalS})`,
  },
  below: {
    height: `calc(${IndicatorSize} + 2 * ${tokens.spacingVerticalS})`,
  },
})

const useIndicatorStyles = makeStyles({
  root: {
    width: IndicatorSize,
    height: IndicatorSize,
    fontSize: '0.75rem',
    '::after': {
      width: IndicatorSize,
      height: IndicatorSize,
    },
  },
})

const useLabelStyles = makeStyles({
  after: {
    marginTop: `calc((${IndicatorSize} - ${tokens.lineHeightBase300}) / 2)`,
    marginBottom: `calc((${IndicatorSize} - ${tokens.lineHeightBase300}) / 2)`,
  },
  below: {},
})

export default function useRadioStyles (state: RadioState) {
  const inputStyles = useInputStyles()
  const indicatorStyles = useIndicatorStyles()
  const labelStyles = useLabelStyles()

  state.input.className = mergeClasses(
    state.input.className,
    inputStyles.root,
    state.labelPosition === 'below' && inputStyles.below,
  )

  state.indicator.className = mergeClasses(
    state.indicator.className,
    indicatorStyles.root,
    getSlotClassNameProp_unstable(state.indicator),
  )

  if (state.label) {
    state.label.className = mergeClasses(
      state.label.className,
      labelStyles[state.labelPosition],
      getSlotClassNameProp_unstable(state.label),
    )
  }
}
