import React from 'react'
import { Subtitle2Stronger, makeStyles, shorthands, tokens } from '@fluentui/react-components'
import { useLocation } from '@tanstack/react-router'
import Locale from '@/components/UI/Locale'
import { NavbarWidth, TitleBarHeight } from '@/components/UI/consts'
import TitleBarButtons from './Buttons'

const useStyles = makeStyles({
  root: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    display: 'flex',
    alignItems: 'center',
    height: TitleBarHeight,
    maxHeight: TitleBarHeight,
    userSelect: 'none',
    backgroundColor: 'transparent',
    marginLeft: NavbarWidth,
    ...shorthands.borderBottom(tokens.strokeWidthThin, 'solid', tokens.colorNeutralStroke1)
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
    height: '100%',
    ...shorthands.padding(0, tokens.spacingHorizontalL)
  }
})

export default function TitleBar () {
  const classes = useStyles()
  const location = useLocation()

  return (
    <header
      className={classes.root}
      data-tauri-drag-region
    >
      <Locale
        className={classes.title}
        component={Subtitle2Stronger}
        as="h1"
        mapping={[`Components.UI.Navbar.TabList.${location.pathname}`]}
      />
      {import.meta.env.DEV && (
        <pre style={{
          margin: '0 auto',
          pointerEvents: 'none'
        }}>CONTENT UNDER DEVELOPMENT, NOT FINAL.</pre>
      )}
      <TitleBarButtons />
    </header>
  )
}
