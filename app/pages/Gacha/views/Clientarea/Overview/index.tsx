import { makeStyles, tokens } from '@fluentui/react-components'
import ClientareaLastUpdated from '@/pages/Gacha/components/Clientarea/LastUpdated'
import { usePrettizedRecords } from '@/pages/Gacha/contexts/PrettizedRecords'
import OverviewGrid from './Grid'
import OverviewTooltips from './Tooltips'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
  },
})

export default function OverviewView () {
  const styles = useStyles()
  const { data } = usePrettizedRecords()

  // FIXME: This situation usually occurs when no accounts are available.
  //   Users need to be instructed to create one manually.
  if (!data) {
    return null
  }

  return (
    <div className={styles.root}>
      <ClientareaLastUpdated />
      <OverviewGrid />
      <OverviewTooltips />
    </div>
  )
}
