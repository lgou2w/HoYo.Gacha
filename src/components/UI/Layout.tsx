import React, { Fragment, PropsWithChildren } from 'react'
import { makeStyles, shorthands, tokens } from '@fluentui/react-components'
import Navbar from '@/components/UI/Navbar'
import Titlebar, { Height as TitleBarHeight } from '@/components/UI/Titlebar'

const useStyles = makeStyles({
  main: {
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
  content: {
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
    <Fragment>
      <Titlebar />
      <main className={classes.main}>
        <Navbar />
        <div className={classes.scroller}>
          <section className={classes.content}>
            {props.children}
          </section>
        </div>
      </main>
    </Fragment>
  )
}
