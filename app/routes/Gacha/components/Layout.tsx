import { makeStyles, tokens } from '@fluentui/react-components'
import Clientarea from './Clientarea'
import Toolbar from './Toolbar'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
  },
})

export default function GachaLayout () {
  const styles = useStyles()
  return (
    <div className={styles.root}>
      <Toolbar />
      <Clientarea />
    </div>
  )
}
