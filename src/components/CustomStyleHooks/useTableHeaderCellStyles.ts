import { TableHeaderCellState, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/blob/master/packages/react-components/react-table/library/src/components/TableCell
//  https://react.fluentui.dev/?path=/docs/components-table--docs

const useStyles = makeStyles({
  button: {
    minHeight: '2rem',
  },
})

export default function useTableHeaderCellStyles (state: TableHeaderCellState) {
  const styles = useStyles()

  state.button.className = mergeClasses(
    state.button.className,
    styles.button,
    getSlotClassNameProp_unstable(state.button),
  )
}
