import { ComponentRef, forwardRef } from 'react'
import { Radio, RadioProps, makeStyles, renderRadio_unstable, tokens, useRadioStyles_unstable, useRadio_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-radio/library/src/components/Radio
//  https://react.fluentui.dev/?path=/docs/components-radiogroup--docs

const IndicatorSize = '1rem'

const useStyles = makeStyles({
  root: {},
})

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

export default forwardRef<ComponentRef<typeof Radio>, RadioProps>(function Radio (props, ref) {
  const { className, ...rest } = props
  const state = useRadio_unstable(rest, ref)

  useRadioStyles_unstable(state)

  const styles = useStyles()
  const inputStyles = useInputStyles()
  const indicatorStyles = useIndicatorStyles()
  const labelStyles = useLabelStyles()

  mergeComponentClasses(state.input, styles.root, className)
  mergeComponentClasses(
    state.input,
    inputStyles.root,
    state.labelPosition === 'below' && inputStyles.below,
  )
  mergeComponentClasses(state.indicator, indicatorStyles.root)
  mergeComponentClasses(state.label, labelStyles[state.labelPosition])

  return renderRadio_unstable(state)
})
