import { SwitchState, getSlotClassNameProp_unstable, makeStyles, mergeClasses, switchClassNames, tokens } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-switch/library/src/components/Switch
//  https://react.fluentui.dev/?path=/docs/components-switch--docs

const TrackHeight = '1.25rem'
const TrackWidth = '2.5rem'
const ThumbSize = '1.125rem'

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

export default function useSwitchStyles (state: SwitchState) {
  const inputStyles = useInputStyles()
  const labelStyles = useLabelStyles()
  const indicatorStyles = useIndicatorStyles()

  state.input.className = mergeClasses(
    state.input.className,
    inputStyles.root,
  )

  if (state.label) {
    state.label.className = mergeClasses(
      state.label.className,
      labelStyles.root,
      getSlotClassNameProp_unstable(state.label),
    )
  }

  state.indicator.className = mergeClasses(
    state.indicator.className,
    indicatorStyles.root,
    getSlotClassNameProp_unstable(state.indicator),
  )
}
