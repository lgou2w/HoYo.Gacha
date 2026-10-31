import { makeStyles, tokens } from '@fluentui/react-components'
import Spacing from '@/components/Spacing'
import LastUpdated from './LastUpdated'
import Personalization from './Personalization'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flex: '0 0 auto',
    flexWrap: 'nowrap',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalL,
  },
})

export default function ClientareaActions () {
  const styles = useStyles()
  return (
    <div className={styles.root}>
      <LastUpdated />
      <Spacing />
      <Personalization />
    </div>
  )
}
