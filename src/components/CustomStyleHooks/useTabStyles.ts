import { TabState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-tabs/library/src/components/Tab
//  https://react.fluentui.dev/?path=/docs/components-tablist--docs

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

export default function useTabStyles (state: TabState) {
  const iconStyles = useIconStyles()

  if (state.icon) {
    state.icon.className = mergeClasses(
      state.icon.className,
      iconStyles[state.size],
      getSlotClassNameProp_unstable(state.icon),
    )
  }
}
