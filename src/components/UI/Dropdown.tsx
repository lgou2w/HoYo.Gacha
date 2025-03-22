import { ComponentRef, forwardRef } from 'react'
import { Dropdown, DropdownProps, makeStyles, renderDropdown_unstable, tokens, useComboboxContextValues, useDropdownStyles_unstable, useDropdown_unstable } from '@fluentui/react-components'
import { mergeComponentClasses } from './utilities'

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

export default forwardRef<ComponentRef<typeof Dropdown>, DropdownProps>(function Dropdown (props, ref) {
  const { className, ...rest } = props
  const state = useDropdown_unstable(rest, ref)
  const contextValues = useComboboxContextValues(state)

  useDropdownStyles_unstable(state)

  const styles = useStyles()
  const buttonStyles = useButtonStyles()
  const expandIconStyles = useExpandIconStyles()
  const listboxStyles = useListboxStyles()

  mergeComponentClasses(state.root, styles.root, className)
  mergeComponentClasses(state.button, buttonStyles[state.size])
  mergeComponentClasses(state.expandIcon, expandIconStyles[state.size])
  mergeComponentClasses(state.listbox, listboxStyles.root)

  return renderDropdown_unstable(state, contextValues)
})
