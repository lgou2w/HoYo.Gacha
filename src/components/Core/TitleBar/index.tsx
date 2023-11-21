import React, { useEffect, useRef } from 'react'
import { Image, Subtitle2Stronger, makeStyles, tokens } from '@fluentui/react-components'
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
    maxHeight: Height,
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
    width: `calc(${Height} / 1.6)`,
    height: `calc(${Height} / 1.6)`,
    userSelect: 'none',
    pointerEvents: 'none', // Penetrates the mouse, triggering Tauri drag
    '-webkit-user-drag': 'none' // Avoid image dragging
  },
  title: {
    display: 'inline-flex',
    alignItems: 'center',
    height: '100%'
  }
})

// See: https://github.com/tauri-apps/tauri/blob/dev/core/tauri/src/window/scripts/drag.js

const AttrTauriDragRegion = 'data-tauri-drag-region'
const Title = `HoYo.Gacha - v${__APP_VERSION__}`

export default function TitleBar () {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    if (containerRef.current.hasAttribute(AttrTauriDragRegion)) return
    containerRef.current.setAttribute(AttrTauriDragRegion, '')
  }, [containerRef])

  const classes = useStyles()
  return (
    <React.Fragment>
      <div className={classes.root} ref={containerRef}>
        <Image className={classes.brand} src={Logo} shape="square" />
        <Subtitle2Stronger className={classes.title} as="h1">{Title}</Subtitle2Stronger>
        <TitleBarButtons />
      </div>
      <div className={classes.placeholder} />
    </React.Fragment>
  )
}
