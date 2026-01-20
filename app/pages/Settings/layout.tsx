import { makeStyles, tokens } from '@fluentui/react-components'
import About from '@/pages/Settings/components/About'
import Appearance from '@/pages/Settings/components/Appearance'
import General from '@/pages/Settings/components/General'
import LegacyMigration from '@/pages/Settings/components/LegacyMigration'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingHorizontalL,
  },
})

export default function SettingsLayout () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <LegacyMigration />
      <General />
      <Appearance />
      <About />
    </div>
  )
}
