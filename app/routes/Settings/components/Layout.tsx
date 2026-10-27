import { makeStyles, tokens } from '@fluentui/react-components'
import Sections from './Sections'
import Sidebar from './Sidebar'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
    columnGap: tokens.spacingHorizontalL,
  },
})

export default function SettingsLayout () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <Sections />
      <Sidebar />
    </div>
  )
}
