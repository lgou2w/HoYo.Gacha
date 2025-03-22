import { ComponentRef, forwardRef } from 'react'
import { SplitButton, SplitButtonProps, makeStyles, renderSplitButton_unstable, slot, useSplitButtonStyles_unstable, useSplitButton_unstable } from '@fluentui/react-components'
import Button from '@/components/UI/Button'
import MenuButton from '@/components/UI/MenuButton'
import { mergeComponentClasses } from './utilities'

// This component reimplemented the Fluent UI rendering in order to override some of the default styles.
// See:
//  https://github.com/microsoft/fluentui/tree/master/packages/react-components/react-button/library/src/components/SplitButton
//  https://react.fluentui.dev/?path=/docs/components-button-splitbutton--docs

const useStyles = makeStyles({
  root: {},
})

const useMenuButtonStyles = makeStyles({
  root: {
    minWidth: '1.5rem',
  },
})

export default forwardRef<ComponentRef<typeof SplitButton>, SplitButtonProps>(function SplitButton (props, ref) {
  const { className, ...rest } = props
  const state = useSplitButton_unstable(rest, ref)

  state.components.primaryActionButton = Button
  state.primaryActionButton = slot.optional(state.primaryActionButton, {
    defaultProps: state.primaryActionButton,
    renderByDefault: true,
    elementType: Button,
  })

  state.components.menuButton = MenuButton
  state.menuButton = slot.optional(state.menuButton, {
    defaultProps: state.menuButton,
    renderByDefault: true,
    elementType: MenuButton,
  })

  useSplitButtonStyles_unstable(state)

  const styles = useStyles()
  const menuButtonStyles = useMenuButtonStyles()

  mergeComponentClasses(state.root, styles.root, className)
  mergeComponentClasses(state.menuButton, menuButtonStyles.root)

  return renderSplitButton_unstable(state)
})
