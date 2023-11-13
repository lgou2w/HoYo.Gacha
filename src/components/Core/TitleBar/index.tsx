import React, { useEffect, useRef } from 'react'
import { Image, Subtitle2, makeStyles, tokens } from '@fluentui/react-components'
import Logo from '@/assets/images/Logo.png'
import TitleBarButtons from './Buttons'

export const Height = '2.5rem'
const useStyles = makeStyles({
  root: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    display: 'flex',
    alignItems: 'center',
    height: Height,
    userSelect: 'none',
    color: tokens.colorNeutralForegroundOnBrand,
    backgroundColor: tokens.colorBrandBackground,
    boxShadow: tokens.shadow2,
    paddingLeft: tokens.spacingHorizontalS,
    columnGap: tokens.spacingVerticalS
  },
  placeholder: {
    width: '100%',
    height: Height
  },
  brand: {
    width: '1.5rem',
    height: '1.5rem',
    userSelect: 'none'
  }
})

// See: https://github.com/tauri-apps/tauri/blob/dev/core/tauri/src/window/scripts/drag.js

const AttrTauriDragRegion = 'data-tauri-drag-region'
const Title = `HoYo.Gacha - v${__APP_VERSION__}`

function applyTauriDragRegion (element: Element) {
  element.setAttribute(AttrTauriDragRegion, '')
}

export default function TitleBarInner () {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (containerRef.current.hasAttribute(AttrTauriDragRegion)) return

    applyTauriDragRegion(containerRef.current)
    for (const child of containerRef.current.children) {
      applyTauriDragRegion(child)
    }
  }, [containerRef])

  const classes = useStyles()
  return (
    <React.Fragment>
      <div className={classes.root} ref={containerRef}>
        <Image className={classes.brand} src={Logo} shape="square" />
        <Subtitle2 as="h1">{Title}</Subtitle2>
        <TitleBarButtons />
      </div>
      <div className={classes.placeholder} />
    </React.Fragment>
  )
}
