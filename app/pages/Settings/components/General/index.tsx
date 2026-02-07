import { WithTrans, withTrans } from '@/i18n'
import SectionGroup from '@/pages/Settings/components/SectionGroup'
import GachaClientareaTabs from './GachaClientareaTabs'
import Language from './Language'
import NavbarBusinessVisible from './NavbarBusinessVisible'

export default withTrans.SettingsPage(function General ({ t }: WithTrans) {
  return (
    <SectionGroup title={t('General.Title')}>
      <Language />
      <NavbarBusinessVisible />
      <GachaClientareaTabs />
    </SectionGroup>
  )
})
