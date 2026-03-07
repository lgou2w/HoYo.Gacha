import { makeStyles, tokens } from '@fluentui/react-components'
import Accounts from '@/pages/Gacha/components/Toolbar/Accounts'
import ClientareaTabs from '@/pages/Gacha/components/Toolbar/ClientareaTabs'
import Converters from '@/pages/Gacha/components/Toolbar/Converters'
import GachaUrl from '@/pages/Gacha/components/Toolbar/GachaUrl'
import { ToolbarHeight } from '@/pages/Gacha/components/consts'

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

export default function ToolbarView () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <Accounts />
      <GachaUrl />
      <div className={styles.actions}>
        <div aria-label="spacing" aria-hidden />
        <ClientareaTabs />
        <Converters />
      </div>
    </div>
  )
}
