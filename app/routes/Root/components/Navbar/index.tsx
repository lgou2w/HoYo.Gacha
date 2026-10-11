import { makeStyles, tokens } from '@fluentui/react-components'
import { NavbarWidth } from '@/routes/Root/components/types'
import Navs from './Navs'

const useStyles = makeStyles({
  root: {
    position: 'fixed',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: NavbarWidth,
    minWidth: NavbarWidth,
    maxWidth: NavbarWidth,
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
  },
})

export default function Navbar () {
  const styles = useStyles()

  return (
    <aside className={styles.root}>
      <Navs />
    </aside>
  )
}
