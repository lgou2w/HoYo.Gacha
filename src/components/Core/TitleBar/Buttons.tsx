import React, { useCallback, useEffect, useState } from 'react'
import { Button, GriffelStyle, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { DismissFilled, MaximizeFilled, SubtractFilled, SquareMultipleRegular } from '@fluentui/react-icons'
import { appWindow } from '@tauri-apps/api/window'

const IconSize = '1.25rem'
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
  ]),
  icon: {
    fontSize: IconSize,
    width: IconSize,
    height: IconSize
  }
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
        icon={{ className: classes.icon, children: <SubtractFilled /> }}
        onClick={() => appWindow.minimize()}
        shape="square"
        tabIndex={-1}
      />
      <Button
        className={classes.buttonMaximize}
        icon={{
          className: classes.icon,
          children: !maximized
            ? <MaximizeFilled />
            : <SquareMultipleRegular />
        }}
        onClick={handleMaximize}
        shape="square"
        tabIndex={-1}
      />
      <Button
        className={classes.buttonClose}
        icon={{ className: classes.icon, children: <DismissFilled /> }}
        onClick={() => appWindow.close()}
        shape="square"
        tabIndex={-1}
      />
    </div>
  )
}
