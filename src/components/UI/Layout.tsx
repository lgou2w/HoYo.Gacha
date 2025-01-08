import React, { Fragment, PropsWithChildren } from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import Navbar from '@/components/UI/Navbar'
import Titlebar from '@/components/UI/TitleBar'
import { TitleBarHeight } from '@/components/UI/consts'

const useStyles = makeStyles({
  main: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100vh',
  },
  scroller: {
    display: 'block',
    width: 'inherit',
    height: `calc(100vh - ${TitleBarHeight})`,
    marginTop: TitleBarHeight,
    overflow: 'hidden auto',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    width: 'inherit',
    rowGap: tokens.spacingHorizontalL,
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
  },
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
