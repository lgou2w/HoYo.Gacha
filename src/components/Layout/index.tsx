import React, { Fragment, PropsWithChildren } from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import Navbar from '@/components/Layout/Navbar'
import Notifier from '@/components/Layout/Notifier'
import Titlebar from '@/components/Layout/TitleBar'
import { TitleBarHeight } from '@/components/Layout/declares'

const useStyles = makeStyles({
  wrapper: {
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
    // https://www.zhangxinxu.com/wordpress/2022/01/css-scrollbar-gutter/
    // scrollbarGutter: 'stable both-edges',
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
  const styles = useStyles()

  return (
    <Fragment>
      <Titlebar />
      <div className={styles.wrapper}>
        <Navbar />
        <div className={styles.scroller}>
          <main className={styles.content}>
            <Notifier />
            {props.children}
          </main>
        </div>
      </div>
    </Fragment>
  )
}
