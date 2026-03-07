import { WithTrans, withTrans } from '@/i18n'
import SectionGroup from '@/pages/Settings/components/SectionGroup'
import ColorScheme from './ColorScheme'
import Font from './Font'
import Namespace from './Namespace'
import ScaleLevel from './ScaleLevel'

export default withTrans.SettingsPage(function Appearance ({ t }: WithTrans) {
  return (
    <SectionGroup title={t('Appearance.Title')}>
      <Namespace />
      <ColorScheme />
      <ScaleLevel />
      <Font />
    </SectionGroup>
  )
})
