import React, { PropsWithChildren } from 'react'
import { makeStyles, shorthands, tokens } from '@fluentui/react-components'
import Navbar from '@/components/Commons/Navbar'
import { Height as TitleBarHeight } from '@/components/Commons/TitleBar'
import Toaster from '@/components/Commons/Toaster'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: 'auto'
  },
  scroller: {
    display: 'block',
    width: 'inherit',
    height: `calc(100vh - ${TitleBarHeight})`,
    overflow: 'hidden auto'
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    width: 'inherit',
    rowGap: tokens.spacingHorizontalL,
    ...shorthands.padding(tokens.spacingVerticalL, tokens.spacingHorizontalL)
  }
})

export default function Layout (props: PropsWithChildren) {
  const classes = useStyles()
  return (
    <div className={classes.root}>
      <Navbar />
      <div className={classes.scroller}>
        <main className={classes.main}>
          <Toaster>
            {props.children}
          </Toaster>
        </main>
      </div>
    </div>
  )
}
