import { makeStyles, tokens } from '@fluentui/react-components'
import Hero from './Hero'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    rowGap: tokens.spacingVerticalL,
  },
})

export default function Sidebar () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <Hero />
    </div>
  )
}
