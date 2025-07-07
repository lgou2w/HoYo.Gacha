import React, { PropsWithChildren } from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import Navbar from '@/components/Layout/Navbar'
import Notifier from '@/components/Layout/Notifier'
import Titlebar from '@/components/Layout/TitleBar'
import { NavbarWidth, TitleBarHeight } from '@/components/Layout/declares'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    width: '100vw',
    height: '100vh',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    width: `calc(100% - ${NavbarWidth})`,
    height: `calc(100% - ${TitleBarHeight})`,
    marginTop: TitleBarHeight,
    marginLeft: NavbarWidth,
    overflow: 'hidden auto',
    // https://www.zhangxinxu.com/wordpress/2022/01/css-scrollbar-gutter/
    // scrollbarGutter: 'stable both-edges',
  },
  wrapper: {
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
    flex: 1,
  },
})

export default function Layout (props: PropsWithChildren) {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <Navbar />
      <div className={styles.content}>
        <Titlebar />
        <Notifier />
        <div className={styles.wrapper}>
          {props.children}
        </div>
      </div>
    </div>
  )
}
