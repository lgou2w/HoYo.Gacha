import { Divider, makeStyles, tokens } from '@fluentui/react-components'
import Database from './components/Database'
import Features from './components/Features'
import Footer from './components/Footer'
import Hero from './components/Hero'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    rowGap: tokens.spacingVerticalL,
  },
})

export default function HomeLayout () {
  const styles = useStyles()

  return (
    <div className={styles.root}>
      <Hero />
      <Features />
      <Database />
      <Divider style={{ flexGrow: 0 }} />
      <Footer />
    </div>
  )
}
