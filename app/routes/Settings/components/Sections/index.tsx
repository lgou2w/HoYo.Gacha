import { makeStyles, tokens } from '@fluentui/react-components'
import About from './About'
import Appearance from './Appearance'
import General from './General'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 70%',
    rowGap: tokens.spacingVerticalL,
  },
})

export default function Sections () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <General />
      <Appearance />
      <About />
    </div>
  )
}
