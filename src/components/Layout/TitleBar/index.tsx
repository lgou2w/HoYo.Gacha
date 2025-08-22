import React from 'react'
import { Subtitle2, makeStyles, tokens } from '@fluentui/react-components'
import { useLocation } from '@tanstack/react-router'
import { NavbarWidth, TitleBarHeight } from '@/components/Layout/declares'
import Locale from '@/components/Locale'
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
    minHeight: TitleBarHeight,
    maxHeight: TitleBarHeight,
    userSelect: 'none',
    backgroundColor: 'transparent',
    marginLeft: NavbarWidth,
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
    height: '100%',
    padding: `0 ${tokens.spacingHorizontalL}`,
  },
  buttons: {
    display: 'flex',
    height: '100%',
  },
})

export default function TitleBar () {
  const styles = useStyles()
  const location = useLocation()

  return (
    <header
      className={styles.root}
      data-tauri-drag-region
    >
      <Locale
        component={Subtitle2}
        className={styles.title}
        as="h1"
        wrap={false}
        mapping={[`Routes.${location.pathname}`]}
      />
      {import.meta.env.DEV && (
        <pre style={{
          margin: '0 auto',
          pointerEvents: 'none',
          fontFamily: 'serif',
        }}>CONTENT UNDER DEVELOPMENT, NOT FINAL.</pre>
      )}
      <TitleBarButtons className={styles.buttons} />
    </header>
  )
}
