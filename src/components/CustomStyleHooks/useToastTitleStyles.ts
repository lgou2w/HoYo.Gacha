/* eslint-disable react-hooks/immutability */

import { ToastTitleState, getSlotClassNameProp_unstable, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-toast/library/src/components/ToastTitle
//  https://react.fluentui.dev/?path=/docs/components-toast--docs

const useMediaStyles = makeStyles({
  root: {
    paddingTop: 0, // 1px -> 0
    paddingRight: tokens.spacingHorizontalS,
    fontSize: tokens.lineHeightBase300,
  },
})

const useActionStyles = makeStyles({
  root: {
    paddingLeft: tokens.spacingHorizontalM,
    alignItems: 'center',
  },
})

export default function useToastTitleStyles (state: ToastTitleState) {
  const mediaStyles = useMediaStyles()
  const actionStyles = useActionStyles()

  if (state.media) {
    state.media.className = mergeClasses(
      state.media.className,
      mediaStyles.root,
      getSlotClassNameProp_unstable(state.media),
    )
  }

  if (state.action) {
    state.action.className = mergeClasses(
      state.action.className,
      actionStyles.root,
      getSlotClassNameProp_unstable(state.action),
    )
  }
}
