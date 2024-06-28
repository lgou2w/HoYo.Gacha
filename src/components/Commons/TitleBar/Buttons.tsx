import React, { useCallback, useEffect, useState } from 'react'
import { Button, GriffelStyle, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { DismissFilled, MaximizeFilled, SubtractFilled, SquareMultipleRegular } from '@fluentui/react-icons'
import { appWindow } from '@tauri-apps/api/window'
import debounce from 'debounce'

const useStyles = makeStyles({
  root: {
    marginLeft: 'auto',
    height: '100%'
  },
  buttonMinimize: createButtonStyles([
    tokens.colorBrandBackgroundHover,
    tokens.colorBrandBackgroundPressed
  ]),
  buttonMaximize: createButtonStyles([
    tokens.colorBrandBackgroundHover,
    tokens.colorBrandBackgroundPressed
  ]),
  buttonClose: createButtonStyles([
    tokens.colorStatusDangerBackground3,
    tokens.colorStatusDangerBackground2
  ])
})

function createButtonStyles ([hover, pressed]: [string, string]): GriffelStyle {
  return {
    height: 'inherit',
    'min-width': '2.8rem',
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: tokens.colorTransparentBackground,
    ...shorthands.border(0),
    ':hover': {
      color: tokens.colorNeutralForegroundOnBrand,
      backgroundColor: hover
    },
    ':hover:active': {
      color: tokens.colorNeutralForegroundOnBrand,
      backgroundColor: pressed
    },
    '> .fui-Button__icon': {
      fontSize: tokens.fontSizeBase500,
      width: tokens.fontSizeBase500,
      height: tokens.fontSizeBase500
    }
  }
}

export default function TitleBarButtons () {
  const [maximized, setMaximized] = useState(false)
  const updateMaximized = useCallback(async () => {
    const isMaximized = await appWindow.isMaximized()
    setMaximized(isMaximized)
  }, [])

  useEffect(() => {
    updateMaximized()

    let unlisten: Awaited<ReturnType<typeof appWindow.onResized>>
    ;(async () => {
      unlisten = await appWindow.onResized(
        debounce(updateMaximized, 500, { immediate: false })
      )
    })()

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [updateMaximized])

  const classes = useStyles()
  return (
    <div className={classes.root}>
      <Button
        className={classes.buttonMinimize}
        icon={<SubtractFilled />}
        onClick={() => appWindow.minimize()}
        shape="square"
        tabIndex={-1}
      />
      <Button
        className={classes.buttonMaximize}
        icon={!maximized ? <MaximizeFilled /> : <SquareMultipleRegular />}
        onClick={() => appWindow.toggleMaximize()}
        shape="square"
        tabIndex={-1}
      />
      <Button
        className={classes.buttonClose}
        icon={<DismissFilled />}
        onClick={() => appWindow.close()}
        shape="square"
        tabIndex={-1}
      />
    </div>
  )
}
