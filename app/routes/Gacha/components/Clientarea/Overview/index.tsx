import { makeStyles, tokens } from '@fluentui/react-components'
import OverviewGrid from './Grid'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
  },
})

export default function Overview () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <OverviewGrid />
    </div>
  )
}
