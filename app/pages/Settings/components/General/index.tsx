import { WithTrans, withTrans } from '@/i18n'
import SectionGroup from '@/pages/Settings/components/SectionGroup'
import GachaClientareaTabs from './GachaClientareaTabs'
import Language from './Language'

export default withTrans.SettingsPage(function General ({ t }: WithTrans) {
  return (
    <SectionGroup title={t('General.Title')}>
      <Language />
      <GachaClientareaTabs />
    </SectionGroup>
  )
})
