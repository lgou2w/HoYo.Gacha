import { ToasterState, getSlotClassNameProp_unstable, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-toast/library/src/components/Toaster
//  https://react.fluentui.dev/?path=/docs/components-toast--docs

const useStyles = makeStyles({
  root: {
    // [`& .${toastContainerClassNames.root}`]: {}, // No export!
    '& .fui-ToastContainer': {
      marginTop: tokens.spacingVerticalM,
    },
  },
})

export default function useToasterStyles (state: ToasterState) {
  const styles = useStyles()

  ;([
    state.bottom,
    state.bottomStart,
    state.bottomEnd,
    state.topStart,
    state.topEnd,
    state.top,
  ] as Array<{ className?: string } | undefined>
  ).forEach((container) => {
    if (container) {
      container.className = mergeClasses(
        container.className,
        styles.root,
        getSlotClassNameProp_unstable(container),
      )
    }
  })
}
