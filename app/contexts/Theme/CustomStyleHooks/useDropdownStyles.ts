/* eslint-disable react-hooks/immutability */

import { DropdownState, getSlotClassNameProp_unstable, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-combobox/library/src/components/Dropdown
//  https://react.fluentui.dev/?path=/docs/components-dropdown--docs

const useStyles = makeStyles({
  root: {
    minWidth: '15.625rem',
  },
})

const useButtonStyles = makeStyles({
  small: {
    padding: `0.1875rem ${tokens.spacingHorizontalSNudge} 0.1875rem ${`calc(${tokens.spacingHorizontalSNudge} + ${tokens.spacingHorizontalXXS})`}`,
  },
  medium: {
    padding: `0.3125rem ${tokens.spacingHorizontalMNudge} 0.3125rem ${`calc(${tokens.spacingHorizontalMNudge} + ${tokens.spacingHorizontalXXS})`}`,
  },
  large: {
    padding: `0.4375rem ${tokens.spacingHorizontalM} 0.4375rem ${`calc(${tokens.spacingHorizontalM} + ${tokens.spacingHorizontalSNudge})`}`,
  },
})

const useExpandIconStyles = makeStyles({
  small: {
    fontSize: '1rem',
  },
  medium: {
    fontSize: '1.25rem',
  },
  large: {
    fontSize: '1.5rem',
  },
})

const useListboxStyles = makeStyles({
  root: {
    minWidth: '10rem',
  },
})

export default function useDropdownStyles (state: DropdownState) {
  const styles = useStyles()
  const buttonStyles = useButtonStyles()
  const expandIconStyles = useExpandIconStyles()
  const listboxStyles = useListboxStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )

  state.button.className = mergeClasses(
    state.button.className,
    buttonStyles[state.size],
    getSlotClassNameProp_unstable(state.button),
  )

  if (state.expandIcon) {
    state.expandIcon.className = mergeClasses(
      state.expandIcon.className,
      expandIconStyles[state.size],
      getSlotClassNameProp_unstable(state.expandIcon),
    )
  }

  if (state.listbox) {
    state.listbox.className = mergeClasses(
      state.listbox.className,
      listboxStyles.root,
      getSlotClassNameProp_unstable(state.listbox),
    )
  }
}
