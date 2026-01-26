/* eslint-disable react-hooks/immutability */

import { SwitchState, getSlotClassNameProp_unstable, makeStyles, mergeClasses, switchClassNames, tokens } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-switch/library/src/components/Switch
//  https://react.fluentui.dev/?path=/docs/components-switch--docs

const TrackHeightMedium = '1.25rem'
const TrackWidthMedium = '2.5rem'
const ThumbSizeMedium = '1.125rem'
const TrackHeightSmall = '1rem'
const TrackWidthSmall = '2rem'
const ThumbSizeSmall = '0.875rem'

const useInputStyles = makeStyles({
  medium: {
    width: `calc(${TrackWidthMedium} + 2 * ${tokens.spacingHorizontalS})`,
    ':checked': {
      [`& ~ .${switchClassNames.indicator}`]: {
        '> *': {
          transform: `translateX(calc(${TrackWidthMedium} - ${ThumbSizeMedium} - 0.125rem))`,
        },
      },
    },
  },
  small: {
    width: `calc(${TrackWidthSmall} + 2 * ${tokens.spacingHorizontalS})`,
    ':checked': {
      [`& ~ .${switchClassNames.indicator}`]: {
        '> *': {
          transform: `translateX(calc(${TrackWidthSmall} - ${ThumbSizeSmall} - 0.125rem))`,
        },
      },
    },
  },
})

const useLabelStyles = makeStyles({
  medium: {
    marginBottom: `calc((${TrackHeightMedium} - ${tokens.lineHeightBase300}) / 2)`,
    marginTop: `calc((${TrackHeightMedium} - ${tokens.lineHeightBase300}) / 2)`,
  },
  small: {
    marginBottom: `calc((${TrackHeightSmall} - ${tokens.lineHeightBase200}) / 2)`,
    marginTop: `calc((${TrackHeightSmall} - ${tokens.lineHeightBase200}) / 2)`,
  },
})

const useIndicatorStyles = makeStyles({
  medium: {
    fontSize: ThumbSizeMedium,
    height: TrackHeightMedium,
    width: TrackWidthMedium,
  },
  small: {
    fontSize: ThumbSizeSmall,
    height: TrackHeightSmall,
    width: TrackWidthSmall,
  },
})

export default function useSwitchStyles (state: SwitchState) {
  const inputStyles = useInputStyles()
  const labelStyles = useLabelStyles()
  const indicatorStyles = useIndicatorStyles()

  state.input.className = mergeClasses(
    state.input.className,
    inputStyles[state.size],
  )

  if (state.label) {
    state.label.className = mergeClasses(
      state.label.className,
      labelStyles[state.size],
      getSlotClassNameProp_unstable(state.label),
    )
  }

  state.indicator.className = mergeClasses(
    state.indicator.className,
    indicatorStyles[state.size],
    getSlotClassNameProp_unstable(state.indicator),
  )
}
