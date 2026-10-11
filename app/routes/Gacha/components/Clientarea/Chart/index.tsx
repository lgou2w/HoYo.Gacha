import { makeStyles, tokens } from '@fluentui/react-components'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
  },
})

export default function Chart () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      Chart
    </div>
  )
}
