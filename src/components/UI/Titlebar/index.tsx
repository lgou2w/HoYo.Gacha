import React, { useEffect, useRef } from 'react'
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
    display: 'inline-flex',
    alignItems: 'center',
    pointerEvents: 'none',
    height: '100%',
    ...shorthands.padding(0, tokens.spacingHorizontalL)
  }
})

// See: https://github.com/tauri-apps/tauri/blob/dev/core/tauri/src/window/scripts/drag.js
const AttrTauriDragRegion = 'data-tauri-drag-region'

export default function TitleBar () {
  const classes = useStyles()
  const containerRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    if (!containerRef.current) return
    if (containerRef.current.hasAttribute(AttrTauriDragRegion)) return
    containerRef.current.setAttribute(AttrTauriDragRegion, '')
  }, [containerRef])

  return (
    <header className={classes.root} ref={containerRef}>
      <Locale
        className={classes.title}
        component={Subtitle2Stronger}
        as="h1"
        mapping={[`Components.UI.Navbar.TabList.${location.pathname}`]}
      />
      {import.meta.env.DEV && (
        <pre style={{ margin: '0 auto' }}>CONTENT UNDER DEVELOPMENT, NOT FINAL.</pre>
      )}
      <TitleBarButtons />
    </header>
  )
}
