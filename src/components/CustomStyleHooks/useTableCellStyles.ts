/* eslint-disable react-hooks/immutability */

import { TableCellState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-table/library/src/components/TableCell
//  https://react.fluentui.dev/?path=/docs/components-table--docs

const useTableLayoutStyles = makeStyles({
  medium: {
    height: '2.75rem',
  },
  small: {
    height: '2.125rem',
  },
  'extra-small': {
    height: '1.5rem',
  },
})

const useFlexLayoutStyles = makeStyles({
  medium: {
    minHeight: '2.75rem',
  },
  small: {
    minHeight: '2.125rem',
  },
  'extra-small': {
    minHeight: '1.5rem',
  },
})

export default function useTableCellStyles (state: TableCellState) {
  const layoutStyles = {
    table: useTableLayoutStyles(),
    flex: useFlexLayoutStyles(),
  }

  state.root.className = mergeClasses(
    state.root.className,
    state.noNativeElements ? layoutStyles.flex[state.size] : layoutStyles.table[state.size],
    getSlotClassNameProp_unstable(state.root),
  )
}
