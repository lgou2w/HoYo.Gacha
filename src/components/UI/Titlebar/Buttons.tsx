import React, { useCallback, useEffect, useState } from 'react'
import { Button, GriffelStyle, buttonClassNames, makeStyles, tokens } from '@fluentui/react-components'
import { DismissFilled, MaximizeFilled, SquareMultipleRegular, SubtractFilled } from '@fluentui/react-icons'
import { WebviewWindow, getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import debounce from 'debounce'

const useStyles = makeStyles({
  root: {
    marginLeft: 'auto',
    height: '100%',
  },
  buttonMinimize: createButtonStyles([
    tokens.colorBrandBackgroundHover,
    tokens.colorBrandBackgroundPressed,
  ]),
  buttonMaximize: createButtonStyles([
    tokens.colorBrandBackgroundHover,
    tokens.colorBrandBackgroundPressed,
  ]),
  buttonClose: createButtonStyles([
    tokens.colorStatusDangerBackground3,
    tokens.colorStatusDangerBackground2,
  ]),
})

function createButtonStyles ([hover, pressed]: [string, string]): GriffelStyle {
  return {
    height: 'inherit',
    minWidth: '2.8rem',
    backgroundColor: tokens.colorTransparentBackground,
    border: 0,
    ':hover': {
      color: tokens.colorNeutralForegroundOnBrand,
      backgroundColor: hover,
    },
    ':hover:active': {
      color: tokens.colorNeutralForegroundOnBrand,
      backgroundColor: pressed,
    },
    [`& .${buttonClassNames.icon}`]: {
      fontSize: tokens.fontSizeBase500,
      width: tokens.fontSizeBase500,
      height: tokens.fontSizeBase500,
    },
  }
}

export default function TitleBarButtons () {
  const classes = useStyles()
  const [maximized, setMaximized] = useState(false)
  const updateMaximized = useCallback(async () => {
    const isMaximized = await getCurrentWebviewWindow().isMaximized()
    setMaximized(isMaximized)
  }, [])

  useEffect(() => {
    updateMaximized()

    let unlisten: Awaited<ReturnType<WebviewWindow['onResized']>>
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
    <div className={classes.root}>
      <Button
        className={classes.buttonMinimize}
        icon={<SubtractFilled />}
        onClick={() => getCurrentWebviewWindow().minimize()}
        shape="square"
        tabIndex={-1}
      />
      <Button
        className={classes.buttonMaximize}
        icon={!maximized ? <MaximizeFilled /> : <SquareMultipleRegular />}
        onClick={() => getCurrentWebviewWindow().toggleMaximize()}
        shape="square"
        tabIndex={-1}
      />
      <Button
        className={classes.buttonClose}
        icon={<DismissFilled />}
        onClick={() => getCurrentWebviewWindow().close()}
        shape="square"
        tabIndex={-1}
      />
    </div>
  )
}
