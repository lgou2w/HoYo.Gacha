import { makeStyles, tokens } from '@fluentui/react-components'
import { NavbarWidth } from '@/pages/Root/components/consts'
import Navs from './Navs'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100%',
    width: NavbarWidth,
    minWidth: NavbarWidth,
    maxWidth: NavbarWidth,
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
  },
  navs: {
    flex: '1 0 auto',
    height: '100%',
  },
})

export default function AppNavbar () {
  const styles = useStyles()

  return (
    <aside className={styles.root}>
      <Navs className={styles.navs} />
    </aside>
  )
}
