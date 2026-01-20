import { PropsWithChildren } from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import AppNavbar from './AppNavbar'
import AppTitleBar from './AppTitleBar'
import Notifier from './Notifier'
import { NavbarWidth, TitleBarHeight } from './consts'

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
    overflow: 'hidden auto',
    marginTop: TitleBarHeight,
    marginLeft: NavbarWidth,
    width: `calc(100% - ${NavbarWidth})`,
    height: `calc(100% - ${TitleBarHeight})`,
  },
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    margin: tokens.spacingVerticalL,
  },
})

export default function AppLayout (props: PropsWithChildren) {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <AppNavbar />
      <main className={styles.content}>
        <AppTitleBar />
        <Notifier />
        <div className={styles.wrapper}>
          {props.children}
        </div>
      </main>
    </div>
  )
}
