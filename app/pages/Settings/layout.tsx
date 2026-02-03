import { makeStyles, tokens } from '@fluentui/react-components'
import About from '@/pages/Settings/components/About'
import Appearance from '@/pages/Settings/components/Appearance'
import General from '@/pages/Settings/components/General'
import Hero from '@/pages/Settings/components/Hero'
import LegacyMigration from '@/pages/Settings/components/LegacyMigration'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: '1 0 auto',
    gap: tokens.spacingHorizontalL,
  },
  sections: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 70%',
    rowGap: tokens.spacingVerticalL,
  },
  hero: {
    display: 'flex',
    flex: 1,
  },
})

export default function SettingsLayout () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <div className={styles.sections}>
        <LegacyMigration />
        <General />
        <Appearance />
        <About />
      </div>
      <div className={styles.hero}>
        <Hero />
      </div>
    </div>
  )
}
