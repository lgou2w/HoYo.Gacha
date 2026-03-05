import { WithTrans, withTrans } from '@/i18n'
import SectionGroup from '@/pages/Settings/components/SectionGroup'
import Lnk from './Lnk'
import Metadata from './Metadata'
import Specification from './Specification'
import Updater from './Updater'

export default withTrans.SettingsPage(function About ({ t }: WithTrans) {
  return (
    <SectionGroup title={t('About.Title')}>
      <Metadata />
      <Updater />
      <Specification />
      <Lnk />
    </SectionGroup>
  )
})
