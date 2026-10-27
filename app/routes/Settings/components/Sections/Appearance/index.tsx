import { KnownI18nNs } from '@/i18n'
import Section from '@/routes/Settings/components/Sections/Section'
import ColorScheme from './ColorScheme'
import Font from './Font'
import Namespace from './Namespace'
import ScaleLevel from './ScaleLevel'

export default function Appearance () {
  return (
    <Section title={{ tKey: 'Appearance.Title', tNs: KnownI18nNs.SettingsPage }}>
      <Namespace />
      <ColorScheme />
      <ScaleLevel />
      <Font />
    </Section>
  )
}
