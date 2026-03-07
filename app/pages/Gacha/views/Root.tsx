import { makeStyles, tokens } from '@fluentui/react-components'
import { PrettizedRecordsProvider } from '@/pages/Gacha/contexts/PrettizedRecords'
import ClientareaView from './Clientarea'
import ToolbarView from './Toolbar'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
  },
})

export default function RootView () {
  const styles = useStyles()

  return (
    <PrettizedRecordsProvider>
      <div className={styles.root}>
        <ToolbarView />
        <ClientareaView />
      </div>
    </PrettizedRecordsProvider>
  )
}
