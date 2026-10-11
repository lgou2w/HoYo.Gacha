import { makeStyles, tokens } from '@fluentui/react-components'
import AnalysisColumns from './Columns'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
  },
})

export default function Analysis () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <AnalysisColumns />
    </div>
  )
}
