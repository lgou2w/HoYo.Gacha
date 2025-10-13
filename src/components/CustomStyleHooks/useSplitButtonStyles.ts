/* eslint-disable react-hooks/immutability */

import { SplitButtonState, getSlotClassNameProp_unstable, makeStyles, mergeClasses, splitButtonClassNames } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-button/library/src/components/SplitButton
//  https://react.fluentui.dev/?path=/docs/components-button-splitbutton--docs

const useStyles = makeStyles({
  root: {
    [`& .${splitButtonClassNames.menuButton}`]: {
      minWidth: '1.5rem',
    },
  },
})

export default function useSplitButtonStyles (state: SplitButtonState) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )
}
