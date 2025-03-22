import { ComponentRef, forwardRef } from 'react'
import { Switch, SwitchProps, makeStyles, renderSwitch_unstable, switchClassNames, tokens, useSwitchStyles_unstable, useSwitch_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-switch/library/src/components/Switch
//  https://react.fluentui.dev/?path=/docs/components-switch--docs

const TrackHeight = '1.25rem'
const TrackWidth = '2.5rem'
const ThumbSize = '1.125rem'

const useStyles = makeStyles({
  root: {},
})

const useInputStyles = makeStyles({
  root: {
    width: `calc(${TrackWidth} + 2 * ${tokens.spacingHorizontalS})`,
    ':checked': {
      [`& ~ .${switchClassNames.indicator}`]: {
        '> *': {
          transform: `translateX(calc(${TrackWidth} - ${ThumbSize} - 0.125rem))`,
        },
      },
    },
  },
})

const useLabelStyles = makeStyles({
  root: {
    marginBottom: `calc((${TrackHeight} - ${tokens.lineHeightBase300}) / 2)`,
    marginTop: `calc((${TrackHeight} - ${tokens.lineHeightBase300}) / 2)`,
  },
})

const useIndicatorStyles = makeStyles({
  root: {
    fontSize: ThumbSize,
    height: TrackHeight,
    width: TrackWidth,
  },
})

export default forwardRef<ComponentRef<typeof Switch>, SwitchProps>(function Switch (props, ref) {
  const { className, ...rest } = props
  const state = useSwitch_unstable(rest, ref)

  useSwitchStyles_unstable(state)

  const styles = useStyles()
  const inputStyles = useInputStyles()
  const labelStyles = useLabelStyles()
  const indicatorStyles = useIndicatorStyles()

  mergeComponentClasses(state.root, styles.root, className)
  mergeComponentClasses(state.input, inputStyles.root)
  mergeComponentClasses(state.label, labelStyles.root)
  mergeComponentClasses(state.indicator, indicatorStyles.root)

  return renderSwitch_unstable(state)
})
