import { WithTrans, withTrans } from '@/i18n'
import SectionGroup from '@/pages/Settings/components/SectionGroup'
import Metadata from './Metadata'
import Specification from './Specification'
import Updater from './Updater'

export default withTrans.SettingsPage(function About ({ t }: WithTrans) {
  return (
    <SectionGroup title={t('About.Title')}>
      <Updater />
      <Metadata />
      <Specification />
    </SectionGroup>
  )
})
