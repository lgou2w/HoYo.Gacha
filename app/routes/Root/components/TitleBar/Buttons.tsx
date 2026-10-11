import { ComponentProps, MouseEventHandler, ReactElement } from 'react'
import { Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { DismissFilled, MaximizeFilled, SquareMultipleRegular, SubtractFilled } from '@fluentui/react-icons'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import useIsMaximized from '@/hooks/useIsMaximized'
import useRunTauri from '@/hooks/useRunTauri'

export default function Buttons (props: Omit<ComponentProps<'div'>, 'children'>) {
  return (
    <div {...props}>
      <MinimizeButton />
      <MaximizeButton />
      <CloseButton />
    </div>
  )
}

const useTitleButtonStyles = makeStyles({
  root: {
    height: 'inherit',
    minWidth: '2.8rem',
    backgroundColor: tokens.colorTransparentBackground,
    border: 0,
    ':hover': { color: tokens.colorNeutralForegroundOnBrand },
    ':hover:active': { color: tokens.colorNeutralForegroundOnBrand },
  },
  normal: {
    ':hover': { backgroundColor: tokens.colorBrandBackgroundHover },
    ':hover:active': { backgroundColor: tokens.colorBrandBackgroundPressed },
  },
  danger: {
    ':hover': { backgroundColor: tokens.colorStatusDangerBackground3 },
    ':hover:active': { backgroundColor: tokens.colorStatusDangerBackground2 },
  },
})

interface TitleButtonProps {
  state: keyof Omit<ReturnType<typeof useTitleButtonStyles>, 'root'>
  icon: ReactElement
  onClick?: MouseEventHandler<HTMLButtonElement>
}

function TitleButton (props: TitleButtonProps) {
  const { state, onClick, icon } = props
  const styles = useTitleButtonStyles()

  return (
    <Button
      className={mergeClasses(styles.root, styles[state])}
      shape="square"
      icon={icon}
      onClick={onClick}
    />
  )
}

function MinimizeButton () {
  const onClick = useRunTauri(() => getCurrentWebviewWindow().minimize())
  return (
    <TitleButton
      state="normal"
      icon={<SubtractFilled />}
      onClick={onClick}
    />
  )
}

function CloseButton () {
  const onClick = useRunTauri(() => getCurrentWebviewWindow().close())
  return (
    <TitleButton
      state="danger"
      icon={<DismissFilled />}
      onClick={onClick}
    />
  )
}

function MaximizeButton () {
  const isMaximized = useIsMaximized()
  const onClick = useRunTauri(() => getCurrentWebviewWindow().toggleMaximize())

  return (
    <TitleButton
      state="normal"
      icon={!isMaximized ? <MaximizeFilled /> : <SquareMultipleRegular />}
      onClick={onClick}
    />
  )
}
