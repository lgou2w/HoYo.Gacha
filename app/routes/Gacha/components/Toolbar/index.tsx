import { makeStyles, tokens } from '@fluentui/react-components'
import Spacing from '@/components/Spacing'
import { ToolbarHeight } from '@/routes/Gacha/components/types'
import AccountMenu from './AccountMenu'
import ClientareaTabs from './ClientareaTabs'
import GachaUrl from './GachaUrl'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flex: '0 0 auto',
    columnGap: tokens.spacingHorizontalL,
    alignItems: 'center',
    height: ToolbarHeight,
    minHeight: ToolbarHeight,
    maxHeight: ToolbarHeight,
  },
  actions: {
    display: 'inline-flex',
    flexDirection: 'row',
    flex: '1 0 auto',
    justifyContent: 'space-between',
  },
})

export default function Toolbar () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <AccountMenu />
      <GachaUrl />
      <div className={styles.actions}>
        <Spacing />
        <ClientareaTabs />
        <Spacing />
      </div>
    </div>
  )
}
