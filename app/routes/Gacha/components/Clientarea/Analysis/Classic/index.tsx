import { makeStyles, tokens } from '@fluentui/react-components'
import { AnalysisHistories } from './Histories'
import { AnalysisTable } from './Table'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
  },
})

export default function AnalysisClassic () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <AnalysisTable />
      <AnalysisHistories />
    </div>
  )
}
