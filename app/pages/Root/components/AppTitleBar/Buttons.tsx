import { ComponentProps, MouseEventHandler, ReactElement, useCallback, useEffect, useState } from 'react'
import { Button as FluentButton, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { DismissFilled, MaximizeFilled, SquareMultipleRegular, SubtractFilled } from '@fluentui/react-icons'
import { UnlistenFn } from '@tauri-apps/api/event'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import debounce from '@/utilities/debounce'

const useButtonStyles = makeStyles({
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

interface ButtonProps {
  state: keyof Omit<ReturnType<typeof useButtonStyles>, 'root'>
  icon: ReactElement
  onClick: MouseEventHandler<HTMLButtonElement>
}

function Button (props: ButtonProps) {
  const { state, onClick, icon } = props
  const styles = useButtonStyles()

  return (
    <FluentButton
      className={mergeClasses(styles.root, styles[state])}
      shape="square"
      icon={icon}
      onClick={onClick}
    />
  )
}

function MinimizeButton () {
  return (
    <Button
      state="normal"
      icon={<SubtractFilled />}
      onClick={() => getCurrentWebviewWindow().minimize()}
    />
  )
}

function CloseButton () {
  return (
    <Button
      state="danger"
      icon={<DismissFilled />}
      onClick={() => getCurrentWebviewWindow().close()}
    />
  )
}

function MaximizeButton () {
  const [maximized, setMaximized] = useState(false)
  const updateMaximized = useCallback(async () => {
    const isMaximized = await getCurrentWebviewWindow().isMaximized()
    setMaximized(isMaximized)
  }, [])

  // Watch for window resize to update maximized state
  useEffect(() => {
    let unlisten: UnlistenFn
    ;(async () => {
      unlisten = await getCurrentWebviewWindow().onResized(
        debounce(updateMaximized, 500, { immediate: false }),
      )
    })()

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [updateMaximized])

  return (
    <Button
      state="normal"
      icon={!maximized ? <MaximizeFilled /> : <SquareMultipleRegular />}
      onClick={() => getCurrentWebviewWindow().toggleMaximize()}
    />
  )
}

export default function Buttons (props: Omit<ComponentProps<'div'>, 'children'>) {
  return (
    <div {...props}>
      <MinimizeButton />
      <MaximizeButton />
      <CloseButton />
    </div>
  )
}
