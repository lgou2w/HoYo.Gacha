import { PropsWithChildren } from 'react'
import { makeStyles, tokens } from '@fluentui/react-components'
import { NavbarWidth, TitleBarHeight } from '@/routes/Root/components/types'
import { MainScrollableAreaId } from '@/routes/types'
import Navbar from './Navbar'
import TitleBar from './TitleBar'

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
    rowGap: tokens.spacingVerticalL,
    margin: tokens.spacingVerticalL,
  },
})

export default function Layout (props: PropsWithChildren) {
  const styles = useStyles()
  return (
    <div className={styles.root}>
      <Navbar />
      <main className={styles.content} id={MainScrollableAreaId}>
        <TitleBar />
        <div className={styles.wrapper}>
          {props.children}
        </div>
      </main>
    </div>
  )
}
