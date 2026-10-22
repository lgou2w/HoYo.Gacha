/* eslint-disable react-hooks/immutability */

import { ComponentState, Slot, getSlotClassNameProp_unstable, makeStyles, mergeClasses } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-toast/library/src/components/ToasterContainer
//  https://storybooks.fluentui.dev/react/?path=/docs/components-toast--docs

const useStyles = makeStyles({
  root: {
    marginTop: '1rem',
  },
})

export default function useToastContainerStyles (
  /* Because No export! */
  state: ComponentState<{ root: NonNullable<Slot<'div'>> }>,
) {
  const styles = useStyles()

  state.root.className = mergeClasses(
    state.root.className,
    styles.root,
    getSlotClassNameProp_unstable(state.root),
  )
}
