import React, { useCallback, useEffect, useState } from 'react'
import { Button, GriffelStyle, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { DismissFilled, MaximizeFilled, SubtractFilled, SquareMultipleRegular } from '@fluentui/react-icons'
import { appWindow } from '@tauri-apps/api/window'

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
      fontSize: '1.25rem',
      width: '1.25rem',
      height: '1.25rem'
    }
  }
}

export default function TitleBarButtons () {
  const [maximized, setMaximized] = useState(false)

  useEffect(() => {
    appWindow
      .isMaximized()
      .then((val) => setMaximized(val))
      .catch(console.error)
  }, [])

  const handleMaximize = useCallback(async () => {
    maximized
      ? await appWindow.unmaximize()
      : await appWindow.maximize()
    setMaximized(!maximized)
  }, [maximized])

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
        onClick={handleMaximize}
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
