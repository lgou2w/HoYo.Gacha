import React, { useCallback, useEffect, useState } from 'react'
import { Button, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { DismissFilled, MaximizeFilled, SquareMultipleRegular, SubtractFilled } from '@fluentui/react-icons'
import { WebviewWindow, getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import debounce from 'debounce'

const useStyles = makeStyles({
  root: {
    marginLeft: 'auto',
    flexShrink: 0,
  },
  button: {
    height: 'inherit',
    minWidth: '2.8rem',
    backgroundColor: tokens.colorTransparentBackground,
    border: 0,
    ':hover': { color: tokens.colorNeutralForegroundOnBrand },
    ':hover:active': { color: tokens.colorNeutralForegroundOnBrand },
  },
  buttonNormal: {
    ':hover': { backgroundColor: tokens.colorBrandBackgroundHover },
    ':hover:active': { backgroundColor: tokens.colorBrandBackgroundPressed },
  },
  buttonDanger: {
    ':hover': { backgroundColor: tokens.colorStatusDangerBackground3 },
    ':hover:active': { backgroundColor: tokens.colorStatusDangerBackground2 },
  },
})

type TitleBarButtonsProps = Omit<React.JSX.IntrinsicElements['div'], 'children'>

export default function TitleBarButtons (props: TitleBarButtonsProps) {
  const { className, ...rest } = props
  const styles = useStyles()
  const [maximized, setMaximized] = useState(false)
  const updateMaximized = useCallback(async () => {
    const isMaximized = await getCurrentWebviewWindow().isMaximized()
    setMaximized(isMaximized)
  }, [])

  useEffect(() => {
    let unlisten: Awaited<ReturnType<WebviewWindow['onResized']>>
    ;(async () => {
      unlisten = await getCurrentWebviewWindow().onResized(
        debounce(updateMaximized, 500, { immediate: false }))
    })()

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [updateMaximized])

  return (
    <div className={mergeClasses(styles.root, className)} {...rest}>
      <Button
        className={mergeClasses(styles.button, styles.buttonNormal)}
        icon={<SubtractFilled />}
        onClick={() => getCurrentWebviewWindow().minimize()}
        shape="square"
      />
      <Button
        className={mergeClasses(styles.button, styles.buttonNormal)}
        icon={!maximized ? <MaximizeFilled /> : <SquareMultipleRegular />}
        onClick={() => getCurrentWebviewWindow().toggleMaximize()}
        shape="square"
      />
      <Button
        className={mergeClasses(styles.button, styles.buttonDanger)}
        icon={<DismissFilled />}
        onClick={() => getCurrentWebviewWindow().close()}
        shape="square"
      />
    </div>
  )
}
